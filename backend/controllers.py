import os 
from flask import Flask, jsonify, request 
from flask_cors import CORS
import requests 
from dotenv import load_dotenv

load_dotenv()

CAMPAIGN_MONITOR_API_BASE_URL = "https://api.createsend.com/api/v3.3" 
API_KEY = os.getenv("CAMPAIGN_MONITOR_API_KEY")
LIST_ID = os.getenv("CAMPAIGN_MONITOR_LIST_ID")
CLIENT_ID = os.getenv("CAMPAIGN_MONITOR_CLIENT_ID")
auth_tuple = (API_KEY, 'x')

def make_cm_request(method, endpoint, params=None, json_data=None):
    headers = {
        "Authorization": f"Basic {API_KEY}",
        "Content-Type": "application/json"
    }
    url = f"{CAMPAIGN_MONITOR_API_BASE_URL}{endpoint}"
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers, params=params, auth=auth_tuple)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=json_data, params=params,auth=auth_tuple)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers, params=params,auth=auth_tuple)
        else:
            return None, {"error": "Unsupported HTTP method"}, 500

        response.raise_for_status() 
        try:
            return response.json(), None, response.status_code
        except ValueError: 
            return None, None, response.status_code

    except requests.exceptions.HTTPError as http_err:
        error_details = {"error": str(http_err)}
        try: 
            error_details['cm_error'] = response.json()
        except ValueError:
            pass 
        return None, error_details, response.status_code
    except requests.exceptions.RequestException as req_err:
        return None, {"error": str(req_err)}, 500