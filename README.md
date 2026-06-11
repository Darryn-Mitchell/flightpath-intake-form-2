# FlightPath Intake Form

A multi-page web application for assessing customer fit for FlightPath engagement.

## Overview

The application collects customer information through an intake form, then guides users through 8 assessment sections. Each section opens in a modal overlay within the same page, and all data is stored locally until the assessment is complete. Upon completion, a single batch submission is sent to Smartsheet, and email notifications are sent to regional contacts.

## Features

### User Experience
- **Modal Overlays**: All sections appear as centered modals within the current page (no popup windows)
- **Auto-Progression**: Sections automatically advance upon completion
- **Progress Tracking**: Visual status indicators show completed vs outstanding sections
- **Required Questions**: All questions must be answered - no skipping allowed
- **Confirmation Dialogs**: Prevents accidental data loss when closing sections
- **Centered Popups**: All modals appear centered on the user's screen
- **Hidden Scores**: Individual section scores are hidden from users during assessment

### Data Management
- **Local Storage First**: All responses saved in browser memory during assessment
- **Batch Submission**: Single API call when all sections complete (not per-section)
- **Dual Storage**: Data saved to both local JSON files and Smartsheet
- **Salesforce Integration**: Optional Salesforce opportunity link capture
- **Problem Statement**: Free-text field (5000 char limit) for customer problem/opportunity

### Email Notifications (Feature-Flagged)
- **Regional Routing**: Emails sent to different contacts based on region:
  - EMEA → damitche@redhat.com
  - North America → cvacca@redhat.com
  - LATAM → almachad@redhat.com
  - APAC → dechan@redhat.com
- **HTML Formatted**: Professional emails with Red Hat branding
- **Complete Results**: Includes customer info, scores, recommendation, and Salesforce link
- **Feature Flag**: `ENABLE_EMAIL_NOTIFICATIONS` (currently disabled for testing)

### Assessment Sections
1. Executive Engagement
2. Customer Technology
3. Customer ARR
4. Opportunity Size
5. Delivery & Execution
6. Customer Problem Statement (with free-text input)
7. Customer Strategic Direction
8. Executive Sponsorship

### Scoring & Recommendation
- 7 sections contribute to final score (Opportunity Size is non-scoring)
- **Score > 30**: Strong fit for FlightPath (green)
- **Score 20-30**: Potential fit (yellow)
- **Score < 20**: Not a good fit (red)
- Final recommendation displayed in modal popup with results summary

## Quick Start

### 1. Install Dependencies
```bash
pip3 install flask flask-cors requests
```

### 2. Configure Server
Edit `server.py` and update:
- **Smartsheet credentials** (lines 19-20):
  - `SMARTSHEET_TOKEN`
  - `SMARTSHEET_ID`
- **Email settings** (line 18):
  - `ENABLE_EMAIL_NOTIFICATIONS = False` (set to `True` when ready for production)

### 3. Run the Server
```bash
cd flightpath-form
python3 server.py
```

Server will start on http://localhost:8080

### 4. Open the Application
Navigate to http://localhost:8080 in your browser

