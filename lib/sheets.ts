// Google Sheets logging via Apps Script — no separate OAuth credentials needed
// Two flows: outreach email tracking (Outreach tab) + LinkedIn connect tracking (HiringManagers / CEOs tabs)

export interface LinkedInConnectRow {
  contactType: 'hm' | 'ceo';
  dateAdded: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  location: string;
  linkedinUrl: string;
  companyWebsite: string;
  email: string;
  emailSource: string;   // "LinkedIn" | "Google" | "Hunter" | "Guessed" | "Not found"
  connectStatus: string; // "Pending" | "Accepted" | "Ignored"
  dateAccepted: string;
  emailSent: string;     // "Yes" | "No"
  reply: string;         // "Yes" | "No" | "Bounce"
  notes: string;
}

export interface OutreachRow {
  date: string;
  company: string;
  jobTitle: string;
  hiringManagerName: string;
  hiringManagerTitle: string;
  hiringManagerEmail: string;
  linkedinUrl: string;
  emailSubject: string;
  gmailDraftId: string;
  status: string;
  notes: string;
}

export async function appendOutreachRow(params: {
  row: OutreachRow;
  appsScriptUrl: string;
  appsScriptToken: string;
}): Promise<void> {
  const res = await fetch(params.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "logOutreach",
      token: params.appsScriptToken,
      date:          params.row.date,
      company:       params.row.company,
      jobTitle:      params.row.jobTitle,
      hiringManager: params.row.hiringManagerName,
      hmTitle:       params.row.hiringManagerTitle,
      hmEmail:       params.row.hiringManagerEmail,
      linkedinUrl:   params.row.linkedinUrl,
      emailSubject:  params.row.emailSubject,
      gmailDraftId:  params.row.gmailDraftId,
      status:        params.row.status,
      notes:         params.row.notes,
    }),
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apps Script sheet log failed (${res.status}): ${text}`);
  }

  const data: { success: boolean; error: string } = await res.json();
  if (!data.success) {
    throw new Error(`Apps Script sheet error: ${data.error}`);
  }
}

export interface ApplicationRow {
  dateAdded: string;
  company: string;
  jobTitle: string;
  location: string;
  jobUrl: string;
  applyUrl: string;
  stage: string;
  resumeGenerated: boolean;
  coverLetterGenerated: boolean;
  applyStatus: string; // "Pending" | "Submitted" | "Failed"
  appliedAt: string;
  notes: string;
}

export async function appendApplicationRow(params: {
  row: ApplicationRow;
  appsScriptUrl: string;
  appsScriptToken: string;
}): Promise<void> {
  const res = await fetch(params.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action:                "logApplication",
      token:                 params.appsScriptToken,
      dateAdded:             params.row.dateAdded,
      company:               params.row.company,
      jobTitle:              params.row.jobTitle,
      location:              params.row.location,
      jobUrl:                params.row.jobUrl,
      applyUrl:              params.row.applyUrl,
      stage:                 params.row.stage,
      resumeGenerated:       params.row.resumeGenerated,
      coverLetterGenerated:  params.row.coverLetterGenerated,
      applyStatus:           params.row.applyStatus,
      appliedAt:             params.row.appliedAt,
      notes:                 params.row.notes,
    }),
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apps Script application log failed (${res.status}): ${text}`);
  }

  const data: { success: boolean; error: string } = await res.json();
  if (!data.success) {
    throw new Error(`Apps Script application error: ${data.error}`);
  }
}

export async function updateApplicationStatus(params: {
  jobUrl?: string;
  applyUrl?: string;
  company?: string;
  jobTitle?: string;
  status: "Submitted" | "Failed";
  appliedAt?: string;
  notes?: string;
  appsScriptUrl: string;
  appsScriptToken: string;
}): Promise<void> {
  const res = await fetch(params.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action:    "updateApplicationStatus",
      token:     params.appsScriptToken,
      jobUrl:    params.jobUrl ?? "",
      applyUrl:  params.applyUrl ?? "",
      company:   params.company ?? "",
      jobTitle:  params.jobTitle ?? "",
      status:    params.status,
      appliedAt: params.appliedAt ?? new Date().toISOString(),
      notes:     params.notes ?? "",
    }),
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apps Script status update failed (${res.status}): ${text}`);
  }

  const data: { success: boolean; error: string } = await res.json();
  if (!data.success) {
    throw new Error(`Apps Script status update error: ${data.error}`);
  }
}

export async function appendLinkedInConnect(params: {
  row: LinkedInConnectRow;
  appsScriptUrl: string;
  appsScriptToken: string;
}): Promise<void> {
  const res = await fetch(params.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action:         "logLinkedInConnect",
      token:          params.appsScriptToken,
      contactType:    params.row.contactType,
      dateAdded:      params.row.dateAdded,
      firstName:      params.row.firstName,
      lastName:       params.row.lastName,
      title:          params.row.title,
      company:        params.row.company,
      location:       params.row.location,
      linkedinUrl:    params.row.linkedinUrl,
      companyWebsite: params.row.companyWebsite,
      email:          params.row.email,
      emailSource:   params.row.emailSource,
      connectStatus: params.row.connectStatus,
      dateAccepted:  params.row.dateAccepted,
      emailSent:     params.row.emailSent,
      reply:         params.row.reply,
      notes:         params.row.notes,
    }),
    signal: AbortSignal.timeout(30_000),
    redirect: "follow",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apps Script LinkedIn log failed (${res.status}): ${text}`);
  }

  const data: { success: boolean; error: string } = await res.json();
  if (!data.success) {
    throw new Error(`Apps Script LinkedIn error: ${data.error}`);
  }
}
