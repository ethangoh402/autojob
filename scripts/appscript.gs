/**
 * AutoJob Email Sender — Google Apps Script Web App
 *
 * SETUP (one-time):
 * 1. Go to https://script.google.com → New project → paste this entire file
 * 2. Project Settings (⚙️) → Script Properties → Add property:
 *      Name:  SECRET_TOKEN
 *      Value: (any long random string, e.g. paste a UUID)
 * 3. Deploy → New deployment → Type: Web app
 *      Execute as:     Me (ethan09.goh@gmail.com)
 *      Who has access: Anyone
 * 4. Copy the Web App URL → paste into .env.local as APPS_SCRIPT_URL
 * 5. Copy the same SECRET_TOKEN value → paste into .env.local as APPS_SCRIPT_TOKEN
 *
 * The web app accepts POST requests with JSON body:
 *   { token, to, subject, body, mode }
 *   mode: "draft" (default) | "send"
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Auth check
    var token = PropertiesService.getScriptProperties().getProperty("SECRET_TOKEN");
    if (!token || data.token !== token) {
      return respond(false, "", "Unauthorized");
    }

    var action = data.action || "email";

    // ── Action: log a row to the Outreach sheet ──────────────────────────────
    if (action === "logOutreach") {
      logOutreachRow(data);
      return respond(true, "", "");
    }

    // ── Action: create HiringManagers + CEOs tabs (run once) ─────────────────
    if (action === "setupLinkedInSheets") {
      setupLinkedInSheets();
      return respond(true, "", "");
    }

    // ── Action: log a LinkedIn connect prospect ───────────────────────────────
    if (action === "logLinkedInConnect") {
      logLinkedInConnect(data);
      return respond(true, "", "");
    }

    // ── Action: get pending prospects (for daily connect automation) ──────────
    if (action === "getPendingProspects") {
      var prospects = getPendingProspects(data.limit || 15);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, prospects: prospects }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Action: update connect status for a prospect ──────────────────────────
    if (action === "updateConnectStatus") {
      updateConnectStatus(data.linkedinUrl, data.status, data.tabName);
      return respond(true, "", "");
    }

    // ── Action: log a tailored job application package ────────────────────────
    if (action === "logApplication") {
      logApplication(data);
      return respond(true, "", "");
    }

    // ── Action: update apply status after the Chrome extension fills/submits ──
    if (action === "updateApplicationStatus") {
      updateApplicationStatus(data);
      return respond(true, "", "");
    }

    // ── Action: send / draft an email ────────────────────────────────────────
    var to      = data.to      || "";
    var subject = data.subject || "";
    var body    = data.body    || "";
    var mode    = data.mode    || "draft";

    if (!to || !subject || !body) {
      return respond(false, "", "Missing required fields: to, subject, body");
    }

    var draftId = "";

    if (mode === "send") {
      GmailApp.sendEmail(to, subject, body);
      draftId = "sent";
    } else {
      var draft = GmailApp.createDraft(to, subject, body);
      draftId = draft.getId();
    }

    return respond(true, draftId, "");
  } catch (err) {
    return respond(false, "", err.toString());
  }
}

function respond(success, draftId, error) {
  var result = JSON.stringify({ success: success, draftId: draftId, error: error });
  return ContentService
    .createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Sheet logging ─────────────────────────────────────────────────────────────

// Called from doPost when a "logOutreach" action is sent
function logOutreachRow(data) {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!sheetId) throw new Error("SHEET_ID not set in Script Properties");

  var ss   = SpreadsheetApp.openById(sheetId);
  var tab  = ss.getSheetByName("Outreach");
  if (!tab) throw new Error("Sheet tab 'Outreach' not found — run createSheet() first");

  tab.appendRow([
    data.date             || new Date().toISOString().slice(0, 10),
    data.company          || "",
    data.jobTitle         || "",
    data.hiringManager    || "",
    data.hmTitle          || "",
    data.hmEmail          || "",
    data.linkedinUrl      || "",
    data.emailSubject     || "",
    data.gmailDraftId     || "",
    data.status           || "",
    data.notes            || "",
  ]);
}

/**
 * RUN THIS ONCE from the Apps Script editor to create the tracking sheet.
 * After it runs, check the Execution Log for the Sheet ID,
 * then paste that ID into .env.local as GOOGLE_SHEETS_ID.
 */
