"""
Zone Model
"""
from app import mongo
from bson import ObjectId
from datetime import datetime

class Zone:
    @staticmethod
    def create_zone(name, location, admin_id):
        zone_doc = {
            'name': name,
            'location': location,
            'admin_id': ObjectId(admin_id),
            'cameras': [],
            'supervisors': [],
            'created_at': datetime.utcnow(),
            'is_active': True
        }
        
        result = mongo.db.zones.insert_one(zone_doc)
        zone_doc['_id'] = result.inserted_id
        return Zone.serialize_zone(zone_doc)
    
    @staticmethod
    def get_all_zones(admin_id=None):
        try:
            query = {}
            if admin_id:
                query['admin_id'] = ObjectId(admin_id)
            
            zones = mongo.db.zones.find(query)
            result = []
            for z in zones:
                result.append(Zone.serialize_zone(z))
            return result  # Always returns array
        except:
            return []
    
    @staticmethod
    def get_by_id(zone_id):
        try:
            return mongo.db.zones.find_one({'_id': ObjectId(zone_id)})
        except:
            return None
    
    @staticmethod
    def get_zones_by_supervisor(supervisor_id):
        try:
            zones = mongo.db.zones.find({'supervisors': ObjectId(supervisor_id)})
            result = []
            for z in zones:
                result.append(Zone.serialize_zone(z))
            return result  # Always returns array
        except:
            return []
    
    @staticmethod
    def add_camera(zone_id, camera_data):
        try:
            camera_doc = {
                '_id': ObjectId(),
                'name': camera_data['name'],
                'location': camera_data.get('location', ''),
                'rtsp_url': camera_data.get('rtsp_url', ''),
                'is_active': camera_data.get('is_active', True),
                'added_at': datetime.utcnow()
            }
            
            result = mongo.db.zones.update_one(
                {'_id': ObjectId(zone_id)},
                {'$push': {'cameras': camera_doc}}
            )
            return result.modified_count > 0, camera_doc
        except Exception as e:
            return False, str(e)
    
    @staticmethod
    def assign_supervisor(zone_id, supervisor_id):
        try:
            zone = mongo.db.zones.find_one({
                '_id': ObjectId(zone_id),
                'supervisors': ObjectId(supervisor_id)
            })
            
            if zone:
                return True
            
            result = mongo.db.zones.update_one(
                {'_id': ObjectId(zone_id)},
                {'$addToSet': {'supervisors': ObjectId(supervisor_id)}}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def remove_supervisor(zone_id, supervisor_id):
        try:
            result = mongo.db.zones.update_one(
                {'_id': ObjectId(zone_id)},
                {'$pull': {'supervisors': ObjectId(supervisor_id)}}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def delete_zone(zone_id):
        try:
            result = mongo.db.zones.delete_one({'_id': ObjectId(zone_id)})
            return result.deleted_count > 0
        except:
            return False
    
    @staticmethod
    def serialize_zone(zone):
        if not zone:
            return None
        
        return {
            'id': str(zone['_id']),
            'name': zone['name'],
            'location': zone.get('location', ''),
            'admin_id': str(zone['admin_id']),
            'cameras': [{
                'id': str(c['_id']),
                'name': c['name'],
                'location': c.get('location', ''),
                'rtsp_url': c.get('rtsp_url', ''),
                'is_active': c.get('is_active', True)
            } for c in zone.get('cameras', [])],
            'supervisors': [str(s) for s in zone.get('supervisors', [])],
            'created_at': zone['created_at'].isoformat() if isinstance(zone['created_at'], datetime) else zone['created_at']
        }