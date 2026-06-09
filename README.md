# FlightPath Intake Form

A multi-page web application for assessing customer fit for FlightPath engagement.

## Overview

The application collects customer information through an intake form, then guides users through 8 assessment sections. Each section opens in a popup window and contributes to a final recommendation score.

## Features

- Multi-section assessment workflow with auto-progression
- Real-time score calculation and recommendation
- Cross-window state synchronization using BroadcastChannel API
- Dual backend support: Python/Smartsheet or Google Apps Script/Sheets

## Quick Start

### Python Backend (Smartsheet)

1. Install dependencies:
```bash
pip3 install flask flask-cors requests
```

2. Configure Smartsheet credentials in `server.py`:
   - Set `SMARTSHEET_TOKEN` (line 17)
   - Set `SMARTSHEET_ID` (line 18)

3. Run the server:
```bash
python3 server.py
```

4. Open http://localhost:8080

### Google Sheets Backend

See `SETUP-INSTRUCTIONS.txt` for detailed setup with Google Apps Script.

## Architecture

- **Frontend**: Vanilla JavaScript with localStorage session management
- **Backend Options**:
  - Flask server proxying to Smartsheet API
  - Google Apps Script web app writing to Google Sheets

## Scoring System

- 7 scored sections contribute to final recommendation
- Score > 30: Strong fit for FlightPath
- Score 20-30: Potential fit
- Score < 20: Not a good fit

## Files

- `index.html` - Main intake form
- `app.js` - Main page controller
- `sections.js` - Session and scoring logic
- `sheet.js` - Backend API integration
- `server.py` - Python/Flask backend
- `google-apps-script.js` - Alternative Google Sheets backend

## Security Note

**Important**: The current `server.py` contains hardcoded credentials for demonstration purposes only. For production use:

1. Move credentials to environment variables
2. Use a `.env` file with python-dotenv
3. Never commit credentials to version control
