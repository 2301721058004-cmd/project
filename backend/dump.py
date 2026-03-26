import sys
import os
import json
from bson import ObjectId

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app import create_app, mongo

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        from datetime import datetime
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

app = create_app()

with app.app_context():
    dets = list(mongo.db.detections.find({}, {'detections': 0})) # exclude large array for brevity
    with open('db_dump.json', 'w') as f:
        json.dump(dets, f, cls=JSONEncoder, indent=2)
    print("Dumped")
