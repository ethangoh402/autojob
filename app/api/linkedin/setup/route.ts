import { NextResponse } from "next/server";

// One-time endpoint: creates HiringManagers + CEOs tabs in the existing Google Sheet.
// Hit this once after re-deploying appscript.gs, then never again.
export async function POST() {
  try {
    const appsScriptUrl   = process.env.APPS_SCRIPT_URL!;
    const appsScriptToken = process.env.APPS_SCRIPT_TOKEN!;

    const res = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setupLinkedInSheets",
        token:  appsScriptToken,
      }),
      signal: AbortSignal.timeout(30_000),
      redirect: "follow",
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ success: false, error: text }, { status: 500 });
    }

    const data: { success: boolean; error: string } = await res.json();
    if (!data.success) {
      return NextResponse.json({ success: false, error: data.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "HiringManagers and CEOs tabs created in your Google Sheet.",
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
