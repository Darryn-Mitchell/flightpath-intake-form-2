// FlightPath Intake - Google Apps Script
// Copy this entire file and paste it into your Google Apps Script editor

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet(payload.type);

    if (!sheet) {
      return jsonResponse({ success: false, error: "Invalid sheet type" });
    }

    appendRowToSheet(sheet, payload);
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  const payload = e.parameter;

  try {
    const sheet = getOrCreateSheet(payload.type);

    if (!sheet) {
      return jsonResponse({ success: false, error: "Invalid sheet type" });
    }

    appendRowToSheet(sheet, payload);
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const sheetNames = {
    'salesforceName': 'Intake Responses',
    'executiveEngagement': 'Executive Engagement',
    'customerTechnology': 'Customer Technology',
    'customerArr': 'Customer ARR',
    'opportunitySize': 'Opportunity Size',
    'deliveryExecution': 'Delivery & Execution',
    'customerProblemStatement': 'Customer Problem Statement',
    'customerStrategicDirection': 'Customer Strategic Direction',
    'executiveSponsorship': 'Executive Sponsorship',
    'finalTally': 'Final Scores'
  };

  const sheetName = sheetNames[type] || 'Intake Responses';
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, type);
  }

  return sheet;
}

function initializeSheet(sheet, type) {
  const headers = {
    'Intake Responses': ['Timestamp', 'Submission ID', 'Salesforce Name', 'Segment', 'Region'],
    'Executive Engagement': ['Timestamp', 'Submission ID', 'Selected Value', 'Score'],
    'Customer Technology': ['Timestamp', 'Submission ID', 'Selected Value', 'Score'],
    'Customer ARR': ['Timestamp', 'Submission ID', 'Selected Value', 'Score'],
    'Opportunity Size': ['Timestamp', 'Submission ID', 'Value'],
    'Delivery & Execution': ['Timestamp', 'Submission ID', 'Score'],
    'Customer Problem Statement': ['Timestamp', 'Submission ID', 'Score'],
    'Customer Strategic Direction': ['Timestamp', 'Submission ID', 'Score'],
    'Executive Sponsorship': ['Timestamp', 'Submission ID', 'Score'],
    'Final Scores': ['Timestamp', 'Submission ID', 'Total Score', 'Recommendation']
  };

  const header = headers[sheet.getName()] || ['Timestamp', 'Submission ID', 'Data'];
  sheet.appendRow(header);
  sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
}

function appendRowToSheet(sheet, payload) {
  const timestamp = new Date();
  const sheetName = sheet.getName();

  let row;

  switch(sheetName) {
    case 'Intake Responses':
      row = [
        timestamp,
        payload.submissionId || '',
        payload.salesforceName || '',
        payload.segment || '',
        payload.region || ''
      ];
      break;

    case 'Final Scores':
      row = [
        timestamp,
        payload.submissionId || '',
        payload.totalScore || 0,
        payload.recommendation || ''
      ];
      break;

    case 'Opportunity Size':
      row = [
        timestamp,
        payload.submissionId || '',
        payload.value || ''
      ];
      break;

    default:
      row = [
        timestamp,
        payload.submissionId || '',
        payload.selectedValue || '',
        payload.score || 0
      ];
  }

  sheet.appendRow(row);
}
