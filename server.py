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
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from pathlib import Path

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Smartsheet configuration
SMARTSHEET_TOKEN = "H23ChLulw7og0G9cEZA6fhPUoZyivfiYQoacj"
SMARTSHEET_ID = "chQQpPFJxWR6gmc7W7mcg44G5crcGM2WG4jQJ371"

# Email configuration
# FEATURE FLAG: Set to True to enable email notifications
ENABLE_EMAIL_NOTIFICATIONS = False  # TODO: Set to True when ready for production

EMAIL_RECIPIENTS = {
    "EMEA": "damitche@redhat.com",
    "North America": "cvacca@redhat.com",
    "LATAM": "almachad@redhat.com",
    "APAC": "dechan@redhat.com",
}

# SMTP configuration (using local sendmail for now)
# For production, use environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "25"))

# Local storage configuration
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

def send_email_notification(payload):
    """Send email notification for completed assessments"""
    # Check if email notifications are enabled
    if not ENABLE_EMAIL_NOTIFICATIONS:
        print("Email notifications are disabled (feature flag)")
        return {"sent": False, "reason": "feature_disabled"}

    # Only send for completeAssessment type
    if payload.get("type") != "completeAssessment":
        return None

    # Get region from intake data
    intake_data = payload.get("intakeData", {})
    region = intake_data.get("region")

    # Check if this region has an email recipient
    recipient = EMAIL_RECIPIENTS.get(region)
    if not recipient:
        print(f"No email recipient configured for region: {region}")
        return None

    # Build email content
    customer_name = intake_data.get("salesforceName", "Unknown")
    segment = intake_data.get("segment", "Unknown")
    total_score = payload.get("totalScore", 0)
    recommendation = payload.get("recommendation", "No recommendation")
    scores = payload.get("scores", {})

    # Create HTML email
    html_content = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .header {{ background-color: #ee0000; color: white; padding: 20px; }}
            .content {{ padding: 20px; }}
            .score-box {{ background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }}
            .recommendation {{ padding: 15px; margin: 15px 0; border-radius: 5px; font-weight: bold; }}
            .good {{ background-color: #dcfce7; color: #166534; border: 1px solid #86efac; }}
            .okay {{ background-color: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }}
            .not-fit {{ background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }}
            table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
            th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
            th {{ background-color: #f5f5f5; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>FlightPath Assessment Complete</h1>
        </div>
        <div class="content">
            <h2>Assessment Summary</h2>
            <p><strong>Customer:</strong> {customer_name}</p>
            <p><strong>Segment:</strong> {segment}</p>
            <p><strong>Region:</strong> {region}</p>
            <p><strong>Total Score:</strong> {total_score}</p>

            <div class="recommendation {'good' if total_score > 30 else 'okay' if total_score > 20 else 'not-fit'}">
                {recommendation}
            </div>

            <h3>Section Scores</h3>
            <table>
                <tr>
                    <th>Section</th>
                    <th>Score</th>
                </tr>
                <tr><td>Executive Engagement</td><td>{scores.get('executiveEngagement', 'N/A')}</td></tr>
                <tr><td>Customer Technology</td><td>{scores.get('customerTechnology', 'N/A')}</td></tr>
                <tr><td>Customer ARR</td><td>{scores.get('customerArr', 'N/A')}</td></tr>
                <tr><td>Delivery & Execution</td><td>{scores.get('deliveryExecution', 'N/A')}</td></tr>
                <tr><td>Customer Problem Statement</td><td>{scores.get('customerProblemStatement', 'N/A')}</td></tr>
                <tr><td>Customer Strategic Direction</td><td>{scores.get('customerStrategicDirection', 'N/A')}</td></tr>
                <tr><td>Executive Sponsorship</td><td>{scores.get('executiveSponsorship', 'N/A')}</td></tr>
            </table>

            <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
                This is an automated notification from the FlightPath Intake System.
            </p>
        </div>
    </body>
    </html>
    """

    # Create email message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"FlightPath Assessment Complete - {customer_name}"
    msg['From'] = "FlightPath System <flightpath@redhat.com>"
    msg['To'] = recipient

    # Attach HTML content
    html_part = MIMEText(html_content, 'html')
    msg.attach(html_part)

    # Send email
    try:
        # Using local SMTP server
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.send_message(msg)
        print(f"Email sent to {recipient} for {customer_name} ({region})")
        return {"sent": True, "recipient": recipient}
    except Exception as e:
        print(f"Failed to send email: {e}")
        return {"sent": False, "error": str(e)}

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

    # Handle complete assessment submission
    if payload.get("type") == "completeAssessment":
        intake = payload.get("intakeData", {})
        scores = payload.get("scores", {})

        # Build the cells array with all data
        cells = [
            {"columnId": columns.get("Timestamp"), "value": datetime.now().isoformat()},
            {"columnId": columns.get("Submission ID"), "value": payload.get("submissionId")},
            {"columnId": columns.get("Salesforce Name"), "value": intake.get("salesforceName")},
            {"columnId": columns.get("Segment"), "value": intake.get("segment")},
            {"columnId": columns.get("Region"), "value": intake.get("region")},
            {"columnId": columns.get("Total Score"), "value": payload.get("totalScore")},
            {"columnId": columns.get("Recommendation"), "value": payload.get("recommendation")},
            {"columnId": columns.get("Executive Engagement"), "value": scores.get("executiveEngagement")},
            {"columnId": columns.get("Customer Technology"), "value": scores.get("customerTechnology")},
            {"columnId": columns.get("Customer ARR"), "value": scores.get("customerArr")},
            {"columnId": columns.get("Delivery Execution"), "value": scores.get("deliveryExecution")},
            {"columnId": columns.get("Customer Problem Statement"), "value": scores.get("customerProblemStatement")},
            {"columnId": columns.get("Customer Strategic Direction"), "value": scores.get("customerStrategicDirection")},
            {"columnId": columns.get("Executive Sponsorship"), "value": scores.get("executiveSponsorship")},
        ]
    else:
        # Original intake-only submission
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

        # Send email notification for completed assessments
        email_result = None
        try:
            email_result = send_email_notification(payload)
        except Exception as email_error:
            print(f"Warning: Email notification failed: {email_error}")
            # Continue anyway - email is not critical

        return jsonify({
            "success": True,
            "local": local_result,
            "smartsheet": smartsheet_result,
            "email": email_result
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