function createSheet() {
  var ss  = SpreadsheetApp.create("AutoJob Outreach Tracker");
  var tab = ss.getActiveSheet();
  tab.setName("Outreach");

  var headers = [
    "Date", "Company", "Job Title", "Hiring Manager", "HM Title",
    "HM Email", "LinkedIn URL", "Email Subject", "Gmail Draft ID", "Status", "Notes"
  ];

  // Header row — bold + frozen
  tab.getRange(1, 1, 1, headers.length).setValues([headers])
     .setFontWeight("bold")
     .setBackground("#1e293b")
     .setFontColor("#f1f5f9");
  tab.setFrozenRows(1);

  // Column widths
  var widths = [90, 130, 180, 160, 160, 200, 220, 260, 160, 120, 200];
  widths.forEach(function(w, i) { tab.setColumnWidth(i + 1, w); });

  // Save the Sheet ID to Script Properties so logOutreachRow can find it
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", ss.getId());

  Logger.log("✓ Sheet created!");
  Logger.log("Sheet ID: " + ss.getId());
  Logger.log("URL: " + ss.getUrl());
  Logger.log("");
  Logger.log("→ Paste this into .env.local:  GOOGLE_SHEETS_ID=" + ss.getId());
}

// ── LinkedIn connect tracking ─────────────────────────────────────────────────

function setupLinkedInSheets() {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!sheetId) throw new Error("SHEET_ID not set in Script Properties");

  var ss = SpreadsheetApp.openById(sheetId);
  var headers = [
    "Date Added", "First Name", "Last Name", "Title", "Company",
    "Location", "LinkedIn URL", "Company Website", "Email", "Email Source",
    "Connect Status", "Date Accepted", "Email Sent", "Reply", "Notes"
  ];
  var widths = [100, 110, 110, 180, 150, 100, 230, 180, 200, 120, 120, 110, 90, 90, 200];

  ["HiringManagers", "CEOs"].forEach(function(name) {
    if (ss.getSheetByName(name)) return; // already exists
    var tab = ss.insertSheet(name);
    tab.getRange(1, 1, 1, headers.length).setValues([headers])
       .setFontWeight("bold")
       .setBackground("#1e293b")
       .setFontColor("#f1f5f9");
    tab.setFrozenRows(1);
    widths.forEach(function(w, i) { tab.setColumnWidth(i + 1, w); });
  });
}

// Run once from the editor to insert "Company Website" col into existing sheets
function insertCompanyWebsiteColumn() {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  var ss = SpreadsheetApp.openById(sheetId);
  ["HiringManagers", "CEOs"].forEach(function(name) {
    var tab = ss.getSheetByName(name);
    if (!tab) return;
    // Insert blank column at position 8 (after LinkedIn URL = col 7)
    tab.insertColumnAfter(7);
    tab.getRange(1, 8).setValue("Company Website")
       .setFontWeight("bold")
       .setBackground("#1e293b")
       .setFontColor("#f1f5f9");
    tab.setColumnWidth(8, 180);
  });
  Logger.log("Company Website column inserted in HiringManagers and CEOs tabs.");
}

function logLinkedInConnect(data) {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!sheetId) throw new Error("SHEET_ID not set in Script Properties");

  var ss      = SpreadsheetApp.openById(sheetId);
  var tabName = data.contactType === "ceo" ? "CEOs" : "HiringManagers";
  var tab     = ss.getSheetByName(tabName);
  if (!tab) throw new Error("Tab '" + tabName + "' not found — run setupLinkedInSheets first");

  tab.appendRow([
    data.dateAdded       || new Date().toISOString().slice(0, 10),
    data.firstName       || "",
    data.lastName        || "",
    data.title           || "",
    data.company         || "",
    data.location        || "",
    data.linkedinUrl     || "",
    data.companyWebsite  || "",
    data.email           || "",
    data.emailSource     || "Not found",
    data.connectStatus   || "Pending",
    data.dateAccepted    || "",
    data.emailSent       || "No",
    data.reply           || "",
    data.notes           || "",
  ]);
}

// ── Job application tracking (JD → tailored resume/cover letter → auto-apply) ──

function getOrCreateApplicationsTab(ss) {
  var tab = ss.getSheetByName("Applications");
  if (tab) return tab;

  tab = ss.insertSheet("Applications");
  var headers = [
    "Date Added", "Company", "Job Title", "Location", "Job URL", "Apply URL",
    "Stage", "Resume Generated", "Cover Letter Generated", "Apply Status", "Applied At", "Notes"
  ];
  tab.getRange(1, 1, 1, headers.length).setValues([headers])
     .setFontWeight("bold")
     .setBackground("#1e293b")
     .setFontColor("#f1f5f9");
  tab.setFrozenRows(1);
  var widths = [100, 160, 200, 120, 240, 240, 110, 120, 150, 110, 140, 200];
  widths.forEach(function(w, i) { tab.setColumnWidth(i + 1, w); });
  return tab;
}

