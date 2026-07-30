/**
 * DIGITs — DIGEO welcome email with accreditation certificate.
 *
 * Actions (staff only, except as noted):
 *   preview  -> returns { subject, html } without sending. Used by the Command
 *               Center preview and to generate the committed sample.
 *   send     -> renders and sends via Resend, then records the send in
 *               audit_log. Accepts an optional `deliverTo` so staff can route a
 *               copy elsewhere (test sends, or a provider that will not yet
 *               deliver to the holder). The override is always audited.
 *
 * Environment:
 *   RESEND_API_KEY   required to send. Without it, `send` returns 503 and an
 *                    explicit instruction rather than silently pretending.
 *   EMAIL_FROM       optional sender, e.g. "DIGITs Election Watch <info@domain>".
 *                    DIGEO_MAIL_FROM is accepted as an alias. Defaults to
 *                    Resend's onboarding sender, which can only deliver to the
 *                    Resend account owner's own address.
 *   PUBLIC_SITE_URL  optional, used for links. Defaults to the production domain.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const SITE = (Deno.env.get("PUBLIC_SITE_URL") ?? "https://digits-election-watch.org").replace(
  /\/$/,
  "",
);

/** What an observer must physically carry on election day. */
const KIT_CARRY = [
  ["Accreditation certificate", "Printed, and your accreditation number saved on your phone."],
  ["Government photo ID", "Plus your PVC if you are voting at the unit you observe."],
  ["Charged smartphone", "Video capable. Start the day at 100%."],
  ["Power bank, 10,000mAh or more", "Streaming is the heaviest thing your phone will do all day."],
  ["Data bundle, 2GB minimum", "Live broadcast and evidence upload both need headroom."],
  ["Notebook and two pens", "Times, names and figures. Two pens because one will fail."],
  ["Printed observation checklist", "Your fallback if the phone dies or the network drops."],
  ["Torch or head-lamp", "Collation regularly runs past dark."],
  ["Water and your own food", "You may not accept food or drink from any party or agent."],
  ["Umbrella or light raincoat", "You will be outdoors for most of the day."],
  ["Basic first-aid items", "Plasters, any personal medication."],
  ["Emergency contact card", "Your supervisor and the Command Center, written down on paper."],
];

/** What must stay at home — every item here can end an accreditation. */
const KIT_LEAVE = [
  "Anything in party colours, logos or slogans — including caps and wristbands",
  "Campaign material of any kind",
  "Alcohol",
  "Any weapon, including anything that could be described as one",
  "Cash from a party, agent or candidate — declining is part of the job",
];

