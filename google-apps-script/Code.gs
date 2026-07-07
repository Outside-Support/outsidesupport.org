var CONTACT_CAPTURE_CONFIG = {
  sheetName: "Submissions",
  alertEmail: "team@outsidesupport.org",
  alertSubject: "New Outside Support email signup"
};

function doPost(e) {
  var payload = e && e.parameter ? e.parameter : {};
  var email = String(payload.email || "").trim();

  if (!email || email.indexOf("@") === -1) {
    return jsonResponse({ ok: false, error: "A valid email is required." });
  }

  var sheet = getSubmissionsSheet_();
  var row = [
    new Date(),
    email,
    String(payload.sourcePage || ""),
    String(payload.pageUrl || ""),
    String(payload.submittedAt || "")
  ];

  sheet.appendRow(row);

  MailApp.sendEmail({
    to: CONTACT_CAPTURE_CONFIG.alertEmail,
    subject: CONTACT_CAPTURE_CONFIG.alertSubject,
    body: [
      "A new email was submitted on outsidesupport.org.",
      "",
      "Email: " + email,
      "Source page: " + row[2],
      "Page URL: " + row[3],
      "Submitted at: " + row[4]
    ].join("\n")
  });

  return jsonResponse({ ok: true });
}

function doGet() {
  return jsonResponse({ ok: true, service: "Outside Support contact capture" });
}

function setupSubmissionsSheet() {
  var sheet = getSubmissionsSheet_();
  if (sheet.getLastRow() === 0) {
    writeHeader_(sheet);
  }
}

function getSubmissionsSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONTACT_CAPTURE_CONFIG.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONTACT_CAPTURE_CONFIG.sheetName);
  }

  if (sheet.getLastRow() === 0) {
    writeHeader_(sheet);
  }

  return sheet;
}

function writeHeader_(sheet) {
  var headers = [
    "Received At",
    "Email",
    "Source Page",
    "Page URL",
    "Browser Submitted At"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#2E7D78")
    .setFontColor("#FFFFFF");
  sheet.autoResizeColumns(1, headers.length);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
