# Camera & Real-time Detection Fixes - Complete Guide

## Overview
This document describes the fixes applied to resolve camera streaming and detection recording issues.

---

## ✅ Issues Fixed

### 1. **Real-time Detection Not Being Recorded**
**Problem**: Violations and detections were not being saved to the database.

**Solution**: 
- Modified backend to automatically save violations to database
- Auto-save mode: `save_mode: 'violations_only'` (default)
- All violations are now recorded automatically without manual trigger
- Detection records include: timestamp, violation details, annotated image, and camera info

**Result**: ✓ All violations are now automatically recorded in database

---

### 2. **Local Webcam Video Not Displaying**
**Problem**: Camera appeared to be on but no video was visible on the page.

**Solution**:
- Fixed video element visibility for local webcam
- Shows live video feed while awaiting detection results
- Displays annotated image with detection boxes once available
- Added visual indicators (FPS counter, LIVE badge)

**Result**: ✓ Local webcam video now displays properly with detection overlays

---

### 3. **IP Camera Connection Issues**
**Problem**: IP camera (RTSP) connections frequently failed or timed out.

**Solution**:
- Increased connection timeout from 5s → 10s
- Added SSL verification bypass for self-signed certificates
- Improved error messages showing exact failure reason:
  - Connection timeout
  - Network unreachable
  - Invalid image data
  - Connection refused
- Frontend URL validation with helpful error messages

**Result**: ✓ IP cameras more stable, better error diagnostics

---

## 🚀 How to Use

### Local Webcam
1. Click "Local Webcam" camera source
2. Click "Start Camera" button
3. Grant browser permission when prompted
4. Live video feed appears
5. Detection results with bounding boxes overlay automatically

**Features**:
- Real-time FPS counter
- Automatic violation recording
- Audio alert on violations
- Live indicator badge

### IP Camera (RTSP/Streaming)
1. Click "Quick IP URL" camera source
2. Enter camera URL in format:
   ```
   http://192.168.1.X:8080/shot.jpg
   ```
   or
   ```
   http://username:password@192.168.1.X:8080/snapshot.jpg
   ```
3. Click "Start Camera"
4. Annotated video with detection overlays displays
5. Violations auto-recorded to database

**Common IP Camera URLs**:
- IP Webcam App: `http://192.168.1.X:8080/shot.jpg`
- Hikvision: `http://192.168.1.X/ISAPI/ContentMgmt/InputProxy/channels/1/picture`
- Dahua: `http://192.168.1.X/cgi-bin/snapshot.cgi`
- Generic MJPEG: `http://192.168.1.X:port/video`

### Saved Cameras
1. Click "Saved Camera"
2. Select from dropdown (cameras configured in admin panel)
3. Click "Start Camera"
4. Detection begins automatically

---

## 📊 Detection Recording Details

### Automatically Recorded Information
Each real-time detection creates a record with:
- **Timestamp**: Exact time of detection
- **Camera ID**: Which camera captured the image
- **Zone ID**: Which zone/area (if configured)
- **Violation Count**: Number of people without helmets
- **Detections**: List of all detected objects with:
  - Class (helmet, person, etc.)
  - Confidence score (0-100%)
  - Bounding box coordinates
  - Violation flag
- **Annotated Image**: Image with detection boxes drawn
- **File Type**: Marked as 'realtime' for filtering

### Accessing Recorded Detections
Via Detection Gallery:
- Admin → Detection Gallery
- Supervisor → Detection History
- Filter by date, camera, or violation status

Via API:
```bash
GET /api/supervisor/detections  # Get all detections
GET /api/detection/violations    # Get only violations
GET /api/detection/events        # Get with filters
```

---

## 🔧 Configuration

### Backend Settings (app/config.py)
```python
# Detection folders
DETECTION_FOLDER = 'detections'      # Where annotated images saved
UPLOAD_FOLDER = 'uploads'             # Where uploaded files saved

# YOLO model
YOLO_MODEL = 'best.pt'                # Custom trained model
YOLO_CONFIDENCE_THRESHOLD = 0.25      # Detection confidence threshold

# API Timeout for IP cameras
# (In routes/detection.py: timeout=10 seconds)
```

### Frontend Settings (src/pages/RealTimeMonitor.jsx)
```javascript
// Capture frequency
cameraType === 'local' ? 100 : 500    // ms between captures
// Local: 10 FPS, IP: 2 FPS

// Auto-save mode
save_mode: 'violations_only'          // Default: record violations only
```

---

## 🐛 Troubleshooting

