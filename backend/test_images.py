#!/usr/bin/env python3
"""
Test script to verify detection image serving is working
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app
    
    print("=" * 60)
    print("DETECTION IMAGE SERVING - DIAGNOSTIC TEST")
    print("=" * 60)
    
    app = create_app()
    
    with app.app_context():
        print("\n✓ Flask app created successfully")
        
        print("\n" + "-" * 60)
        print("CONFIGURATION")
        print("-" * 60)
        
        upload_folder = app.config['UPLOAD_FOLDER']
        detection_folder = app.config['DETECTION_FOLDER']
        
        print(f"UPLOAD_FOLDER:     {upload_folder}")
        print(f"DETECTION_FOLDER:  {detection_folder}")
        
        # Check if paths are absolute
        is_upload_absolute = os.path.isabs(upload_folder)
        is_detection_absolute = os.path.isabs(detection_folder)
        
        print(f"\nUpload path is absolute:     {is_upload_absolute}")
        print(f"Detection path is absolute:  {is_detection_absolute}")
        
        print("\n" + "-" * 60)
        print("FOLDER STATUS")
        print("-" * 60)
        
        # Check detection folder
        if os.path.exists(detection_folder):
            print(f"✓ Detection folder EXISTS: {detection_folder}")
            
            # List detection files
            try:
                files = [f for f in os.listdir(detection_folder) if f.startswith('det_')]
                print(f"✓ Found {len(files)} detection image files")
                
                if files[:5]:
                    print("\n  Sample files:")
                    for f in files[:5]:
                        full_path = os.path.join(detection_folder, f)
                        size = os.path.getsize(full_path) / 1024  # KB
                        print(f"    - {f} ({size:.1f} KB)")
            except Exception as e:
                print(f"✗ Error listing files: {e}")
        else:
            print(f"✗ Detection folder DOES NOT EXIST: {detection_folder}")
        
        print("\n" + "-" * 60)
        print("DATABASE CONNECTION")
        print("-" * 60)
        
        try:
            from app.models.detection import DetectionEvent
            
            # Try to get one detection
            detections = DetectionEvent.get_all_detections(limit=1)
            
            if detections:
                det = detections[0]
                print(f"✓ MongoDB connection is working")
                print(f"  ID: {det['id']}")
                print(f"  Image path: {det.get('annotated_image_path', 'NOT SET')}")
                print(f"  Has violation: {det.get('has_violation', 'N/A')}")
            else:
                print("✓ MongoDB connection is working (no detections found yet)")
        except Exception as e:
            print(f"✗ MongoDB connection error: {e}")
        
        print("\n" + "-" * 60)
        print("API ENDPOINT TEST")
        print("-" * 60)
        
        try:
            with app.test_client() as client:
                # Get a detection
                from app.models.detection import DetectionEvent
                detections = DetectionEvent.get_all_detections(limit=1)
                
                if detections and detections[0].get('annotated_image_path'):
                    image_path = detections[0]['annotated_image_path']
                    print(f"Testing image endpoint with: {image_path}")
                    
                    response = client.get(f'/api/detection/image/{image_path}')
                    print(f"Response status: {response.status_code}")
                    
                    if response.status_code == 200:
                        print(f"✓ Image endpoint is working! Content-Type: {response.content_type}")
                        print(f"  Response size: {len(response.data)} bytes")
                    else:
                        print(f"✗ Image endpoint returned {response.status_code}")
                        print(f"  Response: {response.get_data(as_text=True)}")
                else:
                    print("⚠ No detections with image path found (yet)")
        
        except Exception as e:
            print(f"✗ Error testing endpoint: {e}")
        
        print("\n" + "=" * 60)
        print("DIAGNOSTIC COMPLETE")
        print("=" * 60)
        print("\nNOTE: Open browser console (F12) and check for 404 errors")
        print("when loading images. Error logs will show below:")
        print("=" * 60)

except Exception as e:
    print(f"✗ FATAL ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