**Note**: Use a hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`) if you don't see the latest changes due to browser caching.

## Architecture

### Frontend
- **Vanilla JavaScript** - No frameworks required
- **In-Memory Session Management** - Data stored during assessment, not persisted to localStorage until ready
- **Modal Overlays** - All sections load in iframes within modals
- **BroadcastChannel API** - State synchronization across windows (if needed)
- **PostMessage** - Communication between parent and iframe sections

### Backend
- **Flask Server** - Python web server serving static files and API endpoints
- **Smartsheet Integration** - Final data submission to Smartsheet
- **Email Notifications** - HTML emails sent via SMTP (feature-flagged)
- **Local JSON Storage** - Backup storage in `data/` directory
- **Cache-Control Headers** - Prevents browser caching issues during development

### Data Flow
1. User fills intake form (customer name, segment, region, Salesforce link)
2. Session created in browser memory
3. Each section saves responses locally (no backend calls)
4. When all sections complete:
   - Calculate total score and recommendation
   - Show recommendation modal
   - Submit complete assessment to backend (single API call)
   - Backend saves to local JSON and Smartsheet
   - Backend sends email notification (if enabled)

## Configuration

### Email Notifications
To enable email notifications, edit `server.py`:
```python
ENABLE_EMAIL_NOTIFICATIONS = True  # Line 18
```

Configure SMTP settings (defaults to localhost):
```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
```

### Cache Busting
All script tags include version parameters (`?v=3`) to force browser cache refresh. Increment the version number in all HTML files when making JavaScript changes.

## File Structure

### Core Files
- **`index.html`** - Main page with intake form modal and section modal container
- **`app.js`** - Main controller, form submission, modal management, postMessage listener
- **`sections.js`** - Session management, scoring logic, section navigation, in-memory storage
- **`sheet.js`** - Backend API integration (disabled individual section calls, enabled batch submission)
- **`section-utils.js`** - Utility functions for section pages (getSectionParams for iframe/standalone mode)
- **`server.py`** - Flask backend with Smartsheet API, email notifications, and local JSON storage
- **`styles.css`** - Styling for modals, forms, and recommendations

### Section Pages (Loaded in Modals)
- `executive-engagement.html` + `.js` - C-level relationship questions
- `customer-technology.html` + `.js` - Red Hat technology usage assessment
- `customer-arr.html` + `.js` - Customer ARR range selection
- `opportunity-size.html` + `.js` - Opportunity size input (with format hint)
- `delivery-execution.html` + `.js` - Delivery partner and relationship assessment
- `customer-problem-statement.html` + `.js` - Problem statement with free-text input (5000 chars)
- `customer-strategic-direction.html` + `.js` - Strategic direction questions
- `executive-sponsorship.html` + `.js` - Executive sponsorship assessment

### Documentation
- `README.md` - This file
- `DATA-STORAGE.md` - Information about local JSON storage and CSV export
- `clear-cache.html` - Cache testing page

### Data Directory
- `data/` - Local JSON storage for all submissions (auto-created, in .gitignore)

## Development Notes

### Browser Caching
The application uses aggressive cache-busting to ensure users always see the latest version:
- All script tags include `?v=3` version parameter
- Server sends `Cache-Control: no-store` headers for JS/HTML files
- Hard refresh recommended during development: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Testing
- **Email notifications**: Disabled by default (`ENABLE_EMAIL_NOTIFICATIONS = False`)
- **Data storage**: Currently disabled (localStorage writes commented out)
- **Backend submission**: Disabled (Smartsheet calls commented out in submitCompleteAssessment)

All data storage is temporarily disabled while the form is being finalized. To re-enable:
1. Uncomment localStorage writes in `sections.js` (`setActiveSubmission`)
2. Uncomment backend submission in `sheet.js` (`submitCompleteAssessment`)
3. Set `ENABLE_EMAIL_NOTIFICATIONS = True` in `server.py`

## Security Notes

### Credentials
**Important**: The current `server.py` contains hardcoded credentials for demonstration purposes only.

For production use:
1. Move all credentials to environment variables
2. Use a `.env` file with `python-dotenv`
3. Never commit credentials to version control
4. Add `.env` to `.gitignore`

Example:
```python
import os
from dotenv import load_dotenv

load_dotenv()
SMARTSHEET_TOKEN = os.getenv('SMARTSHEET_TOKEN')
SMARTSHEET_ID = os.getenv('SMARTSHEET_ID')
```

### Email Security
- Configure SMTP authentication for production email sending
- Use app-specific passwords for Gmail/Office 365
- Consider using email service APIs (SendGrid, AWS SES) for better deliverability

## Troubleshooting

### "Form is not connected to Google Sheets" Error
This error indicates browser cache issues. The old version of `sheet.js` is cached. Solutions:
1. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
2. Clear browser cache completely
3. Use incognito/private browsing mode
4. Increment version number in HTML files (`?v=3` → `?v=4`)

### Modal Not Opening
1. Check browser console (F12) for JavaScript errors
2. Verify `inMemorySession` is being created in `sections.js`
3. Ensure all script files are loading with correct version parameter

### Email Not Sending
1. Check `ENABLE_EMAIL_NOTIFICATIONS = True` in `server.py`
2. Verify SMTP server is accessible
3. Check server logs for email errors (non-critical, won't block form submission)

## Future Enhancements

Potential improvements to consider:
- Progress indicator showing "Section X of 8"
- Ability to review and edit previous sections
- Score breakdown in final recommendation
- Export/download results as PDF
- Auto-save progress every 30 seconds
- Mobile responsive optimization
- Keyboard navigation improvements
