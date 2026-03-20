"""
Flask Application Factory
"""
import os
from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from app.config import get_config

mongo = PyMongo()

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Convert relative paths to absolute paths based on backend directory
    if not os.path.isabs(app.config['UPLOAD_FOLDER']):
        app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), app.config['UPLOAD_FOLDER'])
    if not os.path.isabs(app.config['DETECTION_FOLDER']):
        app.config['DETECTION_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(__file__)), app.config['DETECTION_FOLDER'])
    
    # Initialize extensions
    mongo.init_app(app)
    
    # CORS configuration - Critical for frontend communication
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": app.config['CORS_ORIGINS'],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                 "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
                 "expose_headers": ["Content-Range", "X-Content-Range"],
                 "supports_credentials": True,
                 "max_age": 3600
             }
         })
    
    # Create upload directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['DETECTION_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.supervisor import supervisor_bp
    from app.routes.detection import detection_bp
    from app.routes.daily_summary import daily_summary_bp
    from app.routes.stream import stream_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(supervisor_bp, url_prefix='/api/supervisor')
    app.register_blueprint(detection_bp, url_prefix='/api/detection')
    app.register_blueprint(daily_summary_bp, url_prefix='/api/daily-summary')
    app.register_blueprint(stream_bp, url_prefix='/api/stream')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'success': False, 'message': 'Resource not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {'success': False, 'message': 'Internal server error'}, 500
    
    @app.errorhandler(413)
    def too_large(error):
        return {'success': False, 'message': 'File too large'}, 413
    
    return app