function renderEmail(input: {
  fullName: string;
  certificateNumber: string;
  state: string;
  lga: string | null;
  issuedAt: string;
  expiresAt: string | null;
  qrHash: string;
  averageScore: number | null;
  hasNin: boolean;
}) {
  const issued = new Date(input.issuedAt).toLocaleDateString("en-NG", { dateStyle: "long" });
  const expires = input.expiresAt
    ? new Date(input.expiresAt).toLocaleDateString("en-NG", { dateStyle: "long" })
    : "—";

  const kitRows = KIT_CARRY.map(
    ([item, why]) => `
      <tr>
        <td style="padding:7px 12px 7px 0;vertical-align:top;border-bottom:1px solid #e6eaef;">
          <span style="color:#0f7a45;font-weight:700;">&#10003;</span>
        </td>
        <td style="padding:7px 0;border-bottom:1px solid #e6eaef;">
          <div style="font-weight:600;color:#12243d;font-size:14px;">${item}</div>
          <div style="color:#5b6b80;font-size:12px;margin-top:2px;">${why}</div>
        </td>
      </tr>`,
  ).join("");

  const leaveItems = KIT_LEAVE.map(
    (item) =>
      `<li style="margin-bottom:6px;color:#7a2230;font-size:13px;line-height:1.5;">${item}</li>`,
  ).join("");

  const link = (href: string, label: string, note: string) => `
    <tr>
      <td style="padding:9px 0;border-bottom:1px solid #e6eaef;">
        <a href="${href}" style="color:#0f7a45;font-weight:600;font-size:14px;text-decoration:none;">${label} &rarr;</a>
        <div style="color:#5b6b80;font-size:12px;margin-top:2px;">${note}</div>
      </td>
    </tr>`;

  const ninWarning = input.hasNin
    ? ""
    : `
    <tr><td style="padding:0 28px 22px;">
      <div style="background:#fff8e6;border:1px solid #f0d089;border-radius:10px;padding:14px 16px;">
        <div style="font-weight:700;color:#7a5a12;font-size:14px;">One thing still to do</div>
        <div style="color:#7a5a12;font-size:13px;line-height:1.55;margin-top:4px;">
          Your National Identity Number is not on your profile yet. i-Witness reporting stays
          locked until it is, because evidence must carry a verified identity.
          <a href="${SITE}/account" style="color:#0f7a45;font-weight:600;">Add your NIN</a> — it
          takes a moment and you never type it into a report.
        </div>
      </div>
    </td></tr>`;

  const subject = `You are an accredited DIGEO observer — ${input.certificateNumber}`;

  const html = `<!doctype html>
<html lang="en-NG">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#eef1f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">Your DIGEO accreditation is active. Certificate ${input.certificateNumber}. Here is your election-day kit.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f5;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(18,36,61,.08);">

  <!-- Header -->
  <tr><td style="background:#0a1f3a;padding:26px 28px;">
    <div style="color:#ffffff;font-size:19px;font-weight:800;letter-spacing:-.3px;">
      DIGITs <span style="color:#e9b949;">Election Watch</span>
    </div>
    <div style="color:#93a6bd;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;margin-top:3px;">
      Nigeria &middot; Citizen Observation
    </div>
  </td></tr>
  <tr><td style="height:4px;background:linear-gradient(90deg,#0f7a45 0%,#0f7a45 33%,#ffffff 33%,#ffffff 66%,#0f7a45 66%);"></td></tr>

  <!-- Intro -->
  <tr><td style="padding:28px 28px 6px;">
    <h1 style="margin:0;font-size:22px;color:#12243d;font-weight:800;">You are accredited, ${input.fullName}.</h1>
    <p style="margin:10px 0 0;color:#41546b;font-size:14px;line-height:1.65;">
      Your DIGEO accreditation is active. That makes you one of the citizen observers whose
      record of election day the public actually sees — so please read the kit list below
      before you deploy, and bring all of it.
    </p>
  </td></tr>

  <!-- Certificate -->
  <tr><td style="padding:20px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #e9b949;border-radius:12px;background:#fbfdfa;">
      <tr><td style="padding:18px 20px;">
        <div style="font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:#8a7333;font-weight:700;">
          Certificate of accreditation
        </div>
        <div style="font-size:20px;font-weight:800;color:#0f7a45;margin-top:6px;letter-spacing:1px;">
          ${input.certificateNumber}
        </div>
        <table role="presentation" width="100%" style="margin-top:14px;font-size:13px;color:#41546b;">
          <tr>
            <td style="padding:3px 0;width:42%;color:#7c8a9c;">Holder</td>
            <td style="padding:3px 0;font-weight:600;color:#12243d;">${input.fullName}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#7c8a9c;">Accredited for</td>
            <td style="padding:3px 0;font-weight:600;color:#12243d;">${input.lga ? `${input.lga} LGA, ` : ""}${input.state}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#7c8a9c;">Issued</td>
            <td style="padding:3px 0;font-weight:600;color:#12243d;">${issued}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#7c8a9c;">Valid until</td>
            <td style="padding:3px 0;font-weight:600;color:#12243d;">${expires}</td>
          </tr>
          ${
            input.averageScore !== null
              ? `<tr>
            <td style="padding:3px 0;color:#7c8a9c;">Assessment average</td>
            <td style="padding:3px 0;font-weight:600;color:#12243d;">${input.averageScore}%</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:3px 0;color:#7c8a9c;">Verification hash</td>
            <td style="padding:3px 0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#41546b;">${input.qrHash.slice(0, 24)}</td>
          </tr>
        </table>
        <a href="${SITE}/control-center/training" style="display:inline-block;margin-top:16px;background:#0f7a45;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;">
          View &amp; print your certificate
        </a>
      </td></tr>
    </table>
  </td></tr>

  ${ninWarning}

  <!-- Kit -->
  <tr><td style="padding:26px 28px 0;">
    <h2 style="margin:0 0 4px;font-size:16px;color:#12243d;font-weight:800;">Your election-day kit</h2>
    <p style="margin:0 0 12px;color:#5b6b80;font-size:13px;">Bring every item. Assume nothing will be provided at the polling unit.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kitRows}</table>
  </td></tr>

  <!-- Leave behind -->
  <tr><td style="padding:22px 28px 0;">
    <div style="background:#fdf2f4;border:1px solid #f2c4cd;border-radius:10px;padding:14px 16px;">
      <div style="font-weight:800;color:#7a2230;font-size:14px;margin-bottom:8px;">Leave at home</div>
      <ul style="margin:0;padding-left:18px;">${leaveItems}</ul>
    </div>
  </td></tr>

  <!-- Links -->
  <tr><td style="padding:26px 28px 0;">
    <h2 style="margin:0 0 4px;font-size:16px;color:#12243d;font-weight:800;">Everything you need on the platform</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${link(`${SITE}/control-center/training`, "DIGEO academy & your certificate", "All six modules, your assessment scores, and the printable certificate.")}
      ${link(`${SITE}/control-center/field`, "Field forms", "Phase-by-phase observation checklist and the incident report form.")}
      ${link(`${SITE}/control-center/live`, "Go live from your polling unit", "Broadcast into the Command Center. An operator decides what reaches the public grid.")}
      ${link(`${SITE}/i-witness`, "File an i-Witness report", "Real-time capture, two minutes per clip, location and identity attached.")}
      ${link(`${SITE}/live`, "The public live grid", "What citizens see — worth knowing before you appear on it.")}
      ${link(`${SITE}/how-it-works`, "How the review process works", "What happens to your evidence after you send it.")}
      ${link(`${SITE}/account`, "Your profile & NIN", "Keep your locality and contact details current.")}
      ${link(`${SITE}/contact`, "Observer support", "Deployment questions, or anything blocking you from going live.")}
    </table>
  </td></tr>

  <!-- Conduct reminder -->
  <tr><td style="padding:24px 28px 0;">
    <div style="border-left:3px solid #0f7a45;padding:4px 0 4px 14px;">
      <p style="margin:0;color:#41546b;font-size:13px;line-height:1.65;">
        <strong style="color:#12243d;">Two rules above all others.</strong> Never film how an
        identifiable person voted. And if a situation turns dangerous, leave first and report from
        safety — no observation is worth an injury, and no operator will ask you for one.
      </p>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:26px 28px 28px;">
    <div style="border-top:1px solid #e6eaef;padding-top:16px;">
      <p style="margin:0;color:#7c8a9c;font-size:11px;line-height:1.6;">
        You are receiving this because your DIGEO accreditation was approved on DIGITs Election
        Watch. Your accreditation number is ${input.certificateNumber}.
      </p>
      <p style="margin:10px 0 0;color:#7c8a9c;font-size:11px;">
        Built by <strong style="color:#0f7a45;">SirHope</strong> of
        <strong style="color:#0f7a45;">WYN-Tech</strong>.
      </p>
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  return { subject, html };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Caller must be staff.
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token || token.split(".").length !== 3) return json({ error: "Sign in required." }, 401);

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Sign in required." }, 401);

  const { data: callerRoles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id);
  const staff = new Set(["super_admin", "admin", "observer_coordinator"]);
  if (!(callerRoles ?? []).some((r: { role: string }) => staff.has(r.role))) {
    return json({ error: "Admins and observer coordinators only." }, 403);
  }

  // Resolve the recipient by id or email.
  const userId = body.userId ? String(body.userId) : null;
  const email = body.email ? String(body.email).toLowerCase() : null;
  if (!userId && !email) return json({ error: "Provide userId or email." }, 400);

  const { data: users, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) return json({ error: listError.message }, 500);

  const recipient = users.users.find((u) =>
    userId ? u.id === userId : (u.email ?? "").toLowerCase() === email,
  );
  if (!recipient?.email) return json({ error: "Recipient not found." }, 404);

  const [{ data: profile }, { data: certificate }] = await Promise.all([
    admin.from("profiles").select("display_name, state, lga, nin").eq("id", recipient.id).maybeSingle(),
    admin.from("digeo_certificates").select("*").eq("user_id", recipient.id).maybeSingle(),
  ]);

  if (!certificate) {
    return json(
      { error: "This account has no DIGEO certificate yet. Accredit them first." },
      409,
    );
  }

  const rendered = renderEmail({
    fullName: certificate.full_name || profile?.display_name || "Observer",
    certificateNumber: certificate.certificate_number,
    state: certificate.state,
    lga: certificate.lga ?? profile?.lga ?? null,
    issuedAt: certificate.issued_at,
    expiresAt: certificate.expires_at,
    qrHash: certificate.qr_code_hash,
    averageScore: certificate.average_score,
    hasNin: Boolean(profile?.nin),
  });

  if (body.action === "preview") {
    return json({ ...rendered, to: recipient.email, certificate: certificate.certificate_number });
  }

  if (body.action !== "send") return json({ error: "Unknown action." }, 400);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return json(
      {
        error: "No email provider configured.",
        detail:
          "Set RESEND_API_KEY (and optionally DIGEO_MAIL_FROM) in the Supabase function secrets, then send again. Nothing was sent.",
        configured: false,
      },
      503,
    );
  }

  // EMAIL_FROM is the documented name; DIGEO_MAIL_FROM kept as an alias.
  const from =
    Deno.env.get("EMAIL_FROM") ??
    Deno.env.get("DIGEO_MAIL_FROM") ??
    "DIGITs Election Watch <onboarding@resend.dev>";

  // Staff may redirect delivery without changing whose accreditation the email
  // describes. Recorded below so a redirected send is never mistaken for a
  // delivery to the holder.
  const deliverTo =
    typeof body.deliverTo === "string" && body.deliverTo.includes("@")
      ? body.deliverTo.trim()
      : recipient.email;
  const redirected = deliverTo.toLowerCase() !== recipient.email.toLowerCase();

  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [deliverTo],
      subject: rendered.subject,
      html: rendered.html,
    }),
  });

  const sendBody = await send.text();
  if (!send.ok) {
    console.error("resend failed", send.status, sendBody);
    return json({ error: "Provider rejected the message.", detail: sendBody }, 502);
  }

  await admin.from("audit_log").insert({
    actor_id: authData.user.id,
    actor_label: authData.user.email ?? null,
    action: "digeo.welcome_email",
    entity: "digeo_certificates",
    entity_id: certificate.id,
    detail: {
      to: deliverTo,
      holder: recipient.email,
      redirected,
      certificate: certificate.certificate_number,
    },
  });

  if (!redirected) {
    await admin.from("notifications").insert({
      user_id: recipient.id,
      title: "Welcome email sent",
      body: `Your DIGEO welcome pack and certificate ${certificate.certificate_number} were emailed to ${recipient.email}.`,
      kind: "success",
      link: "/control-center/training",
    });
  }

  return json({
    ok: true,
    to: deliverTo,
    holder: recipient.email,
    redirected,
    provider: JSON.parse(sendBody || "{}"),
  });
});
