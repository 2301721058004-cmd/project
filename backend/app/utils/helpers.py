"""
Utility helper functions
"""
import os
import uuid
from datetime import datetime
from functools import wraps
from flask import session, jsonify, current_app
from bson import ObjectId

# DECORATORS
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        if session.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def supervisor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required'}), 401
        if session.get('role') not in ['supervisor', 'admin']:
            return jsonify({'success': False, 'message': 'Supervisor access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# UTILITY FUNCTIONS
def generate_filename(original_filename):
    ext = os.path.splitext(original_filename)[1]
    unique_id = uuid.uuid4().hex[:8]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return f"{timestamp}_{unique_id}{ext}"

def allowed_file(filename):
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def is_video_file(filename):
    """Check if file is a video based on extension"""
    video_extensions = {'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in video_extensions

def is_image_file(filename):
    """Check if file is an image based on extension"""
    image_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in image_extensions

def success_response(data=None, message=None):
    response = {'success': True}
    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response['data'] = data
    if message:
        response['message'] = message
    return jsonify(response)

def error_response(message, status_code=400):
    return jsonify({'success': False, 'message': message}), status_code