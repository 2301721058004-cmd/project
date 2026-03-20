"""
YOLOv8 Service - Singleton pattern for model loading and inference
"""
import os
import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO
import torch
from flask import current_app

class YOLOService:
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(YOLOService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._model is None:
            self.load_model()
    
    def load_model(self):
    #"""Load YOLOv8 model"""
        try:
        # Check for your trained model first
            if os.path.exists('best.pt'):
                self._model = YOLO('best.pt')
                print("Loaded trained model: best.pt")
            else:
            # Fallback to config or default
                model_path = current_app.config.get('YOLO_MODEL', 'yolov8n.pt') if current_app else 'yolov8n.pt'
                self._model = YOLO(model_path)
                print(f"Loaded model: {model_path}")
        
        # Move to GPU if available
            if torch.cuda.is_available():
                self._model.to('cuda')
                print("Using CUDA for inference")
            else:
                 print("Using CPU for inference")
            
        except Exception as e:
            print(f"Error loading YOLO model: {e}")
            raise
    
    def detect(self, image_path, conf_threshold=None):
        """Run detection on image from path"""
        try:
            image = cv2.imread(image_path)
            if image is None:
                return {
                    'success': False,
                    'error': 'Could not read image',
                    'detections': [],
                    'has_violation': False,
                    'violations_count': 0
                }
            
            return self.detect_frame(image, conf_threshold)
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'detections': [],
                'has_violation': False,
                'violations_count': 0
            }

    def detect_frame(self, frame, conf_threshold=None):
        """
        Run detection on a single frame (numpy array)
        
        Returns:
            dict: {
                'success': bool,
                'detections': list of detection objects,
                'has_violation': bool,
                'violations_count': int,
                'annotated_image': numpy array (BGR)
            }
        """
        try:
            if frame is None:
                return {
                    'success': False,
                    'error': 'Empty frame provided',
                    'detections': [],
                    'has_violation': False,
                    'violations_count': 0
                }
            
            # Set confidence threshold
            if conf_threshold is None:
                conf_threshold = current_app.config.get('YOLO_CONFIDENCE_THRESHOLD', 0.25) if current_app else 0.25
            
            # Run inference
            results = self._model(frame, conf=conf_threshold, verbose=False)
            
            detections = []
            violations_count = 0
            
            # Process results
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    # Get box coordinates
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    class_name = self._model.names[cls]
                    
                    detection = {
                        'bbox': [int(x1), int(y1), int(x2), int(y2)],
                        'confidence': round(conf, 3),
                        'class': class_name,
                        'class_id': cls
                    }
                    
                    # Check for violations
                    # Class 0: head (violation), Class 1: helmet (safe)
                    if class_name.lower() in ['head', 'no_helmet', 'without_helmet', 'no-helmet'] and conf > 0.3:
                        detection['is_violation'] = True
                        violations_count += 1
                    elif class_name.lower() in ['helmet']:
                         detection['is_violation'] = False
                    else:
                        detection['is_violation'] = False
                    
                    detections.append(detection)
            
            # Draw annotations
            annotated_image = self._annotate_image(frame.copy(), detections)
            
            # Count people/instances (both with and without helmets)
            people_count = sum(1 for d in detections if d.get('class', '').lower() in ['person', 'helmet', 'head', 'no_helmet', 'without_helmet', 'no-helmet'])
            
            return {
                'success': True,
                'detections': detections,
                'has_violation': violations_count > 0,
                'violations_count': violations_count,
                'people_count': people_count,
                'annotated_image': annotated_image,
                'total_objects': len(detections)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'detections': [],
                'has_violation': False,
                'violations_count': 0
            }
    
    def detect_video(self, video_path, output_path=None, conf_threshold=None, frame_skip=5):
        """
        Run detection on video file and extract violation frames
        
        Args:
            video_path: Path to input video file
            output_path: Ignored (kept for backward compatibility)
            conf_threshold: Confidence threshold for detections
            frame_skip: Process every nth frame for efficiency (5 = process every 5th frame)
        
        Returns:
            dict: {
                'success': bool,
                'detections': list of detection objects,
                'has_violation': bool,
                'violations_count': int in worst frame,
                'total_frames': int,
                'processed_frames': int,
                'violation_image_path': str (main violation frame),
                'violation_frames_paths': list of all violation frames,
                'frames_with_violations': int,
                'people_count': int,
                'error': str (if success is False)
            }
        """
        try:
            # Open video file
            cap = cv2.VideoCapture(video_path)
            
            if not cap.isOpened():
                return {
                    'success': False,
                    'error': 'Could not open video file',
                    'detections': [],
                    'has_violation': False,
                    'violations_count': 0,
                    'total_frames': 0,
                    'processed_frames': 0
                }
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Validate video properties
            if fps == 0 or fps is None:
                fps = 30
            
            # Set confidence threshold
            if conf_threshold is None:
                conf_threshold = current_app.config.get('YOLO_CONFIDENCE_THRESHOLD', 0.25) if current_app else 0.25
            
            all_detections = []
            max_violations_per_frame = 0
            max_people_per_frame = 0
            processed_frames = 0
            frame_count = 0
            
            # For storing violation frames
            violation_frames_data = {}  # Store best frame with violations
            best_violation_frame = None
            best_violation_count = 0
            best_frame_num = 0
            
            # Process video frames
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                # Skip frames for efficiency
                if frame_count % frame_skip != 0:
                    continue
                
                processed_frames += 1
                
                # Run inference
                results = self._model(frame, conf=conf_threshold)
                
                frame_detections = []
                frame_violations = 0
                
                # Process results
                for result in results:
                    boxes = result.boxes
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = float(box.conf[0])
                        cls = int(box.cls[0])
                        class_name = self._model.names[cls]
                        
                        detection = {
                            'bbox': [int(x1), int(y1), int(x2), int(y2)],
                            'confidence': round(conf, 3),
                            'class': class_name,
                            'class_id': cls,
                            'frame': frame_count
                        }
                        
                        # Check for violations (head/no_helmet = violation)
                        if class_name.lower() in ['head', 'no_helmet', 'without_helmet', 'no-helmet'] and conf > 0.3:
                            detection['is_violation'] = True
                            frame_violations += 1
                        else:
                            detection['is_violation'] = False
                        
                        frame_detections.append(detection)
                
                # Count people in this frame
                frame_people = sum(1 for d in frame_detections if d.get('class', '').lower() in ['person', 'head', 'helmet', 'no_helmet', 'without_helmet', 'no-helmet'])
                if frame_people > max_people_per_frame:
                    max_people_per_frame = frame_people
                
                all_detections.extend(frame_detections)
                
                # Track frame with maximum violations
                if frame_violations > best_violation_count:
                    best_violation_count = frame_violations
                    max_violations_per_frame = frame_violations
                    best_frame_num = frame_count
                    annotated_frame = self._annotate_image(frame.copy(), frame_detections)
                    best_violation_frame = annotated_frame
                    violation_frames_data['best'] = {
                        'frame': annotated_frame,
                        'frame_num': frame_count,
                        'violations': frame_violations
                    }
            
            # Release resources
            cap.release()
            
            # Calculate statistics
            has_violation = max_violations_per_frame > 0
            
            # Extract and save the main violation frame
            violation_image_path = None
            violation_frames_paths = []
            
            if has_violation and best_violation_frame is not None:
                try:
                    base_name = os.path.basename(video_path).split('.')[0]
                    violation_image_filename = f"vio_{base_name}_frame{best_frame_num}.jpg"
                    violation_image_path = os.path.join(
                        current_app.config['DETECTION_FOLDER'], 
                        violation_image_filename
                    ) if current_app else None
                    
                    if violation_image_path:
                        success = cv2.imwrite(violation_image_path, best_violation_frame)
                        if success:
                            violation_frames_paths.append(violation_image_filename)
                            print(f"[INFO] Saved violation frame: {violation_image_filename} (Violations: {max_violations_per_frame})")
                        else:
                            print(f"[WARNING] Failed to save violation frame")
                            violation_image_path = None
                except Exception as e:
                    print(f"[ERROR] Error saving violation frame: {e}")
                    violation_image_path = None
            
            # Return only filename, not full path
            violation_image_filename = None
            if violation_image_path:
                violation_image_filename = os.path.basename(violation_image_path)
            
            return {
                'success': True,
                'detections': all_detections,
                'has_violation': has_violation,
                'violations_count': max_violations_per_frame,
                'people_count': max_people_per_frame,
                'total_frames': total_frames,
                'processed_frames': processed_frames,
                'violation_image_path': violation_image_filename,
                'violation_frames_paths': violation_frames_paths,
                'frames_with_violations': 1 if has_violation else 0,
                'average_violations_per_frame': round(max_violations_per_frame / max(processed_frames, 1), 2)
            }
        
        except Exception as e:
            print(f"[ERROR] Video detection error: {e}")
            return {
                'success': False,
                'error': str(e),
                'detections': [],
                'has_violation': False,
                'violations_count': 0,
                'total_frames': 0,
                'processed_frames': 0
            }
    
    def _annotate_image(self, image, detections):
        """Draw bounding boxes on image"""
        for det in detections:
            x1, y1, x2, y2 = det['bbox']
            is_violation = det.get('is_violation', False)
            
            # Red for violations, green for safe
            color = (0, 0, 255) if is_violation else (0, 255, 0)
            label = f"{det['class']} {det['confidence']:.2f}"
            
            # Draw box
            cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
            
            # Draw label background
            (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(image, (x1, y1 - text_h - 10), (x1 + text_w, y1), color, -1)
            
            # Draw label text
            cv2.putText(image, label, (x1, y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Add timestamp
        timestamp = cv2.getTickCount()
        cv2.putText(image, f"Detection ID: {timestamp}", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        return image

# Singleton instance getter
def get_yolo_service():
    return YOLOService()