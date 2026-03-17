"""
Admin Routes - Zone management, Camera management, Supervisor management, Violations
"""
from flask import Blueprint, request, session
from bson import ObjectId
from app import mongo
from app.models.user import User
from app.models.zone import Zone
from app.models.detection import DetectionEvent
from app.utils.helpers import admin_required, success_response, error_response

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/dashboard-stats', methods=['GET'])
@admin_required
def dashboard_stats():
    """Get dashboard statistics for admin"""
    try:
        # Get admin's zones
        all_zones = Zone.get_all_zones(session['user_id'])
        zone_ids = [zone['id'] for zone in all_zones]
        
        # Get detections only for admin's zones
        all_detections = DetectionEvent.get_all_detections()
        admin_detections = [d for d in all_detections if d.get('zone_id') in zone_ids]
        
        # Calculate stats from filtered detections
        total_scans_processed = len(admin_detections)
        
        # Calculate people-based metrics
        total_people = 0
        people_no_helmet = 0
        for d in admin_detections:
            # If we have people_count from the newer schema, use it. Otherwise compute it.
            if 'people_count' in d:
                total_people += d.get('people_count', 0)
            else:
                for det_obj in d.get('detections', []):
                    if det_obj.get('class', '').lower() in ['person', 'head', 'helmet', 'no_helmet', 'without_helmet', 'no-helmet']:
                        total_people += 1
                        
            people_no_helmet += d.get('violations_count', 0)
                    
        total_violations_events = len([d for d in admin_detections if d.get('has_violation')])
        people_with_helmet = max(0, total_people - people_no_helmet)
        
        zone_count = len(all_zones)
        supervisor_count = len(User.get_all_supervisors())
        total_cameras = sum(len(zone.get('cameras', [])) for zone in all_zones)
        
        # Compliance rate percentage based on people
        compliance_rate = 0 if total_people == 0 else round((people_with_helmet / total_people) * 100, 2)
        
        # Get violation details for trend analysis (only for admin's zones)
        all_violations = [d for d in admin_detections if d.get('has_violation')]
        recent_violations = sorted(all_violations, key=lambda v: v.get('timestamp', ''), reverse=True)[:5]
        
        # Zone-wise statistics (based on people)
        zone_stats = []
        for zone in all_zones:
            z_detections = [d for d in admin_detections if str(d.get('zone_id', '')) == str(zone.get('id', ''))]
            
            z_people = 0
            z_no_helmet = 0
            for d in z_detections:
                if 'people_count' in d:
                    z_people += d.get('people_count', 0)
                else:
                    for det_obj in d.get('detections', []):
                        if det_obj.get('class', '').lower() in ['person', 'head', 'helmet', 'no_helmet', 'without_helmet', 'no-helmet']:
                            z_people += 1
                
                z_no_helmet += d.get('violations_count', 0)
                        
            zone_stats.append({
                'name': zone.get('name', 'Unknown'),
                'violations': z_no_helmet,
                'detections': z_people, # This is now people
            })
        
        return success_response(data={
            'stats': {
                'total_detections': total_people, # Map total_detections to total_people for frontend compatibility
                'total_violations': people_no_helmet, # Map total_violations to total people without helmets
                'total_zones': zone_count,
                'total_supervisors': supervisor_count,
                'total_cameras': total_cameras,
                'compliance_rate': compliance_rate,
                'detection_success_rate': round((people_with_helmet / total_people) * 100, 2) if total_people > 0 else 0,
                'total_scans_processed': total_scans_processed
            },
            'chart_data': {
                'violation_ratio': [
                    {'name': 'Helmet Worn', 'value': people_with_helmet, 'fill': '#10b981'},
                    {'name': 'No Helmet', 'value': people_no_helmet, 'fill': '#ef4444'},
                ],
                'zone_stats': zone_stats,
            },
            'recent_violations': recent_violations,
            'violation_count': people_no_helmet, # Map violation count to total people without helmets
            'detection_count': total_people # Map detection count to total people
        })
        
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/zones', methods=['GET'])
@admin_required
def get_zones():
    """Get all zones for admin"""
    try:
        zones = Zone.get_all_zones(admin_id=session['user_id'])
        return success_response(data={'zones': zones})
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/zones', methods=['POST'])
@admin_required
def create_zone():
    """Create new zone"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return error_response('Zone name is required')
        
        zone = Zone.create_zone(
            name=data['name'],
            location=data.get('location', ''),
            admin_id=session['user_id']
        )
        
        return success_response(
            data={'zone': zone},
            message='Zone created successfully'
        )
        
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/zones/<zone_id>', methods=['DELETE'])
@admin_required
def delete_zone(zone_id):
    """Delete zone"""
    try:
        success = Zone.delete_zone(zone_id)
        if not success:
            return error_response('Zone not found', 404)
        
        return success_response(message='Zone deleted successfully')
        
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/zones/<zone_id>/cameras', methods=['POST'])
@admin_required
def add_camera(zone_id):
    """Add camera to zone"""
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return error_response('Camera name is required')
        
        success, result = Zone.add_camera(zone_id, data)
        if not success:
            return error_response('Failed to add camera', 400)
        
        return success_response(
            data={'camera': {
                'id': str(result['_id']),
                'name': result['name'],
                'location': result.get('location', ''),
                'rtsp_url': result.get('rtsp_url', ''),
                'is_active': result.get('is_active', True)
            }},
            message='Camera added successfully'
        )
        
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/supervisors', methods=['GET'])
@admin_required
def get_supervisors():
    """Get all supervisors"""
    try:
        supervisors = User.get_all_supervisors()
        return success_response(data={'supervisors': supervisors})
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/supervisors', methods=['POST'])
@admin_required
def create_supervisor():
    """Create a new supervisor"""
    try:
        data = request.get_json()
        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')
        company = data.get('company', '')
        
        if not full_name or not email or not password:
            return error_response('Full name, email, and password are required')
        
        # Check if email already exists
        existing = User.get_by_email(email)
        if existing:
            return error_response('Email already registered', 400)
        
        # Create supervisor
        supervisor = User.create_user(full_name, email, password, role='supervisor', company=company)
        if not supervisor:
            return error_response('Failed to create supervisor', 400)
        
        return success_response(data={'supervisor': supervisor}, message='Supervisor created successfully'), 201
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/supervisors/<supervisor_id>', methods=['PUT'])
@admin_required
def update_supervisor(supervisor_id):
    """Update supervisor details"""
    try:
        # Verify supervisor exists
        supervisor = User.get_by_id(supervisor_id)
        if not supervisor:
            return error_response('Supervisor not found', 404)
        
        data = request.get_json()
        update_data = {}
        
        if 'full_name' in data and data['full_name']:
            update_data['full_name'] = data['full_name']
        
        if 'email' in data and data['email']:
            # Check if new email is already in use
            existing = User.get_by_email(data['email'])
            if existing and str(existing['_id']) != supervisor_id:
                return error_response('Email already in use', 400)
            update_data['email'] = data['email']
        
        if 'company' in data:
            update_data['company'] = data['company']
        
        # Update password if provided
        if 'password' in data and data['password']:
            update_data['password'] = data['password']
        
        if not update_data:
            return error_response('No data to update')
        
        success = User.update_user(supervisor_id, update_data)
        if not success:
            return error_response('Failed to update supervisor', 400)
        
        # Return updated supervisor
        updated = User.get_by_id(supervisor_id)
        return success_response(data={'supervisor': User.serialize_user(updated)}, message='Supervisor updated successfully')
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/supervisors/<supervisor_id>', methods=['DELETE'])
@admin_required
def delete_supervisor(supervisor_id):
    """Delete a supervisor"""
    try:
        # Verify supervisor exists
        supervisor = User.get_by_id(supervisor_id)
        if not supervisor:
            return error_response('Supervisor not found', 404)
        
        # Auto-unassign supervisor from all zones before deleting
        mongo.db.zones.update_many(
            {'supervisors': ObjectId(supervisor_id)},
            {'$pull': {'supervisors': ObjectId(supervisor_id)}}
        )
        
        # Delete supervisor
        result = mongo.db.users.delete_one({'_id': ObjectId(supervisor_id)})
        
        if result.deleted_count == 0:
            return error_response('Failed to delete supervisor', 400)
        
        return success_response(message='Supervisor deleted successfully')
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/zones/<zone_id>/assign', methods=['POST'])
@admin_required
def assign_supervisor(zone_id):
    """Assign supervisor to zone"""
    try:
        data = request.get_json()
        supervisor_id = data.get('supervisor_id')
        
        if not supervisor_id:
            return error_response('Supervisor ID is required')
        
        success = Zone.assign_supervisor(zone_id, supervisor_id)
        if not success:
            return error_response('Failed to assign supervisor', 400)
        
        return success_response(message='Supervisor assigned successfully')
        
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/violations', methods=['GET'])
@admin_required
def get_violations():
    """Get all violations with filters (only for admin's zones)"""
    try:
        # Get admin's zones
        admin_zones = Zone.get_all_zones(admin_id=session['user_id'])
        zone_ids = [zone['id'] for zone in admin_zones]
        
        filters = {}
        
        zone_id = request.args.get('zone_id')
        if zone_id:
            filters['zone_id'] = zone_id
        
        camera_id = request.args.get('camera_id')
        if camera_id:
            filters['camera_id'] = camera_id
        
        violations = DetectionEvent.get_violations(filters)
        
        # Filter violations by admin's zones
        violations = [v for v in violations if v.get('zone_id') in zone_ids]
        
        return success_response(data={'violations': violations})
        
    except Exception as e:
        return error_response(str(e), 500)

@admin_bp.route('/violations/recent', methods=['GET'])
@admin_required
def get_recent_violations():
    """Get recent violations (only for admin's zones)"""
    try:
        # Get admin's zones
        admin_zones = Zone.get_all_zones(admin_id=session['user_id'])
        zone_ids = [zone['id'] for zone in admin_zones]
        
        limit = request.args.get('limit', 10, type=int)
        violations = DetectionEvent.get_recent_violations(limit=limit)
        
        # Filter violations by admin's zones
        violations = [v for v in violations if v.get('zone_id') in zone_ids]
        
        return success_response(data={'violations': violations})
    except Exception as e:
        return error_response(str(e), 500)