// Called when the app generates a tailored resume + cover letter for a job posting
function logApplication(data) {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!sheetId) throw new Error("SHEET_ID not set in Script Properties");

  var ss  = SpreadsheetApp.openById(sheetId);
  var tab = getOrCreateApplicationsTab(ss);

  tab.appendRow([
    data.dateAdded   || new Date().toISOString().slice(0, 10),
    data.company     || "",
    data.jobTitle    || "",
    data.location    || "",
    data.jobUrl      || "",
    data.applyUrl    || "",
    data.stage       || "found",
    data.resumeGenerated      ? "Yes" : "No",
    data.coverLetterGenerated ? "Yes" : "No",
    data.applyStatus || "Pending",
    data.appliedAt   || "",
    data.notes       || "",
  ]);
}

// Called by the Chrome extension after it fills/submits an application form
function updateApplicationStatus(data) {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!sheetId) throw new Error("SHEET_ID not set in Script Properties");

  var ss  = SpreadsheetApp.openById(sheetId);
  var tab = getOrCreateApplicationsTab(ss);
  var rows = tab.getDataRange().getValues();

  var matchUrl = data.applyUrl || data.jobUrl || "";
  for (var i = rows.length - 1; i >= 1; i--) {
    if (rows[i][4] === matchUrl || rows[i][5] === matchUrl) {
      tab.getRange(i + 1, 10).setValue(data.status || "Submitted");   // Apply Status
      tab.getRange(i + 1, 11).setValue(data.appliedAt || new Date().toISOString()); // Applied At
      if (data.status === "Submitted") tab.getRange(i + 1, 7).setValue("outreach_sent"); // Stage
      if (data.notes) tab.getRange(i + 1, 12).setValue(data.notes);
      return;
    }
  }

  // No matching row found — log it fresh so nothing gets lost
  logApplication({
    company: data.company, jobTitle: data.jobTitle, jobUrl: data.jobUrl,
    applyUrl: data.applyUrl, applyStatus: data.status, appliedAt: data.appliedAt || new Date().toISOString(),
    notes: data.notes,
  });
}

// ── Daily connect automation ──────────────────────────────────────────────────

function getPendingProspects(limit) {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  var ss = SpreadsheetApp.openById(sheetId);
  var results = [];
  var tabs = ["HiringManagers", "CEOs"];

  tabs.forEach(function(tabName) {
    var tab = ss.getSheetByName(tabName);
    if (!tab) return;
    var data = tab.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (results.length >= limit) break;
      var row = data[i];
      var connectStatus = row[10]; // col K
      var linkedinUrl   = row[6];  // col G
      if (connectStatus === "Pending" && linkedinUrl && !linkedinUrl.includes("/company/")) {
        results.push({
          tabName:        tabName,
          rowIndex:       i + 1, // 1-based sheet row
          firstName:      row[1],
          lastName:       row[2],
          title:          row[3],
          company:        row[4],
          location:       row[5],
          linkedinUrl:    linkedinUrl,
          companyWebsite: row[7],
          connectStatus:  connectStatus,
        });
      }
    }
  });

  return results;
}

function updateConnectStatus(linkedinUrl, status, tabName) {
  var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  var ss = SpreadsheetApp.openById(sheetId);
  var tabs = tabName ? [tabName] : ["HiringManagers", "CEOs"];

  tabs.forEach(function(name) {
    var tab = ss.getSheetByName(name);
    if (!tab) return;
    var data = tab.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][6] === linkedinUrl) {
        tab.getRange(i + 1, 11).setValue(status); // col K = Connect Status
        if (status === "Sent") {
          tab.getRange(i + 1, 1).setValue(new Date().toISOString().slice(0, 10)); // update Date Added
        }
        return;
      }
    }
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

// Test this function manually from the Apps Script editor to verify it works
function testDraft() {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty("SECRET_TOKEN");
  var fake = {
    postData: {
      contents: JSON.stringify({
        token:   token,
        to:      "ethan09.goh@gmail.com",
        subject: "AutoJob test draft",
        body:    "This is a test draft from AutoJob.",
        mode:    "draft"
      })
    }
  };
  var result = doPost(fake);
  Logger.log(result.getContent());
}
