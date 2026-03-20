import cv2
import time
from app.services.yolo_service import get_yolo_service
from app.models.detection import DetectionEvent
from datetime import datetime
from bson import ObjectId

class StreamService:
    def __init__(self):
        self.yolo_service = get_yolo_service()

    def generate_frames(self, url, zone_id, camera_id, user_id):
        cap = cv2.VideoCapture(url)
        
        # If camera not opened, maybe it failed
        if not cap.isOpened():
             print(f"Error: Could not open RTSP stream from {url}")
             return

        frame_count = 0
        last_violation_time = 0
        violation_cooldown = 5  # Capture at most 1 violation event every 5 seconds per stream
        
        while True:
            success, frame = cap.read()
            if not success:
                break
                
            frame_count += 1
            
            # Process every 5 frames to save CPU
            if frame_count % 5 == 0:
                result = self.yolo_service.detect_frame(frame.copy(), conf_threshold=0.4)
                
                if result['has_violation']:
                    current_time = time.time()
                    if current_time - last_violation_time > violation_cooldown:
                        last_violation_time = current_time
                        
                        # Generate annotated image path 
                        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                        filename = f"rtsp_{zone_id}_{camera_id}_{timestamp_str}.jpg"
                        import os
                        from flask import current_app
                        try:
                            # Save the violated frame to DETECTION_FOLDER
                            out_path = os.path.join(current_app.config['DETECTION_FOLDER'], filename)
                            cv2.imwrite(out_path, result['annotated_image'])
                            
                            # Create a database event so frontend can pick it up
                            DetectionEvent.create_detection(
                                camera_id=camera_id,
                                zone_id=zone_id,
                                has_violation=True,
                                violations_count=result['violations_count'],
                                people_count=result['people_count'],
                                detections=result['detections'],
                                annotated_image_path=filename,
                                uploaded_by=user_id,
                                file_type='image',
                                camera_name=None,
                                zone_name=None,
                                extra_data={'source': 'rtsp', 'stream_url': url}
                            )
                        except Exception as e:
                            print(f"[STREAM] Failed to save DB event: {e}")

                # Encode the annotated image
                ret, buffer = cv2.imencode('.jpg', result['annotated_image'])
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            else:
                # If skipping YOLO, just send the raw frame
                ret, buffer = cv2.imencode('.jpg', frame)
                if ret:
                    frame_bytes = buffer.tobytes()
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                           
        cap.release()

stream_service = StreamService()
