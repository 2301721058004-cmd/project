"""
Daily Summary Model - Stores aggregated violations by day
"""
from app import mongo
from bson import ObjectId
from datetime import datetime, timedelta

class DailySummary:
    @staticmethod
    def create_or_update_summary(date, zone_id, violations_count, violation_frames, people_without_helmets=0):
        """Create or update daily summary for a zone"""
        # Start of day (midnight UTC)
        day_start = datetime.combine(date.date(), datetime.min.time())
        
        summary_doc = {
            'date': day_start,
            'zone_id': ObjectId(zone_id) if zone_id else None,
            'violations_count': violations_count,
            'violation_frames': violation_frames,  # Array of frame paths
            'people_without_helmets': people_without_helmets,
            'updated_at': datetime.utcnow()
        }
        
        # Use upsert to create if not exists, update if exists
        result = mongo.db.daily_summaries.update_one(
            {'date': day_start, 'zone_id': ObjectId(zone_id) if zone_id else None},
            {'$set': summary_doc},
            upsert=True
        )
        
        return result.upserted_id or result.matched_count
    
    @staticmethod
    def increment_daily_summary(date, zone_id, increment_count=1, frame_path=None):
        """Increment violations for a specific date and zone"""
        day_start = datetime.combine(date.date(), datetime.min.time())
        
        update_dict = {
            '$inc': {'violations_count': increment_count, 'people_without_helmets': increment_count},
            '$set': {'updated_at': datetime.utcnow()}
        }
        
        if frame_path:
            update_dict['$push'] = {'violation_frames': frame_path}
        
        result = mongo.db.daily_summaries.update_one(
            {'date': day_start, 'zone_id': ObjectId(zone_id) if zone_id else None},
            update_dict,
            upsert=True
        )
        
        return result
    
    @staticmethod
    def get_daily_summary(zone_id, date):
        """Get summary for a specific date and zone"""
        day_start = datetime.combine(date.date(), datetime.min.time())
        
        summary = mongo.db.daily_summaries.find_one({
            'date': day_start,
            'zone_id': ObjectId(zone_id) if zone_id else None
        })
        
        return DailySummary.serialize_summary(summary) if summary else None
    
    @staticmethod
    def get_daily_summaries(zone_id, start_date, end_date):
        """Get summaries for a date range"""
        day_start = datetime.combine(start_date.date(), datetime.min.time())
        day_end = datetime.combine(end_date.date() + timedelta(days=1), datetime.min.time())
        
        summaries = mongo.db.daily_summaries.find({
            'date': {'$gte': day_start, '$lt': day_end},
            'zone_id': ObjectId(zone_id) if zone_id else None
        }).sort('date', -1)
        
        return [DailySummary.serialize_summary(s) for s in summaries]
    
    @staticmethod
    def get_all_zones_daily_summary(date):
        """Get summary for all zones on a specific date"""
        day_start = datetime.combine(date.date(), datetime.min.time())
        
        summaries = mongo.db.daily_summaries.find({
            'date': day_start
        }).sort('violations_count', -1)
        
        return [DailySummary.serialize_summary(s) for s in summaries]
    
    @staticmethod
    def get_violations_by_week(zone_id):
        """Get violations for last 7 days"""
        today = datetime.utcnow()
        start_date = today - timedelta(days=7)
        
        day_start = datetime.combine(start_date.date(), datetime.min.time())
        day_end = datetime.combine(today.date() + timedelta(days=1), datetime.min.time())
        
        summaries = mongo.db.daily_summaries.find({
            'date': {'$gte': day_start, '$lt': day_end},
            'zone_id': ObjectId(zone_id) if zone_id else None
        }).sort('date', 1)
        
        return [DailySummary.serialize_summary(s) for s in summaries]
    
    @staticmethod
    def serialize_summary(summary_doc):
        """Convert MongoDB document to JSON-serializable format"""
        if not summary_doc:
            return None
        
        return {
            'id': str(summary_doc.get('_id', '')),
            'date': summary_doc.get('date').isoformat() if summary_doc.get('date') else None,
            'zone_id': str(summary_doc.get('zone_id', '')),
            'violations_count': summary_doc.get('violations_count', 0),
            'people_without_helmets': summary_doc.get('people_without_helmets', 0),
            'violation_frames': summary_doc.get('violation_frames', []),
            'updated_at': summary_doc.get('updated_at').isoformat() if summary_doc.get('updated_at') else None
        }
