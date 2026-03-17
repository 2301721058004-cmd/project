"""
User Model
"""
from app import mongo
import bcrypt
from bson import ObjectId
from datetime import datetime
import re

class User:
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        return re.match(email_regex, email) is not None
    
    @staticmethod
    def create_user(full_name, email, password, role='supervisor', company=None):
        # Validate email format
        if not User.validate_email(email):
            return None
        
        existing = mongo.db.users.find_one({'email': email})
        if existing:
            return None
        
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_doc = {
            'full_name': full_name,
            'email': email,
            'password_hash': password_hash,
            'role': role,
            'company': company,
            'created_at': datetime.utcnow(),
            'is_active': True
        }
        
        result = mongo.db.users.insert_one(user_doc)
        user_doc['_id'] = result.inserted_id
        return User.serialize_user(user_doc)
    
    @staticmethod
    def get_by_email(email):
        return mongo.db.users.find_one({'email': email})
    
    @staticmethod
    def get_by_id(user_id):
        try:
            return mongo.db.users.find_one({'_id': ObjectId(user_id)})
        except:
            return None
    
    @staticmethod
    def verify_password(user, password):
        return bcrypt.checkpw(password.encode('utf-8'), user['password_hash'])
    
    @staticmethod
    def serialize_user(user, include_email=True):
        if not user:
            return None
        
        serialized = {
            'id': str(user['_id']),
            'full_name': user['full_name'],
            'role': user['role'],
            'company': user.get('company', ''),
            'created_at': (user['created_at'].isoformat() + 'Z') if isinstance(user['created_at'], datetime) else user['created_at']
        }
        
        if include_email:
            serialized['email'] = user['email']
        
        return serialized
    
    @staticmethod
    def get_all_supervisors():
        try:
            supervisors = mongo.db.users.find({'role': 'supervisor'})
            result = []
            for s in supervisors:
                result.append(User.serialize_user(s))
            return result  # Always returns array, even if empty
        except:
            return []  # Return empty array on error
    
    @staticmethod
    def update_user(user_id, update_data):
        try:
            # Hash password if provided
            if 'password' in update_data:
                password = update_data['password']
                if password:
                    update_data['password_hash'] = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                del update_data['password']
            
            update_data['updated_at'] = datetime.utcnow()
            
            result = mongo.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': update_data}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def set_reset_token(email, token, expires):
        """Set reset token and expiration for a user"""
        try:
            result = mongo.db.users.update_one(
                {'email': email},
                {
                    '$set': {
                        'reset_token': token,
                        'reset_expires': expires,
                        'updated_at': datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error setting reset token: {e}")
            return False

    @staticmethod
    def get_by_reset_token(token):
        """Find user by reset token and ensure it's not expired"""
        try:
            return mongo.db.users.find_one({
                'reset_token': token,
                'reset_expires': {'$gt': datetime.utcnow()}
            })
        except Exception as e:
            print(f"Error finding user by reset token: {e}")
            return None

    @staticmethod
    def update_password(user_id, new_password):
        """Update user password with proper hashing"""
        try:
            password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            result = mongo.db.users.update_one(
                {'_id': ObjectId(user_id)},
                {
                    '$set': {
                        'password_hash': password_hash,
                        'updated_at': datetime.utcnow()
                    },
                    '$unset': {
                        'reset_token': "",
                        'reset_expires': ""
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating password: {e}")
            return False

    @staticmethod
    def delete_user(user_id):
        try:
            result = mongo.db.users.delete_one({'_id': ObjectId(user_id)})
            return result.deleted_count > 0
        except:
            return False