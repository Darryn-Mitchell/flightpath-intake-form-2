#!/usr/bin/env python3
"""
Simple Python backend server for FlightPath form
Handles Smartsheet API calls to avoid CORS issues
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Smartsheet configuration
SMARTSHEET_TOKEN = "H23ChLulw7og0G9cEZA6fhPUoZyivfiYQoacj"
SMARTSHEET_ID = "chQQpPFJxWR6gmc7W7mcg44G5crcGM2WG4jQJ371"

def get_sheet_columns():
    """Get column information from Smartsheet"""
    url = f"https://api.smartsheet.com/2.0/sheets/{SMARTSHEET_ID}"
    headers = {
        "Authorization": f"Bearer {SMARTSHEET_TOKEN}",
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to get sheet info: {response.text}")

    data = response.json()
    columns = {col['title']: col['id'] for col in data['columns']}
    return columns

def submit_to_smartsheet(payload):
    """Submit data to Smartsheet"""
    columns = get_sheet_columns()

    # Build the cells array
    cells = [
        {"columnId": columns.get("Timestamp"), "value": datetime.now().isoformat()},
        {"columnId": columns.get("Submission ID"), "value": payload.get("submissionId")},
        {"columnId": columns.get("Salesforce Name"), "value": payload.get("salesforceName")},
        {"columnId": columns.get("Segment"), "value": payload.get("segment")},
        {"columnId": columns.get("Region"), "value": payload.get("region")}
    ]

    # Submit the row
    url = f"https://api.smartsheet.com/2.0/sheets/{SMARTSHEET_ID}/rows"
    headers = {
        "Authorization": f"Bearer {SMARTSHEET_TOKEN}",
        "Content-Type": "application/json"
    }

    body = {
        "rows": [{
            "toTop": True,
            "cells": cells
        }]
    }

    response = requests.post(url, headers=headers, json=body)
    if response.status_code not in [200, 201]:
        raise Exception(f"Failed to submit to Smartsheet: {response.text}")

    return response.json()

@app.route('/api/submit', methods=['POST', 'OPTIONS'])
def handle_submit():
    """Handle form submission"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 204

    try:
        payload = request.get_json()
        result = submit_to_smartsheet(payload)
        return jsonify({"success": True, "data": result})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/')
def serve_index():
    """Serve the main HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('.', path)

if __name__ == '__main__':
    print("Starting FlightPath Form Server...")
    print("Server running at http://localhost:8080")
    print("Press Ctrl+C to stop")
    app.run(host='0.0.0.0', port=8080, debug=True)
