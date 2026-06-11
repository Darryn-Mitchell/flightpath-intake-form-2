# FlightPath Intake Form

A multi-page web application for assessing customer fit for FlightPath engagement.

## Overview

The application collects customer information through an intake form, then guides users through 8 assessment sections. Each section opens in a popup window and contributes to a final recommendation score.

## Features

- Multi-section assessment workflow with modal overlays
- Real-time score calculation and recommendation
- Local data storage during assessment completion
- Email notifications to regional contacts (feature-flagged)
- Smartsheet integration for final data submission

## Quick Start

1. Install dependencies:
```bash
pip3 install flask flask-cors requests
```

2. Configure Smartsheet credentials in `server.py`:
   - Set `SMARTSHEET_TOKEN` (line 19)
   - Set `SMARTSHEET_ID` (line 20)

3. Run the server:
```bash
python3 server.py
```

4. Open http://localhost:8080

## Architecture

- **Frontend**: Vanilla JavaScript with in-memory session management during assessment
- **Backend**: Flask server with Smartsheet API integration and email notifications

## Scoring System

- 7 scored sections contribute to final recommendation
- Score > 30: Strong fit for FlightPath
- Score 20-30: Potential fit
- Score < 20: Not a good fit

## Files

- `index.html` - Main intake form with modal overlays
- `app.js` - Main page controller and modal management
- `sections.js` - Session and scoring logic with in-memory storage
- `sheet.js` - Backend API integration
- `server.py` - Python/Flask backend with Smartsheet and email integration
- `section-utils.js` - Utilities for section pages
- Section HTML files - Individual assessment sections loaded in modals

## Security Note

**Important**: The current `server.py` contains hardcoded credentials for demonstration purposes only. For production use:

1. Move credentials to environment variables
2. Use a `.env` file with python-dotenv
3. Never commit credentials to version control
