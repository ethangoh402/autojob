// Gmail sender via Google Apps Script web app — no OAuth credentials needed

export interface GmailResult {
  draftId: string; // "sent" when mode is "send", Gmail draft ID otherwise
}

export async function sendViaAppsScript(params: {
  to: string;
  subject: string;
  body: string;
  appsScriptUrl: string;
  appsScriptToken: string;
  mode?: "draft" | "send";
}): Promise<GmailResult> {
  const res = await fetch(params.appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: params.appsScriptToken,
      to: params.to,
      subject: params.subject,
      body: params.body,
      mode: params.mode ?? "draft",
    }),
    signal: AbortSignal.timeout(30_000),
    redirect: "follow", // Apps Script web apps use a redirect on POST
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apps Script request failed (${res.status}): ${text}`);
  }

  const data: { success: boolean; draftId: string; error: string } = await res.json();

  if (!data.success) {
    throw new Error(`Apps Script error: ${data.error}`);
  }

  return { draftId: data.draftId };
}
