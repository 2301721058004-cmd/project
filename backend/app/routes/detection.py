"""
Detection Routes - Image/Video upload, YOLO processing, Results serving
"""
import os
import base64
import requests
import numpy as np
from flask import Blueprint, request, send_from_directory, current_app, session, Response
from werkzeug.utils import secure_filename
from app.models.detection import DetectionEvent
from app.models.daily_summary import DailySummary
from app.services.yolo_service import get_yolo_service
from app.utils.helpers import login_required, allowed_file, generate_filename, success_response, error_response, is_video_file, is_image_file
from datetime import datetime
import cv2

detection_bp = Blueprint('detection', __name__)
yolo_service = get_yolo_service()

@detection_bp.route('/upload', methods=['POST'])
@login_required
def upload_file():
    """Upload image or video and run detection"""
    try:
        # Check for file in request
        if 'file' not in request.files and 'image' not in request.files and 'video' not in request.files:
            return error_response('No file provided')
        
        # Support both 'file', 'image', and 'video' field names
        file = request.files.get('file') or request.files.get('image') or request.files.get('video')
        
        if file.filename == '':
            return error_response('No file selected')
        
        if not allowed_file(file.filename):
            return error_response('Invalid file type. Allowed: png, jpg, jpeg, gif, bmp, webp, mp4, avi, mov, mkv, flv, wmv, webm')
        
        zone_id = request.form.get('zone_id')
        camera_id = request.form.get('camera_id')
        
        filename = generate_filename(secure_filename(file.filename))
        upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(upload_path)
        
        # Check if uploaded file is video or image
        if is_video_file(filename):
            return _process_video(upload_path, filename, zone_id, camera_id, session['user_id'])
        else:
            return _process_image(upload_path, filename, zone_id, camera_id, session['user_id'])
        
    except Exception as e:
        return error_response(str(e), 500)


def _process_image(upload_path, filename, zone_id, camera_id, user_id):
    """Process image upload and detection"""
    try:
        from app.models.zone import Zone
        
        result = yolo_service.detect(upload_path)
        
        if not result['success']:
            return error_response(f"Detection failed: {result.get('error', 'Unknown error')}")
        
        # Get zone and camera names for better file organization
        zone_name = 'Unknown'
        camera_name = 'Unknown'
        
        if zone_id:
            zone = Zone.get_by_id(zone_id)
            if zone:
                zone_name = zone.get('name', 'Unknown').replace(' ', '_')
        
        if camera_id and zone_id:
            zone = Zone.get_by_id(zone_id)
            if zone:
                cameras = zone.get('cameras', [])
                for cam in cameras:
                    if str(cam.get('_id')) == str(camera_id):
                        camera_name = cam.get('name', 'Unknown').replace(' ', '_')
                        break
        
        # Generate filename with zone and camera name
        annotated_filename = f"det_{zone_name}_{camera_name}_{filename}"
        annotated_path = os.path.join(current_app.config['DETECTION_FOLDER'], annotated_filename)
        cv2.imwrite(annotated_path, result['annotated_image'])
        
        detection_event = DetectionEvent.create_detection(
            camera_id=camera_id,
            zone_id=zone_id,
            has_violation=result['has_violation'],
            violations_count=result['violations_count'],
            people_count=result['people_count'],
            detections=result['detections'],
            annotated_image_path=annotated_filename,
            uploaded_by=user_id,
            file_type='image',
            camera_name=camera_name,
            zone_name=zone_name
        )
        
        # Update daily summary if violations found
        if result['has_violation'] and result['violations_count'] > 0 and zone_id:
            DailySummary.increment_daily_summary(
                date=datetime.utcnow(),
                zone_id=zone_id,
                increment_count=result['violations_count'],
                frame_path=annotated_filename
            )
        
        return success_response(data={
            'detection': detection_event,
            'image_url': f"/api/detection/image/{annotated_filename}"
        }, message='Detection completed')
        
    except Exception as e:
        return error_response(str(e), 500)


