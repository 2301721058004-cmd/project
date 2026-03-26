import sys
import os
from bson import ObjectId

# Ensure we can import app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app, mongo

app = create_app()

with app.app_context():
    count = 0
    valid_classes = ['helmet', 'head', 'no_helmet', 'without_helmet', 'no-helmet']
    detections = mongo.db.detections.find()
    
    for det in detections:
        det_list = det.get('detections', [])
        new_people_count = sum(1 for d in det_list if d.get('class', '').lower() in valid_classes)
        
        # Only update if different
        if new_people_count != det.get('people_count'):
            mongo.db.detections.update_one(
                {'_id': det['_id']}, 
                {'$set': {'people_count': new_people_count}}
            )
            count += 1
            print(f"Updated detection {det['_id']} from {det.get('people_count')} to {new_people_count} people")
            
    print(f"Successfully fixed {count} detection records")
