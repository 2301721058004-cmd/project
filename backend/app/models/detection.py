"""
Detection Event Model - Stores AI detection results
"""
from app import mongo
from bson import ObjectId
from datetime import datetime

class DetectionEvent:
    @staticmethod
    def create_detection(camera_id, zone_id, has_violation, violations_count, people_count,
                        detections, annotated_image_path, uploaded_by, file_type='image', 
                        extra_data=None, camera_name=None, zone_name=None):
        """Create a new detection event"""
        detection_doc = {
            'camera_id': ObjectId(camera_id) if camera_id else None,
            'zone_id': ObjectId(zone_id) if zone_id else None,
            'camera_name': camera_name,
            'zone_name': zone_name,
             
            'timestamp': datetime.utcnow(),
            'has_violation': has_violation,
            'violations_count': violations_count,
            'people_count': people_count,
            'detections': detections,  # Array of detection objects
            'annotated_image_path': annotated_image_path,
            'uploaded_by': ObjectId(uploaded_by),
            'status': 'active',
            'file_type': file_type,
            'extra_data': extra_data or {}
        }
        
        result = mongo.db.detections.insert_one(detection_doc)
        detection_doc['_id'] = result.inserted_id
        return DetectionEvent.serialize_detection(detection_doc)
    
    @staticmethod
    def get_all_detections(filters=None, limit=None):
        """Get all detection events with optional filters"""
        query = {}
        if filters:
            if 'zone_id' in filters:
                if isinstance(filters['zone_id'], list):
                    query['zone_id'] = {'$in': [ObjectId(z) for z in filters['zone_id']]}
                else:
                    query['zone_id'] = ObjectId(filters['zone_id'])
            if 'has_violation' in filters:
                query['has_violation'] = filters['has_violation']
            if 'uploaded_by' in filters:
                query['uploaded_by'] = ObjectId(filters['uploaded_by'])
        
        cursor = mongo.db.detections.find(query).sort('timestamp', -1)
        if limit:
            cursor = cursor.limit(limit)
        
        return [DetectionEvent.serialize_detection(d) for d in cursor]
    
    @staticmethod
    def get_recent_detections(limit=10, uploaded_by=None, zone_ids=None):
        """Get recent detections"""
        query = {}
        if uploaded_by:
            query['uploaded_by'] = ObjectId(uploaded_by)
        if zone_ids:
            query['zone_id'] = {'$in': [ObjectId(z) for z in zone_ids]}
        
        detections = mongo.db.detections.find(query).sort('timestamp', -1).limit(limit)
        return [DetectionEvent.serialize_detection(d) for d in detections]
    
    @staticmethod
    def get_violations(filters=None):
        """Get all violations"""
        query = {'has_violation': True}
        if filters:
            if 'zone_id' in filters:
                query['zone_id'] = ObjectId(filters['zone_id'])
            if 'camera_id' in filters:
                query['camera_id'] = ObjectId(filters['camera_id'])
            if 'uploaded_by' in filters:
                query['uploaded_by'] = ObjectId(filters['uploaded_by'])
        
        violations = mongo.db.detections.find(query).sort('timestamp', -1)
        return [DetectionEvent.serialize_detection(v) for v in violations]
    
    @staticmethod
    def get_recent_violations(limit=5):
        """Get recent violations for alerts"""
        violations = mongo.db.detections.find(
            {'has_violation': True}
        ).sort('timestamp', -1).limit(limit)
        return [DetectionEvent.serialize_detection(v) for v in violations]
    
    @staticmethod
    def get_stats(uploaded_by=None, zone_ids=None):
        """Get detection statistics"""
        match_stage = {}
        if uploaded_by:
            match_stage['uploaded_by'] = ObjectId(uploaded_by)
        if zone_ids:
            match_stage['zone_id'] = {'$in': [ObjectId(z) for z in zone_ids]}
        
        pipeline = [
            {'$match': match_stage} if match_stage else {'$match': {}},
            {'$group': {
                '_id': None,
                'total_detections': {'$sum': 1},
                'total_violations': {
                    '$sum': {'$cond': ['$has_violation', 1, 0]}
                },
                'total_people': {'$sum': '$violations_count'}
            }}
        ]
        
        result = list(mongo.db.detections.aggregate(pipeline))
        if result:
            return {
                'total_detections': result[0]['total_detections'],
                'total_violations': result[0]['total_violations'],
                'total_people': result[0]['total_people']
            }
        return {'total_detections': 0, 'total_violations': 0, 'total_people': 0}
    
    @staticmethod
    def get_zone_stats(zone_id):
        """Get statistics for a specific zone"""
        pipeline = [
            {'$match': {'zone_id': ObjectId(zone_id)}},
            {'$group': {
                '_id': None,
                'total_detections': {'$sum': 1},
                'total_violations': {
                    '$sum': {'$cond': ['$has_violation', 1, 0]}
                }
            }}
        ]
        
        result = list(mongo.db.detections.aggregate(pipeline))
        if result:
            return {
                'total_detections': result[0]['total_detections'],
                'total_violations': result[0]['total_violations']
            }
        return {'total_detections': 0, 'total_violations': 0}
    
    @staticmethod
    def serialize_detection(detection):
        """Convert detection document to JSON serializable dict"""
        if not detection:
            return None
        
        # Get ids
        camera_id = str(detection['camera_id']) if detection.get('camera_id') else None
        zone_id = str(detection['zone_id']) if detection.get('zone_id') else None
        
        # Get names from doc
        camera_name = detection.get('camera_name')
        zone_name = detection.get('zone_name')
        
        # Fallback names from DB if missing
        if not zone_name and zone_id:
            from app.models.zone import Zone
            zone = Zone.get_by_id(zone_id)
            if zone:
                zone_name = zone.get('name', 'Unknown')
        
        if not camera_name and camera_id and zone_id:
            from app.models.zone import Zone
            zone = Zone.get_by_id(zone_id)
            if zone:
                cameras = zone.get('cameras', [])
                for cam in cameras:
                    if str(cam.get('_id')) == camera_id:
                        camera_name = cam.get('name', 'Unknown')
                        break
        
        # Fallback to 'Unknown' if still missing
        zone_name = zone_name or 'Unknown'
        camera_name = camera_name or 'Unknown'

        # Fix thumbnail for videos
        annotated_image_path = detection.get('annotated_image_path', '')
        extra_data = detection.get('extra_data', {})
        if detection.get('file_type') == 'video' and extra_data.get('violation_image_path'):
            annotated_image_path = extra_data.get('violation_image_path')

        # Get uploaded by name
        uploaded_by_id = detection.get('uploaded_by')
        uploaded_by_name = 'System'
        if uploaded_by_id:
            from app.models.user import User
            uploader = User.get_by_id(uploaded_by_id)
            if uploader:
                uploaded_by_name = uploader.get('full_name', 'System')

        return {
            'id': str(detection['_id']),
            'camera_id': camera_id,
            'camera_name': camera_name,
            'zone_id': zone_id,
            'zone_name': zone_name,
            'timestamp': (detection['timestamp'].isoformat() + 'Z') if isinstance(detection['timestamp'], datetime) else detection['timestamp'],
            'has_violation': detection.get('has_violation', False),
            'violations_count': detection.get('violations_count', 0),
            'people_count': detection.get('people_count', 0),
            'detections': detection.get('detections', []),
            'annotated_image_path': annotated_image_path,
            'uploaded_by': str(uploaded_by_id) if uploaded_by_id else None,
            'uploaded_by_name': uploaded_by_name,
            'status': detection.get('status', 'active'),
            'file_type': detection.get('file_type', 'image'),
            'extra_data': extra_data
        }