def _process_video(upload_path, filename, zone_id, camera_id, user_id):
    """Process video upload and detection - returns annotated violation frames"""
    try:
        from app.models.zone import Zone
        
        # Get zone and camera names for better file organization
        zone_name = 'Unknown'
        camera_name = 'Unknown'
        
        if zone_id:
            zone = Zone.get_by_id(zone_id)
            if zone:
                zone_name = zone.get('name', 'Unknown').replace(' ', '_')
        
        if camera_id and zone_id:
            zone = Zone.get_by_id(zone_id)
            if zone:
                cameras = zone.get('cameras', [])
                for cam in cameras:
                    if str(cam.get('_id')) == str(camera_id):
                        camera_name = cam.get('name', 'Unknown').replace(' ', '_')
                        break
        
        # Run detection on video - returns violation frames only (no video generation)
        result = yolo_service.detect_video(upload_path, output_path=None, frame_skip=5)
        
        if not result['success']:
            return error_response(f"Detection failed: {result.get('error', 'Unknown error')}")
        
        # Create detection event in database
        detection_event = DetectionEvent.create_detection(
            camera_id=camera_id,
            zone_id=zone_id,
            has_violation=result['has_violation'],
            violations_count=result['violations_count'],
            people_count=result['people_count'],
            detections=result['detections'],
            annotated_image_path=result.get('violation_image_path'),
            uploaded_by=user_id,
            file_type='image',  # Store as image type for consistent frontend display
            camera_name=camera_name,
            zone_name=zone_name,
            extra_data={
                'total_frames': result['total_frames'],
                'processed_frames': result['processed_frames'],
                'frames_with_violations': result.get('frames_with_violations', 0),
                'average_violations_per_frame': result.get('average_violations_per_frame', 0),
                'violation_image_path': result.get('violation_image_path'),
                'source': 'video_upload'
            }
        )
        
        # Update daily summary if violations found
        if result['has_violation'] and result['violations_count'] > 0 and zone_id:
            DailySummary.increment_daily_summary(
                date=datetime.utcnow(),
                zone_id=zone_id,
                increment_count=result['violations_count'],
                frame_path=result.get('violation_image_path')
            )
        
        return success_response(data={
            'detection': detection_event,
            'image_url': f"/api/detection/image/{result.get('violation_image_path')}" if result.get('violation_image_path') else None,
            'stats': {
                'total_frames': result['total_frames'],
                'processed_frames': result['processed_frames'],
                'frames_with_violations': result.get('frames_with_violations', 0),
                'people_detected': result.get('people_count', 0),
                'violations_count': result.get('violations_count', 0)
            }
        }, message='Video detection completed - violation frame extracted')
        
    except Exception as e:
        return error_response(str(e), 500)

@detection_bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    """Get general detection statistics"""
    try:
        from app.models.zone import Zone
        
        if session.get('role') == 'admin':
            # Get zones for this admin
            zones = Zone.get_all_zones(admin_id=session['user_id'])
            zone_ids = [zone['id'] for zone in zones]
            stats = DetectionEvent.get_stats(zone_ids=zone_ids)
        else:
            stats = DetectionEvent.get_stats(uploaded_by=session['user_id'])
        
        return success_response(data={'stats': stats})
    except Exception as e:
        return error_response(str(e), 500)

@detection_bp.route('/events', methods=['GET'])
@login_required
def get_events():
    """Get all detection events"""
    try:
        from app.models.zone import Zone
        
        filters = {}
        allowed_zone_ids = None
        
        if session.get('role') == 'admin':
            # Get zones for this admin
            zones = Zone.get_all_zones(admin_id=session['user_id'])
            allowed_zone_ids = [zone['id'] for zone in zones]
        else:
            filters['uploaded_by'] = session['user_id']
        
        zone_id = request.args.get('zone_id')
        if zone_id:
            filters['zone_id'] = zone_id
        
        has_violation = request.args.get('has_violation')
        if has_violation is not None:
            filters['has_violation'] = has_violation.lower() == 'true'
        
        events = DetectionEvent.get_all_detections(filters)
        
        # Further filter events by admin's zones if applicable
        if allowed_zone_ids is not None:
            events = [e for e in events if e.get('zone_id') in allowed_zone_ids]
        
        return success_response(data={'events': events})
        
    except Exception as e:
        return error_response(str(e), 500)

@detection_bp.route('/events/by-zone', methods=['GET'])
@login_required
def get_events_by_zone():
    """Get detection events grouped by zones"""
    try:
        from app.models.zone import Zone
        
        filters = {}
        allowed_zone_ids = None
        
        if session.get('role') == 'admin':
            # Get zones for this admin
            zones = Zone.get_all_zones(admin_id=session['user_id'])
            allowed_zone_ids = [zone['id'] for zone in zones]
        else:
            filters['uploaded_by'] = session['user_id']
        
        has_violation = request.args.get('has_violation')
        if has_violation is not None:
            filters['has_violation'] = has_violation.lower() == 'true'
        
        # Get all detections
        events = DetectionEvent.get_all_detections(filters)
        
        # Further filter events by admin's zones if applicable
        if allowed_zone_ids is not None:
            events = [e for e in events if e.get('zone_id') in allowed_zone_ids]
        
        # Group detections by zone
        zones_dict = {}
        
        for event in events:
            zone_id = event.get('zone_id')
            if not zone_id:
                # Handle detections without zone
                if 'No Zone' not in zones_dict:
                    zones_dict['No Zone'] = {
                        'zone_id': None,
                        'zone_name': 'No Zone',
                        'location': 'Unassigned',
                        'detections': [],
                        'total': 0,
                        'violations': 0
                    }
                zones_dict['No Zone']['detections'].append(event)
                zones_dict['No Zone']['total'] += 1
                if event.get('has_violation'):
                    zones_dict['No Zone']['violations'] += 1
            else:
                # Fetch zone info if not already cached
                if zone_id not in zones_dict:
                    zone = Zone.get_by_id(zone_id)
                    zone_name = zone['name'] if zone else f'Zone {zone_id[:8]}'
                    location = zone.get('location', '') if zone else 'Unknown'
                    zones_dict[zone_id] = {
                        'zone_id': zone_id,
                        'zone_name': zone_name,
                        'location': location,
                        'detections': [],
                        'total': 0,
                        'violations': 0
                    }
                
                zones_dict[zone_id]['detections'].append(event)
                zones_dict[zone_id]['total'] += 1
                if event.get('has_violation'):
                    zones_dict[zone_id]['violations'] += 1
        
        # Convert to list and sort by most recent detection
        zones_list = list(zones_dict.values())
        zones_list.sort(
            key=lambda z: max([d.get('timestamp', '') for d in z['detections']], default=''),
            reverse=True
        )
        
        return success_response(data={'zones': zones_list})
        
    except Exception as e:
        return error_response(str(e), 500)

