"""
Configuration settings for Flask application
"""
import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    # Flask core settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # MongoDB settings
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/smart_helmet_db')
    
    # File upload settings
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    DETECTION_FOLDER = os.getenv('DETECTION_FOLDER', 'detections')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB max file size
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    
    # Session settings
    SESSION_TYPE = 'filesystem'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    SESSION_COOKIE_NAME = 'smart_helmet_session'
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # CORS settings
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]
    
    # YOLO model settings
    YOLO_MODEL = os.getenv('YOLO_MODEL', 'yolov8n.pt')
    YOLO_CONFIDENCE_THRESHOLD = float(os.getenv('YOLO_CONFIDENCE_THRESHOLD', 0.25))
    
    # Pagination settings
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True  # Requires HTTPS
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    # Stricter CORS in production
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '').split(',') if os.getenv('CORS_ORIGINS') else []


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    MONGO_URI = os.getenv('TEST_MONGO_URI', 'mongodb://localhost:27017/smart_helmet_test')
    WTF_CSRF_ENABLED = False


# Configuration dictionary
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config(config_name=None):
    """Get configuration class by name"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    return config_by_name.get(config_name, DevelopmentConfig)