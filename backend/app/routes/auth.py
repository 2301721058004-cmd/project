"""
Authentication Routes - Login, Register, Logout, Session Management
"""
from flask import Blueprint, request, session
from app.models.user import User
from app.utils.helpers import login_required, success_response, error_response
import secrets
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        required = ['full_name', 'email', 'password', 'role']
        for field in required:
            if not data.get(field):
                return error_response(f'{field} is required')
        
        if data['role'] not in ['admin', 'supervisor']:
            return error_response('Invalid role')
        
        # Validate email format
        if not User.validate_email(data['email']):
            return error_response('Invalid email format. Please enter a valid email address (e.g., user@example.com)', 400)
        
        user = User.create_user(
            full_name=data['full_name'],
            email=data['email'],
            password=data['password'],
            role=data['role'],
            company=data.get('company')
        )
        
        if not user:
            return error_response('Email already registered', 409)
        
        return success_response(
            data={'user': user},
            message='Registration successful'
        )
        
    except Exception as e:
        return error_response(str(e), 500)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and create session"""
    try:
        data = request.get_json()
        
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return error_response('Email and password are required')
        
        user = User.get_by_email(email)
        if not user:
            return error_response('Invalid credentials', 401)
        
        if not User.verify_password(user, password):
            return error_response('Invalid credentials', 401)
        
        session.permanent = True
        session['user_id'] = str(user['_id'])
        session['email'] = user['email']
        session['role'] = user['role']
        session['full_name'] = user['full_name']
        
        return success_response(
            data={'user': User.serialize_user(user)},
            message='Login successful'
        )
        
    except Exception as e:
        return error_response(str(e), 500)

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """Logout user and clear session"""
    try:
        session.clear()
        return success_response(message='Logout successful')
    except Exception as e:
        return error_response(str(e), 500)

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    if 'user_id' in session:
        return success_response(data={'authenticated': True})
    return success_response(data={'authenticated': False})

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current logged in user"""
    try:
        user = User.get_by_id(session['user_id'])
        if not user:
            session.clear()
            return error_response('User not found', 404)
        
        return success_response(
            data={'user': User.serialize_user(user)}
        )
    except Exception as e:
        return error_response(str(e), 500)

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send reset password link via email (mocked)"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return error_response('Email is required')
            
        user = User.get_by_email(email)
        if not user:
            # For security, don't reveal that the user doesn't exist
            return success_response(message='If the email exists, a reset link will be sent')
            
        token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=1)
        
        if User.set_reset_token(email, token, expires):
            # MOCKED: Here you would send an actual email
            print(f"################################################")
            print(f"RESET LINK for {email}: http://localhost:3000/reset-password?token={token}")
            print(f"################################################")
            
            return success_response(message='Reset link has been generated (check console)')
            
        return error_response('Failed to generate reset link')
        
    except Exception as e:
        return error_response(str(e), 500)

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using a token"""
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return error_response('Token and password are required')
            
        user = User.get_by_reset_token(token)
        if not user:
            return error_response('Invalid or expired reset token', 400)
            
        if User.update_password(user['_id'], new_password):
            return success_response(message='Password updated successfully')
            
        return error_response('Failed to update password')
        
    except Exception as e:
        return error_response(str(e), 500)

@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update current user's profile information"""
    try:
        data = request.get_json()
        user_id = session['user_id']
        
        # Extract fields to update
        update_data = {}
        if 'full_name' in data:
            update_data['full_name'] = data['full_name']
        if 'company' in data:
            update_data['company'] = data['company']
            
        # Perform basic field update if any
        if update_data:
            User.update_user(user_id, update_data)
            # Update session info if name changed
            if 'full_name' in update_data:
                session['full_name'] = update_data['full_name']
                
        # Handle password change separately if provided
        if 'password' in data and data['password']:
            User.update_password(user_id, data['password'])
            
        # Get updated user to return
        updated_user = User.get_by_id(user_id)
        
        return success_response(
            data={'user': User.serialize_user(updated_user)},
            message='Profile updated successfully'
        )
        
    except Exception as e:
        return error_response(str(e), 500)