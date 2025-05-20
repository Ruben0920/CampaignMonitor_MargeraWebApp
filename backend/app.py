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
    if not req_data:
        return jsonify({"error": "Invalid JSON payload or empty request"}), 400

    subs_list_from_payload = req_data.get('subscribers', None)

    if subs_list_from_payload is None:
        email = req_data.get('email')
        name = req_data.get('name')

        if not email or not name:
            return jsonify({"error": "Email and Name are required for single subscriber"}), 400

        endpoint_single = f"/subscribers/{LIST_ID}.json"
        payload_single = {
            "EmailAddress": email,
            "Name": name,
            "ConsentToTrack": "Yes", 
            "Resubscribe": True,     
        }
        
        data, error, status_code = make_cm_request('POST', endpoint_single, json_data=payload_single)

        if status_code == 201:
            return jsonify({"message": "Subscriber added successfully", "email": data, "name": name}), 201
        elif error:
            cm_error_obj = error.get('cm_error', {})
            cm_error_code = cm_error_obj.get('Code')
          
            if cm_error_code == 204: 
                 return jsonify({"message": "Subscriber already exists and is active", "email": email, "name": name, "details": cm_error_obj}), 200 # Using 200 for "already exists"
            return jsonify({"error": "Failed to add subscriber", "details": error}), status_code
        else: 
            return jsonify({"error": "Failed to add subscriber, unexpected response from Campaign Monitor", "status_code_from_cm": status_code}), 500

    elif isinstance(subs_list_from_payload, list):
        if not subs_list_from_payload:
            return jsonify({"error": "Subscribers list cannot be empty for bulk add"}), 400

        subscribers_for_cm_import = []
        validation_results = [] 

        for sub_item in subs_list_from_payload:
            email = sub_item.get('email')
            name = sub_item.get('name')

            if not email or not name:
                validation_results.append({
                    "email": email or "N/A", "name": name or "N/A", "status": "error",
                    "message": "Skipped: Email and Name are required."
                })
                continue

            subscribers_for_cm_import.append({
                "EmailAddress": email,
                "Name": name,
                "ConsentToTrack": "Yes",
            })
        
        if not subscribers_for_cm_import:
            return jsonify({
                "error": "No valid subscribers to import after validation.",
                "validation_details": validation_results
            }), 400

        endpoint_bulk = f"/subscribers/{LIST_ID}/import.json"
        payload_bulk_cm = {
            "Subscribers": subscribers_for_cm_import,
            "Resubscribe": True, 
            "QueueSubscriptionBasedAutoresponders": True,
            "RestartSubscriptionBasedAutoresponders": True 
        }

        data_cm_bulk, error_cm_bulk, status_code_cm_bulk = make_cm_request('POST', endpoint_bulk, json_data=payload_bulk_cm)

        if status_code_cm_bulk == 201:
            return jsonify({
                "message": "Bulk subscriber import request accepted by Campaign Monitor.",
                "import_summary": data_cm_bulk,
                "initial_validation_notes": validation_results if validation_results else "All items initially valid."
            }), 202
        elif error_cm_bulk:
            return jsonify({
                "error": "Error during bulk import process.",
                "details": error_cm_bulk,
                "submitted_for_import_count": len(subscribers_for_cm_import)
            }), status_code_cm_bulk 
        else:
            return jsonify({
                "error": "Unexpected issue during bulk import to Campaign Monitor.",
                "status_code_from_cm": status_code_cm_bulk,
                 "submitted_for_import_count": len(subscribers_for_cm_import)
            }), status_code_cm_bulk if status_code_cm_bulk >= 400 else 500
    else:
        return jsonify({"error": "Invalid 'subscribers' field; expected a list."}), 400



@app.route('/api/subscribers/', methods=['DELETE'])
def remove_subscriber():
    req_data = request.get_json()
    subs = req_data.get('subscribers',None)
    if(subs is None):
        email = req_data.get('email')

        endpoint = f"/subscribers/{LIST_ID}.json"
        params = {"email": email}

        _, error, status_code = make_cm_request('DELETE', endpoint, params=params)

        if status_code == 200 or status_code == 204:
            return jsonify({"message": "Subscriber removed successfully", "email": email}), 200
        elif error:
            return jsonify(error), status_code

        return jsonify({"error": "Failed to remove subscriber"}), 500
    elif isinstance(subs,list):
        results = []
        for sub in subs:
            email = sub.get('email')
            endpoint = f"/subscribers/{LIST_ID}.json"
            params = {"email": email}

            _, error, status_code = make_cm_request('DELETE', endpoint, params=params)

            if status_code == 200 or status_code == 204:
                  results.append({
                    "email": email,
                    "status": "success"
                })
            elif error:
                results.append({
                    "email": email,
                    "status": "error",
                    "error": "Error"
                })
                continue
            else:
                results.append({
                    "email": email,
                    "status": "error",
                    "error": "Failed to delete subscriber"
                })

        return jsonify({"results": results}), 207 
    return jsonify({"error": "Failed to remove subscriber"}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001) 