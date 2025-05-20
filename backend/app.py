import os 
from flask import Flask, jsonify, request 
from flask_cors import CORS
import requests 
from dotenv import load_dotenv
from controllers import make_cm_request

app = Flask(__name__)
CORS(app) 

LIST_ID = os.getenv("CAMPAIGN_MONITOR_LIST_ID")

@app.route('/api/subscribers', methods=['GET'])
def get_subscribers():
    endpoint = f"/lists/{LIST_ID}/active.json"
    data, error, status_code = make_cm_request('GET', endpoint)

    if error:
        return jsonify(error), status_code

    formatted_subscribers = []
    if data and isinstance(data.get("Results"), list):
        for sub in data["Results"]:
            formatted_subscribers.append({
                "email": sub.get("EmailAddress"),
                "name": sub.get("Name")
            })
        return jsonify(formatted_subscribers), 200
    return jsonify({"error": "Unexpected response format from Campaign Monitor"}), 500

@app.route('/api/subscribers', methods=['POST'])
def add_subscriber():
    req_data = request.get_json()
    email = req_data.get('email')
    name = req_data.get('name')

    if not email or not name:
        return jsonify({"error": "Email and Name are required"}), 400

    endpoint = f"/subscribers/{LIST_ID}.json"
    payload = {
        "EmailAddress": email,
        "Name": name,
        "ConsentToTrack": "Yes", 
        "Resubscribe": True, 
    }
    data, error, status_code = make_cm_request('POST', endpoint, json_data=payload)

    if status_code == 201 and data: 
        return jsonify({"email": data, "name": name}), 201
    elif error:
        cm_error_code = error.get('cm_error', {}).get('Code')
        if cm_error_code == 204: 
             return jsonify({"message": "Subscriber already exists", "email": email, "name": name}), 200
        return jsonify(error), status_code

    return jsonify({"error": "Failed to add subscriber"}), 500

@app.route('/api/subscribers/', methods=['DELETE'])
def remove_subscriber():
    req_data = request.get_json()
    email = req_data.get('email')

    endpoint = f"/subscribers/{LIST_ID}.json"
    params = {"email": email}

    _, error, status_code = make_cm_request('DELETE', endpoint, params=params)

    if status_code == 200 or status_code == 204:
        return jsonify({"message": "Subscriber removed successfully", "email": email}), 200
    elif error:
        return jsonify(error), status_code

    return jsonify({"error": "Failed to remove subscriber"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001) 