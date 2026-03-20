from flask import Blueprint, request, Response, session
from app.services.stream_service import stream_service
from app.utils.helpers import login_required, error_response

stream_bp = Blueprint('stream', __name__)

@stream_bp.route('/feed', methods=['GET'])
# Notice: Server Sent Events and MJPEG streams sometimes don't work well with strict CORS or login_required if credentials aren't passed via query or cookies properly, 
# but assuming @login_required can extract user_id from session/headers:
@login_required
def video_feed():
    url = request.args.get('url')
    zone_id = request.args.get('zone_id')
    camera_id = request.args.get('camera_id')
    
    if not url:
        return error_response("RTSP URL is required")
        
    user_id = session.get('user_id')
    
    return Response(
        stream_service.generate_frames(url, zone_id, camera_id, user_id),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )
