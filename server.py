#!/usr/bin/env python3
"""
Simple Python backend server for FlightPath form
Handles Smartsheet API calls to avoid CORS issues
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Smartsheet configuration
SMARTSHEET_TOKEN = "H23ChLulw7og0G9cEZA6fhPUoZyivfiYQoacj"
SMARTSHEET_ID = "chQQpPFJxWR6gmc7W7mcg44G5crcGM2WG4jQJ371"

# Local storage configuration
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

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

def save_to_local_storage(payload):
    """Save data to local JSON file"""
    timestamp = datetime.now().isoformat()

    # Add timestamp to payload
    data_entry = {
        "timestamp": timestamp,
        **payload
    }

    # Determine which file to save to based on payload type
    payload_type = payload.get("type", "intake")
    filename = f"{payload_type}.json"
    filepath = DATA_DIR / filename

    # Load existing data or create new list
    if filepath.exists():
        with open(filepath, 'r') as f:
            data = json.load(f)
    else:
        data = []

    # Append new entry
    data.append(data_entry)

    # Save back to file
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

    return {"saved": True, "file": str(filepath), "entry_count": len(data)}

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

        # Always save to local storage first
        local_result = save_to_local_storage(payload)

        # Try to submit to Smartsheet, but don't fail if it doesn't work
        smartsheet_result = None
        try:
            smartsheet_result = submit_to_smartsheet(payload)
        except Exception as smartsheet_error:
            print(f"Warning: Smartsheet submission failed: {smartsheet_error}")
            # Continue anyway - we have local storage

        return jsonify({
            "success": True,
            "local": local_result,
            "smartsheet": smartsheet_result
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/data/<data_type>')
def get_data(data_type):
    """Retrieve stored data by type"""
    try:
        filename = f"{data_type}.json"
        filepath = DATA_DIR / filename

        if not filepath.exists():
            return jsonify({"success": True, "data": [], "message": "No data yet"})

        with open(filepath, 'r') as f:
            data = json.load(f)

        return jsonify({"success": True, "data": data, "count": len(data)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/data')
def list_all_data():
    """List all available data files"""
    try:
        files = list(DATA_DIR.glob("*.json"))
        data_summary = {}

        for filepath in files:
            with open(filepath, 'r') as f:
                data = json.load(f)
                data_summary[filepath.stem] = {
                    "count": len(data),
                    "file": filepath.name
                }

        return jsonify({"success": True, "files": data_summary})
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
