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
