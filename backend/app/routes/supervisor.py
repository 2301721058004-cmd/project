"""
Supervisor Routes - Dashboard, Zone monitoring, Personal detections
"""
from flask import Blueprint, request, session
from app.models.zone import Zone
from app.models.detection import DetectionEvent
from app.utils.helpers import supervisor_required, success_response, error_response

supervisor_bp = Blueprint('supervisor', __name__)

@supervisor_bp.route('/dashboard', methods=['GET'])
@supervisor_required
def dashboard():
    """Get supervisor dashboard data"""
    try:
        user_id = session['user_id']
        
        zones = Zone.get_zones_by_supervisor(user_id)
        zone_ids = [z['id'] for z in zones]
        
        stats = DetectionEvent.get_stats(zone_ids=zone_ids)
        recent_detections = DetectionEvent.get_recent_detections(
            limit=15, 
            zone_ids=zone_ids
        )
        
        return success_response(data={
            'stats': stats,
            'zones': zones,
            'recent_detections': recent_detections
        })
        
    except Exception as e:
        return error_response(str(e), 500)

@supervisor_bp.route('/zones', methods=['GET'])
@supervisor_required
def get_assigned_zones():
    """Get zones assigned to supervisor"""
    try:
        zones = Zone.get_zones_by_supervisor(session['user_id'])
        return success_response(data={'zones': zones})
    except Exception as e:
        return error_response(str(e), 500)

@supervisor_bp.route('/zones/<zone_id>/stats', methods=['GET'])
@supervisor_required
def get_zone_stats(zone_id):
    """Get statistics for a specific zone"""
    try:
        zones = Zone.get_zones_by_supervisor(session['user_id'])
        zone_ids = [z['id'] for z in zones]
        
        if zone_id not in zone_ids and session.get('role') != 'admin':
            return error_response('Access denied', 403)
        
        stats = DetectionEvent.get_zone_stats(zone_id)
        return success_response(data={'stats': stats})
        
    except Exception as e:
        return error_response(str(e), 500)

@supervisor_bp.route('/detections', methods=['GET'])
@supervisor_required
def get_detections():
    """Get assigned zone detection history"""
    try:
        zones = Zone.get_zones_by_supervisor(session['user_id'])
        assigned_zone_ids = [z['id'] for z in zones]
        
        filters = {}
        
        zone_id = request.args.get('zone_id')
        if zone_id:
            # Verify the supervisor is assigned to this zone
            if zone_id not in assigned_zone_ids and session.get('role') != 'admin':
                return error_response('Access denied to this zone', 403)
            filters['zone_id'] = zone_id
        else:
            # If no specific zone, show all assigned zones
            filters['zone_id'] = assigned_zone_ids
        
        detections = DetectionEvent.get_all_detections(filters)
        return success_response(data={'detections': detections})
        
    except Exception as e:
        return error_response(str(e), 500)

@supervisor_bp.route('/detections/recent', methods=['GET'])
@supervisor_required
def get_recent_detections():
    """Get recent zone detections"""
    try:
        zones = Zone.get_zones_by_supervisor(session['user_id'])
        zone_ids = [z['id'] for z in zones]
        
        limit = request.args.get('limit', 10, type=int)
        detections = DetectionEvent.get_recent_detections(
            limit=limit,
            zone_ids=zone_ids
        )
        return success_response(data={'detections': detections})
    except Exception as e:
        return error_response(str(e), 500)