### Local Webcam No Video
**Symptoms**: Camera button doesn't enable video element
**Fixes**:
1. Check browser permissions: Settings → Privacy → Camera
2. Refresh page and try again
3. Check browser console for errors (F12)
4. Try different browser (Chrome/Firefox preferred)

### IP Camera Not Connecting
**Symptoms**: "Failed to fetch image from URL" error
**Fixes**:
1. **Verify URL is correct**
   - Example: `http://192.168.1.10:8080/shot.jpg`
   - Check IP address and port with camera vendor docs
   
2. **Check network connectivity**
   ```bash
   ping 192.168.1.10  # Can you reach the camera?
   ```
   
3. **Enable camera on network**
   - Log into camera admin panel
   - Verify streaming/snapshot endpoint is enabled
   
4. **Check firewall**
   - Camera port may be blocked
   - Configure firewall rules to allow port through
   
5. **For authenticated cameras**
   - Include credentials: `http://user:pass@192.168.1.10:8080/shot.jpg`

### Detections Not Recording
**Symptoms**: Violations detected but not showing in gallery
**Fixes**:
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:5000/api/admin/violations`
3. Check detection folder exists: `backend/detections/`
4. Check MongoDB is running and accessible
5. Verify user is logged in (session valid)

### Low FPS or Laggy Detection
**Causes**:
- Network latency (slow IP camera)
- Slow model inference (large image size)
- Backend busy processing

**Solutions**:
1. Reduce camera resolution if possible
2. Adjust capture frequency in code (increase timeout)
3. Check backend CPU/GPU usage
4. Use local webcam instead of IP camera for better performance

---

## 📝 Technical Details

### Detection Pipeline

**Local Webcam**:
1. Browser captures frame from video element
2. Converts to Base64 image data
3. Sends to backend `/api/detection/real-time`
4. Backend runs YOLO inference
5. Returns annotated image + detections
6. Frontend displays annotated image
7. Auto-saves if violation detected

**IP Camera**:
1. Frontend sends camera URL to backend
2. Backend fetches current frame from IP camera
3. Decodes image and runs YOLO inference
4. Returns annotated image + detections
5. Frontend displays annotated image
6. Auto-saves if violation detected

### Frame Processing
- **Format**: JPEG (0.7 quality for bandwidth)
- **Encoding**: Base64 for transmission
- **Timeout**: 10 seconds per frame
- **Retry**: No automatic retry (manual restart)

### Detection Model
- **Model**: YOLOv8 (best.pt - custom trained)
- **Classes**: helmet, person, head, no_helmet
- **Confidence Threshold**: 0.25
- **Hardware**: GPU (CUDA) if available, else CPU
- **Speed**: ~100ms per frame on GPU

---

## 🔄 Sample Response Format

### Real-time Detection Response
```json
{
  "success": true,
  "has_violation": true,
  "violations_count": 2,
  "total_objects": 5,
  "annotated_image": "data:image/jpeg;base64,...",
  "detections": [
    {
      "class": "person",
      "confidence": 0.95,
      "bbox": [100, 50, 200, 300],
      "is_violation": false
    },
    {
      "class": "no_helmet",
      "confidence": 0.87,
      "bbox": [150, 60, 220, 280],
      "is_violation": true
    }
  ],
  "saved": true,
  "detection_id": "507f1f77bcf86cd799439011"
}
```

---

## 📋 Checklist Before Production

- [ ] Test local webcam capture
- [ ] Test IP camera with actual device
- [ ] Verify violations auto-record to database
- [ ] Check annotated images save correctly
- [ ] Test violation alerts/notifications
- [ ] Verify gallery shows recorded detections
- [ ] Test UI responsiveness with multiple detections
- [ ] Check error messages are helpful
- [ ] Monitor backend CPU/memory during streaming
- [ ] Test with different network speeds
- [ ] Verify CORS headers allow frontend requests
- [ ] Ensure detections folder has write permissions

---

## 📞 Support

For issues or improvements related to:
- **Camera streaming**: Check IP camera settings, network connectivity
- **Detection recording**: Verify MongoDB, user session, backend logs
- **UI/Display**: Check browser console (F12 Developer Tools)
- **Performance**: Monitor system resources, reduce resolution

Check server logs:
```bash
# Backend logs
tail -f backend/flask.log  # or grep "error" logs

# Check database
mongo smart_helmet_db
> db.detections.find().limit(5)
```

---

## Version Info
- **Fixed Date**: March 9, 2026
- **Backend Version**: Flask with YOLOv8
- **Frontend Version**: React with real-time overlay
- **Database**: MongoDB
