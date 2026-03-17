"""
Daily Summary Routes - Day-wise violations analytics
"""
from flask import Blueprint, request, session, current_app
from app.models.daily_summary import DailySummary
from app.utils.helpers import login_required, success_response, error_response
from datetime import datetime, timedelta

daily_summary_bp = Blueprint('daily_summary', __name__)

@daily_summary_bp.route('/day-wise', methods=['GET'])
@login_required
def get_day_wise_violations():
    """Get day-wise violations for a zone"""
    try:
        from app.models.zone import Zone
        
        zone_id = request.args.get('zone_id')
        start_date_str = request.args.get('start_date')  # Format: YYYY-MM-DD
        end_date_str = request.args.get('end_date')  # Format: YYYY-MM-DD
        
        if not zone_id:
            return error_response('zone_id is required')
        
        # Check if user has access to this zone
        zone = Zone.get_by_id(zone_id)
        if not zone:
            return error_response('Zone not found', 404)
        
        # Parse dates
        if start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        else:
            start_date = datetime.utcnow() - timedelta(days=30)  # Last 30 days by default
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            end_date = datetime.utcnow()
        
        # Get daily summaries
        summaries = DailySummary.get_daily_summaries(zone_id, start_date, end_date)
        
        return success_response(data={'daily_summaries': summaries})
        
    except Exception as e:
        return error_response(str(e), 500)

@daily_summary_bp.route('/day-wise/all-zones', methods=['GET'])
@login_required
def get_all_zones_day_wise():
    """Get day-wise violations for all zones (admin only)"""
    try:
        from app.models.zone import Zone
        
        if session.get('role') != 'admin':
            return error_response('Only admins can access this endpoint', 403)
        
        date_str = request.args.get('date')  # Format: YYYY-MM-DD
        
        if date_str:
            date = datetime.strptime(date_str, '%Y-%m-%d')
        else:
            date = datetime.utcnow()
        
        # Get admin's zones
        zones = Zone.get_all_zones(admin_id=session['user_id'])
        zone_ids = [zone['id'] for zone in zones]
        
        # Get summaries for all zones on this date
        all_summaries = DailySummary.get_all_zones_daily_summary(date)
        
        # Filter to admin's zones only
        filtered_summaries = [s for s in all_summaries if s['zone_id'] in zone_ids]
        
        return success_response(data={
            'date': date.isoformat(),
            'daily_summaries': filtered_summaries,
            'total_violations': sum(s['violations_count'] for s in filtered_summaries)
        })
        
    except Exception as e:
        return error_response(str(e), 500)

@daily_summary_bp.route('/weekly', methods=['GET'])
@login_required
def get_weekly_violations():
    """Get weekly violations (last 7 days) for a zone"""
    try:
        zone_id = request.args.get('zone_id')
        
        if not zone_id:
            return error_response('zone_id is required')
        
        # Get last 7 days
        summaries = DailySummary.get_violations_by_week(zone_id)
        
        # Prepare week data
        week_data = {
            'summaries': summaries,
            'total_violations': sum(s['violations_count'] for s in summaries),
            'average_daily': round(sum(s['violations_count'] for s in summaries) / max(len(summaries), 1), 2),
            'highest_day': max(summaries, key=lambda x: x['violations_count']) if summaries else None
        }
        
        return success_response(data=week_data)
        
    except Exception as e:
        return error_response(str(e), 500)

@daily_summary_bp.route('/today', methods=['GET'])
@login_required
def get_today_violations():
    """Get today's violations for a zone"""
    try:
        zone_id = request.args.get('zone_id')
        
        if not zone_id:
            return error_response('zone_id is required')
        
        today = datetime.utcnow()
        summary = DailySummary.get_daily_summary(zone_id, today)
        
        if not summary:
            # Return empty summary for today
            summary = {
                'date': today.isoformat(),
                'zone_id': zone_id,
                'violations_count': 0,
                'people_without_helmets': 0,
                'violation_frames': []
            }
        
        return success_response(data={'today_summary': summary})
        
    except Exception as e:
        return error_response(str(e), 500)
