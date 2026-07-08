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
    String(payload.submittedAt || ""),
    "",
    ""
  ];

  sheet.appendRow(row);
  var rowNumber = sheet.getLastRow();

  try {
    sendAlertEmail_(row);
    sheet.getRange(rowNumber, 6).setValue(new Date());
  } catch (err) {
    sheet.getRange(rowNumber, 7).setValue(String(err && err.message ? err.message : err));
    return jsonResponse({ ok: true, alertSent: false });
  }

  return jsonResponse({ ok: true, alertSent: true });
}

function doGet() {
  return jsonResponse({ ok: true, service: "Outside Support contact capture" });
}

function setupSubmissionsSheet() {
  var sheet = getSubmissionsSheet_();
  writeHeader_(sheet);
}

function testAlertEmail() {
  sendAlertEmail_([
    new Date(),
    "test@example.com",
    "Manual Apps Script test",
    "https://outsidesupport.org/",
    new Date().toISOString()
  ]);
}

function testAlertEmailToJim() {
  MailApp.sendEmail({
    to: "jim@outsidesupport.org",
    subject: "Outside Support contact capture test",
    name: "Outside Support Website",
    body: [
      "This is a manual Apps Script email test.",
      "",
      "If you receive this, Apps Script can send email from this project.",
      "If team@outsidesupport.org does not receive alerts, check that mailbox or Google Group."
    ].join("\n")
  });
}

function getSubmissionsSheet_() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(CONTACT_CAPTURE_CONFIG.sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONTACT_CAPTURE_CONFIG.sheetName);
  }

  writeHeader_(sheet);

  return sheet;
}

function writeHeader_(sheet) {
  var headers = [
    "Received At",
    "Email",
    "Source Page",
    "Page URL",
    "Browser Submitted At",
    "Alert Sent At",
    "Alert Error"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#2E7D78")
    .setFontColor("#FFFFFF");
  sheet.autoResizeColumns(1, headers.length);
}

function sendAlertEmail_(row) {
  MailApp.sendEmail({
    to: CONTACT_CAPTURE_CONFIG.alertEmail,
    subject: CONTACT_CAPTURE_CONFIG.alertSubject,
    name: "Outside Support Website",
    body: [
      "A new email was submitted on outsidesupport.org.",
      "",
      "Email: " + row[1],
      "Source page: " + row[2],
      "Page URL: " + row[3],
      "Submitted at: " + row[4],
      "",
      "Remaining daily email quota after this send: " + MailApp.getRemainingDailyQuota()
    ].join("\n")
  });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
