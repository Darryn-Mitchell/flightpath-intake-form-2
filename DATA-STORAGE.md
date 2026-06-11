# Local Data Storage

The FlightPath Intake Form stores all submissions locally in JSON files and integrates with Smartsheet for final data storage.

## How It Works

### Automatic Storage
- Every form submission is **automatically saved** to `data/` directory
- Data is organized by submission type (intake, executiveEngagement, etc.)
- Each file contains an array of all submissions for that type
- Files are created automatically as submissions come in

### Data Files

All data is stored in the `data/` directory:
- `data/salesforceName.json` - Main intake form submissions
- `data/executiveEngagement.json` - Executive engagement scores
- `data/customerTechnology.json` - Customer technology scores
- `data/customerArr.json` - Customer ARR scores
- `data/opportunitySize.json` - Opportunity size data
- `data/deliveryExecution.json` - Delivery & execution scores
- `data/customerProblemStatement.json` - Problem statement scores
- `data/customerStrategicDirection.json` - Strategic direction scores
- `data/executiveSponsorship.json` - Executive sponsorship scores
- `data/finalTally.json` - Final scores and recommendations

### Viewing Data

**Option 1: API Endpoints**

While the server is running, access data via:
- `http://localhost:8080/api/data` - List all data files
- `http://localhost:8080/api/data/salesforceName` - View specific data type
- `http://localhost:8080/api/data/finalTally` - View all final scores

**Option 2: Direct File Access**

Simply open the JSON files in the `data/` directory with any text editor.

**Option 3: Export to CSV**

Run the export script to convert JSON to CSV:
```bash
python3 export_data.py
```

This creates timestamped CSV files in the `exports/` directory that you can:
- Open in Excel or other spreadsheet applications
- Import into other systems
- Archive for records

## Data Persistence

- ✅ Data is saved **before** attempting to send to Smartsheet
- ✅ If Smartsheet fails, data is still safely stored locally
- ✅ All submissions are preserved even if the server restarts
- ✅ Data files are excluded from git (won't be committed)

## Data Export

To export your data for external use:

1. All your data is in the `data/` directory
2. Run `python3 export_data.py` to create CSV files
3. Import the CSV files into any spreadsheet or database system
4. Your historical data is preserved!

## Backup Recommendations

Since data is stored locally, consider:
- Regularly copying the `data/` directory to a safe location
- Using the export script to create CSV backups
- Setting up automatic backups if collecting important data

## Data Format

Each entry includes:
- `timestamp` - ISO 8601 timestamp when saved
- All original submission fields (submissionId, scores, etc.)

Example:
```json
[
  {
    "timestamp": "2026-06-09T18:45:00.123456",
    "submissionId": "abc-123",
    "salesforceName": "Acme Corp",
    "segment": "Enterprise",
    "region": "North America"
  }
]
```