@detection_bp.route('/violations', methods=['GET'])
@login_required
def get_violations():
    """Get all violations"""
    try:
        from app.models.zone import Zone
        
        filters = {}
        allowed_zone_ids = None
        
        if session.get('role') == 'admin':
            # Get zones for this admin
            zones = Zone.get_all_zones(admin_id=session['user_id'])
            allowed_zone_ids = [zone['id'] for zone in zones]
        else:
            filters['uploaded_by'] = session['user_id']
        
        zone_id = request.args.get('zone_id')
        if zone_id:
            filters['zone_id'] = zone_id
        
        violations = DetectionEvent.get_violations(filters)
        
        # Further filter violations by admin's zones if applicable
        if allowed_zone_ids is not None:
            violations = [v for v in violations if v.get('zone_id') in allowed_zone_ids]
        
        return success_response(data={'violations': violations})
        
    except Exception as e:
        return error_response(str(e), 500)

@detection_bp.route('/image/<filename>', methods=['GET'])
def serve_image(filename):
    """Serve detection result images"""
    try:
        filepath = os.path.join(current_app.config['DETECTION_FOLDER'], filename)
        
        # Security: Prevent directory traversal
        if not os.path.abspath(filepath).startswith(os.path.abspath(current_app.config['DETECTION_FOLDER'])):
            return error_response('Access denied', 403)
        
        if not os.path.exists(filepath):
            print(f"[ERROR] Image not found: {filepath}")
            print(f"[INFO] Detection folder: {current_app.config['DETECTION_FOLDER']}")
            return error_response('Image not found', 404)
        
        return send_from_directory(
            current_app.config['DETECTION_FOLDER'],
            filename,
            mimetype='image/jpeg'
        )
    except Exception as e:
        print(f"[ERROR] Failed to serve image {filename}: {str(e)}")
        return error_response(f'Failed to serve image: {str(e)}', 500)


@detection_bp.route('/video/<filename>', methods=['GET'])
def serve_video(filename):
    """Serve detection result videos with range request support"""
    try:
        filepath = os.path.join(current_app.config['DETECTION_FOLDER'], filename)
        
        # Security: Prevent directory traversal
        if not os.path.abspath(filepath).startswith(os.path.abspath(current_app.config['DETECTION_FOLDER'])):
            return error_response('Access denied', 403)
        
        if not os.path.exists(filepath):
            print(f"[ERROR] Video not found: {filepath}")
            return error_response('Video not found', 404)
        
        # Get file size
        file_size = os.path.getsize(filepath)
        
        # Handle range requests for video seeking
        range_header = request.headers.get('Range')
        if range_header:
            try:
                # Parse range header (e.g., "bytes=0-1023")
                range_match = range_header.split('=')[1].split('-')
                start = int(range_match[0])
                end = int(range_match[1]) if range_match[1] else file_size - 1
                
                # Validate range
                if start > end or start >= file_size:
                    return error_response('Invalid range', 416)
                
                # Read the requested range
                with open(filepath, 'rb') as f:
                    f.seek(start)
                    data = f.read(end - start + 1)
                
                response = Response(data, status=206, mimetype='video/mp4')
                response.headers['Content-Range'] = f'bytes {start}-{end}/{file_size}'
                response.headers['Accept-Ranges'] = 'bytes'
                response.headers['Content-Length'] = end - start + 1
                response.headers['Connection'] = 'keep-alive'
                response.headers['Access-Control-Allow-Origin'] = '*'
                response.headers['Access-Control-Allow-Credentials'] = 'true'
                return response
            except Exception as e:
                print(f"[ERROR] Range request failed: {e}")
                # Fall back to regular serving
                pass
        
        # Determine MIME type based on file extension
        _, ext = os.path.splitext(filename)
        if ext.lower() in ['.avi']:
            mimetype = 'video/x-msvideo'
        elif ext.lower() in ['.mov']:
            mimetype = 'video/quicktime'
        else:
            mimetype = 'video/mp4'  # Default to mp4
        
        return send_from_directory(
            current_app.config['DETECTION_FOLDER'],
            filename,
            mimetype=mimetype,
            as_attachment=False
        )
    except Exception as e:
        print(f"[ERROR] Failed to serve video {filename}: {str(e)}")
        return error_response(f'Failed to serve video: {str(e)}', 500)