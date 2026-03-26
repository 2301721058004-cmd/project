import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import create_app, mongo
from app.models.detection import DetectionEvent

app = create_app()

with app.app_context():
    all_dets = list(mongo.db.detections.find())
    print(f"Total detections in DB: {len(all_dets)}")
    for d in all_dets:
        print(f"Detection {d['_id']} - people_count: {d.get('people_count')}, violations_count: {d.get('violations_count')}, classes: {[o.get('class') for o in d.get('detections', [])]}")
        
    stats = DetectionEvent.get_stats()
    print(f"Global get_stats result: {stats}")
