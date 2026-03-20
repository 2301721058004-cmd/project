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
    
    def detect_video(self, video_path, output_path=None, conf_threshold=None, frame_skip=1):
        """
        Run detection on video file
        
        Args:
            video_path: Path to input video file
            output_path: Path to save annotated video
            conf_threshold: Confidence threshold for detections
            frame_skip: Process every nth frame (1 = all frames, 2 = every 2nd frame, etc)
        
        Returns:
            dict: {
                'success': bool,
                'detections': list of detection objects,
                'has_violation': bool,
                'violations_count': int,
                'total_frames': int,
                'processed_frames': int,
                'output_video_path': str,
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
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Validate and fix video properties
            if fps == 0 or fps is None:
                fps = 30  # Default to 30 fps if not detected
            if width == 0 or height == 0:
                print(f"[WARNING] Invalid video dimensions: {width}x{height}")
                cap.release()
                return {
                    'success': False,
                    'error': 'Invalid video dimensions',
                    'detections': [],
                    'has_violation': False,
                    'violations_count': 0,
                    'total_frames': 0,
                    'processed_frames': 0
                }
            
            # Ensure dimensions are even (required for most codecs)
            width = width if width % 2 == 0 else width - 1
            height = height if height % 2 == 0 else height - 1
            
            # Set confidence threshold
            if conf_threshold is None:
                conf_threshold = current_app.config.get('YOLO_CONFIDENCE_THRESHOLD', 0.25) if current_app else 0.25
            
            # Setup video writer if output path is provided
            writer = None
            if output_path:
                # Try different codecs in order of browser HTML5 compatibility
                codecs_to_try = [
                    ('mp4v', 'mp4v - MPEG4'),  # Most compatible with HTML5 video
                    ('MJPG', 'MJPG - Motion JPEG'), 
                    ('XVID', 'XVID - MPEG4'),
                    ('DIVX', 'DIVX - MPEG4'),
                ]
                
                writer_initialized = False
                for fourcc_code, description in codecs_to_try:
                    try:
                        if fourcc_code.isupper():
                            fourcc = cv2.VideoWriter_fourcc(*fourcc_code)
                        else:
                            fourcc = cv2.VideoWriter_fourcc(*fourcc_code)
                        
                        test_writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                        
                        if test_writer.isOpened():
                            writer = test_writer
                            print(f"[INFO] Video writer initialized with {description}: {output_path}")
                            writer_initialized = True
                            break
                        else:
                            test_writer.release()
                            print(f"[WARNING] Codec {description} not available")
                    except Exception as e:
                        print(f"[WARNING] Failed to initialize codec {description}: {e}")
                        continue
                
                if not writer_initialized:
                    print(f"[WARNING] Could not initialize video writer with any codec, will skip video output")
                    writer = None
            
            all_detections = []
            violations_count = 0
            max_violations_per_frame = 0  # Track maximum violations in any single frame
            max_people_per_frame = 0 # Track maximum people in any single frame
            total_violations_per_frame = []
            processed_frames = 0
            frame_count = 0
            
            # For storing violation frames - UNIQUE violations only
            violation_frames_data = {}  # frame_number: (annotated_frame, detections)
            unique_violation_frames = []  # Store ONLY unique violation frames (one per person)
            violation_bboxes = []  # Track unique violation bboxes to avoid duplicates
            
            # Process video frames
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                
                # Skip frames based on frame_skip parameter
                if frame_count % frame_skip != 0:
                    if writer:
                        writer.write(frame)
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
                        
                        # Check for violations
                        # Class 0: head (violation), Class 1: helmet (safe)
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
                total_violations_per_frame.append(frame_violations)
                
                # Track maximum violations in any frame and store the frame
                if frame_violations > max_violations_per_frame:
                    max_violations_per_frame = frame_violations
                    # Store this frame for later extraction
                    annotated_frame = self._annotate_image(frame.copy(), frame_detections)
                    violation_frames_data['max_frame'] = (annotated_frame, frame_detections, frame_count)
                
                # Store UNIQUE violation frames (one per violation person found)
                if frame_violations > 0:
                    annotated_frame = self._annotate_image(frame.copy(), frame_detections)
                    
                    # Track unique violations by bounding box to avoid duplicates
                    violation_detections = [d for d in frame_detections if d.get('is_violation')]
                    for violation in violation_detections:
                        bbox = tuple(violation['bbox'])
                        
                        # Check if this bbox is already tracked (within 50 pixels tolerance)
                        is_new_violation = True
                        for existing_bbox in violation_bboxes:
                            if all(abs(bbox[i] - existing_bbox[i]) < 50 for i in range(4)):
                                is_new_violation = False
                                break
                        
                        # If new unique violation, store the frame
                        if is_new_violation:
                            violation_bboxes.append(bbox)
                            unique_violation_frames.append({
                                'frame_num': frame_count,
                                'violations': 1,
                                'annotated_frame': annotated_frame,
                                'detections': [violation]
                            })
                    
                    # Also store first violation frame if we don't have one yet
                    if 'first_frame' not in violation_frames_data:
                        violation_frames_data['first_frame'] = (annotated_frame, frame_detections, frame_count)
                
                # Annotate frame
                annotated_frame = self._annotate_image(frame.copy(), frame_detections)
                
                # Add frame info
                cv2.putText(annotated_frame, f"Frame: {frame_count}/{total_frames}", 
                           (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                if writer:
                    # Ensure frame dimensions match writer expectations
                    frame_height, frame_width = annotated_frame.shape[:2]
                    if frame_width != width or frame_height != height:
                        annotated_frame = cv2.resize(annotated_frame, (width, height))
                    writer.write(annotated_frame)
            
            # Release resources
            cap.release()
            if writer:
                writer.release()
            
            # Calculate statistics - use max violations per frame, not cumulative sum
            has_violation = max_violations_per_frame > 0
            
            # Extract and save violation frame images
            violation_image_path = None
            violation_frames_paths = []  # List of all violation frame paths
            
            if has_violation and 'max_frame' in violation_frames_data:
                try:
                    violation_frame, _, frame_num = violation_frames_data['max_frame']
                    violation_image_filename = f"vio_{os.path.basename(output_path or video_path).split('.')[0]}_frame{frame_num}.jpg"
                    violation_image_path = os.path.join(
                        current_app.config['DETECTION_FOLDER'], 
                        violation_image_filename
                    ) if current_app else None
                    
                    if violation_image_path:
                        success = cv2.imwrite(violation_image_path, violation_frame)
                        if success:
                            print(f"[INFO] Saved main violation frame: {violation_image_filename}")
                        else:
                            print(f"[WARNING] Failed to save main violation frame")
                            violation_image_path = None
                except Exception as e:
                    print(f"[ERROR] Error saving main violation frame: {e}")
                    violation_image_path = None
            
            # Save UNIQUE violation frames as individual detection results
            if unique_violation_frames:
                base_filename = os.path.basename(output_path or video_path).split('.')[0]
                for idx, violation_data in enumerate(unique_violation_frames):
                    try:
                        frame_num = violation_data['frame_num']
                        annotated_frame = violation_data['annotated_frame']
                        frame_filename = f"frame_{base_filename}_f{frame_num}_v{idx+1}.jpg"
                        frame_path = os.path.join(
                            current_app.config['DETECTION_FOLDER'], 
                            frame_filename
                        ) if current_app else None
                        
                        if frame_path:
                            success = cv2.imwrite(frame_path, annotated_frame)
                            if success:
                                violation_frames_paths.append(frame_filename)
                                print(f"[INFO] Saved violation frame: {frame_filename}")
                            else:
                                print(f"[WARNING] Failed to save violation frame: {frame_filename}")
                    except Exception as e:
                        print(f"[ERROR] Error saving violation frame {idx}: {e}")
                        continue
            
            # Verify video file was created
            video_exists = False
            video_size = 0
            if output_path and os.path.exists(output_path):
                video_exists = True
                video_size = os.path.getsize(output_path)
                print(f"[INFO] Video file created: {output_path} ({video_size} bytes)")
            else:
                print(f"[WARNING] Video file not created or not found: {output_path}")
            
            # Get just the filename for return (not full path)
            violation_image_filename = None
            if violation_image_path:
                violation_image_filename = os.path.basename(violation_image_path)
            
            return {
                'success': True,
                'detections': all_detections,
                'has_violation': has_violation,
                'violations_count': max_violations_per_frame,  # Count violations in worst frame
                'people_count': max_people_per_frame,  # Use max people in any single frame
                'total_frames': total_frames,
                'processed_frames': processed_frames,
                'output_video_path': output_path,
                'violation_image_path': violation_image_filename,
                'violation_frames_paths': violation_frames_paths,  # Only unique violation frames
                'frames_with_violations': sum(1 for v in total_violations_per_frame if v > 0),
                'average_violations_per_frame': round(max_violations_per_frame / max(processed_frames, 1), 2)
            }
        
        except Exception as e:
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