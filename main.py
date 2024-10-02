# app.py
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import requests
import os
from dotenv import load_dotenv
from twilio.rest import Client
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///grocery.db'
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this!
jwt = JWTManager(app)
db = SQLAlchemy(app)


# Twilio configuration
TWILIO_ACCOUNT_SID =  os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    phone_number = db.Column(db.String(20), nullable=False)
class GroceryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    purchase_date = db.Column(db.DateTime, nullable=False)
    expiry_date = db.Column(db.DateTime, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    notified = db.Column(db.Boolean, default=False)  # New field to track notifications


class ShoppingHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    purchase_date = db.Column(db.DateTime, nullable=False)

def send_expiry_notifications():
    with app.app_context():
        soon = datetime.now() + timedelta(days=2)
        expiring_items = GroceryItem.query.filter(
            GroceryItem.expiry_date <= soon,
            GroceryItem.notified == False  # Only get items that haven't been notified
        ).all()
        
        for item in expiring_items:
            user = User.query.get(item.user_id)
            message = twilio_client.messages.create(
                body=f"Your {item.name} is expiring on {item.expiry_date.strftime('%Y-%m-%d')}. Use it soon!",
                from_=TWILIO_PHONE_NUMBER,
                to=user.phone_number
            )
            # Mark the item as notified
            item.notified = True
            db.session.commit()
        print(f"Sent notifications for {len(expiring_items)} items")


scheduler = BackgroundScheduler()
scheduler.add_job(func=send_expiry_notifications, trigger="interval", hours=24)
scheduler.start()
@app.route('/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"message": "Username already exists"}), 400
    user = User(
        username=data['username'],
        password_hash=generate_password_hash(data['password']),
        phone_number=data['phone_number']
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password_hash, data['password']):
        # Set token expiration time (e.g., 15 minutes)
        access_token = create_access_token(identity=user.id, expires_delta=timedelta(minutes=15))
        return jsonify(access_token=access_token), 200
    return jsonify({"message": "Invalid username or password"}), 401

@app.route('/add_item', methods=['POST'])
@jwt_required()
def add_item():
    data = request.json
    new_item = GroceryItem(
        name=data['name'],
        purchase_date=datetime.now(),
        expiry_date=datetime.now() + timedelta(days=data['shelf_life']),
        user_id=data['user_id']
    )
    db.session.add(new_item)

    # Add to shopping history
    history_item = ShoppingHistory(
        user_id=data['user_id'],
        item_name=data['name'],
        purchase_date=datetime.now()
    )
    db.session.add(history_item)

    db.session.commit()
    return jsonify({"message": "Item added successfully"}), 201

@app.route('/delete_item/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    item = GroceryItem.query.get(item_id)
    if item:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Item deleted successfully"}), 200
    return jsonify({"message": "Item not found"}), 404

@app.route('/get_list/<int:user_id>', methods=['GET'])
@jwt_required()
def get_list(user_id):
    items = GroceryItem.query.filter_by(user_id=user_id).all()
    return jsonify([{
        "id": item.id,
        "name": item.name,
        "purchase_date": item.purchase_date.isoformat(),
        "expiry_date": item.expiry_date.isoformat()
    } for item in items])

@app.route('/get_expiring_soon/<int:user_id>', methods=['GET'])
@jwt_required()
def get_expiring_soon(user_id):
    soon = datetime.now() + timedelta(days=2)
    items = GroceryItem.query.filter(
        GroceryItem.user_id == user_id,
        GroceryItem.expiry_date <= soon
    ).all()
    return jsonify([{
        "id": item.id,
        "name": item.name,
        "expiry_date": item.expiry_date.isoformat()
    } for item in items])

@app.route('/get_shopping_history/<int:user_id>', methods=['GET'])
@jwt_required()
def get_shopping_history(user_id):
    history = ShoppingHistory.query.filter_by(user_id=user_id).order_by(ShoppingHistory.purchase_date.desc()).all()
    return jsonify([{
        "id": item.id,
        "name": item.item_name,
        "purchase_date": item.purchase_date.isoformat()
    } for item in history])

# @app.route('/send_expiry_notification', methods=['POST'])
# @jwt_required()
# def send_expiry_notification():
#     data = request.json
#     user_phone = data['phone_number']
#     item_name = data['item_name']
#     expiry_date = data['expiry_date']

#     message = twilio_client.messages.create(
#         body=f"Your {item_name} is expiring on {expiry_date}. Use it soon!",
#         from_=TWILIO_PHONE_NUMBER,
#         to=user_phone
#     )

#     return jsonify({"message": "Notification sent successfully", "sid": message.sid}), 200

@app.route('/get_recipes', methods=['GET'])
@jwt_required()
def get_recipes():
    ingredients = request.args.get('ingredients', '')
    api_key = os.getenv('SPOONACULAR_API_KEY')
    url = f"https://api.spoonacular.com/recipes/findByIngredients?ingredients={ingredients}&apiKey={api_key}"
    response = requests.get(url)
    return jsonify(response.json())

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)