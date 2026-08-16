import { NextRequest, NextResponse } from "next/server";

// Raccolta email "nuove versioni del tool".
// Ogni iscrizione arriva come mail a NOTIFY_TO via tratto.email (EU, GDPR),
// e l'iscritto riceve una mail di conferma con il riepilogo del tool.
// Env richieste su Vercel: TRATTO_KEY, NOTIFY_TO, FROM_EMAIL.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fantadraft.murruni.it";

async function sendTratto(key: string, payload: Record<string, string>) {
  return fetch("https://api.tratto.email/v1/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function confirmationHtml() {
  const bg = "#0f1420";
  const panel = "#171d2b";
  const line = "#2a3346";
  const txt = "#e8edf6";
  const muted = "#93a0b8";
  const acc2 = "#38d39f";

  const feature = (title: string, desc: string) => `
    <tr>
      <td style="padding:10px 0;border-top:1px solid ${line};" valign="top">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="22" valign="top" style="color:${acc2};font-size:15px;line-height:22px;">✓</td>
            <td style="color:${txt};font-size:14.5px;line-height:22px;">
              <b>${title}</b><br/>
              <span style="color:${muted};font-size:13.5px;">${desc}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${bg};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${panel};border:1px solid ${line};border-radius:16px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            <tr>
              <td style="padding:26px 30px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="30" style="background:linear-gradient(135deg,#4f8cff,${acc2});border-radius:8px;text-align:center;font-size:16px;line-height:30px;">⚽</td>
                    <td style="padding-left:10px;color:${txt};font-weight:700;font-size:15px;letter-spacing:.02em;">
                      FantaDraft2027
                      <span style="margin-left:6px;font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${acc2};border:1px solid rgba(56,211,159,.4);padding:2px 8px;border-radius:999px;">100% gratuito</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px 4px;">
                <div style="color:${txt};font-size:22px;font-weight:700;letter-spacing:-.01em;">Iscrizione confermata ✓</div>
                <p style="color:${muted};font-size:14.5px;line-height:1.6;margin:10px 0 0;">
                  Ti scrivo quando esce una novità sul tool per l'asta del fantacalcio
                  2026/27 — niente spam, solo aggiornamenti veri. Nel frattempo, ecco
                  cosa trovi già dentro:
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 30px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${feature("498 giocatori", "Quotazioni ufficiali 2026/27 con Qt e FVM.")}
                  ${feature("Statistiche reali", "Gol, rigori, assist, minuti e xG/xA (FBref + Understat) delle ultime due stagioni.")}
                  ${feature("Probabili formazioni", "Aggregate da 6 fonti (SOS Fanta, FantaMaster, Eurosport, Goal, Gazzetta, Fantacalcio.it).")}
                  ${feature("Rigoristi, infortunati, trasferimenti", "Gerarchie, prognosi di rientro e badge sui mercati estivi.")}
                  ${feature("Asta live", "Fasce di preferenza con preset regolabile, prezzi target, budget residuo per reparto.")}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px 28px;">
                <a href="${SITE_URL}/tool" style="display:inline-block;background:${acc2};color:#04150e;font-weight:700;font-size:15px;text-decoration:none;padding:13px 26px;border-radius:12px;">Apri il tool →</a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 30px 26px;border-top:1px solid ${line};">
                <p style="color:${muted};font-size:12.5px;line-height:1.6;margin:0;">
                  Gratuito e open source. Codice su
                  <a href="https://github.com/lucianomurr/FantaDraft" style="color:#4f8cff;">GitHub</a>.
                  Questa mail è l'unica conferma automatica legata alla tua iscrizione.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function POST(req: NextRequest) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Indirizzo email non valido." }, { status: 400 });
  }

  const key = process.env.TRATTO_KEY;
  const to = process.env.NOTIFY_TO;
  const from = process.env.FROM_EMAIL;
  if (!key || !to || !from) {
    return NextResponse.json(
      { error: "Iscrizioni non ancora attive: riprova più tardi." },
      { status: 503 },
    );
  }

  const r = await sendTratto(key, {
    from,
    to,
    subject: `FantaDraft2027 — nuovo iscritto: ${email}`,
    html: `<p>Nuovo iscritto agli aggiornamenti del tool:</p><p><b>${email}</b></p><p>${new Date().toISOString()}</p>`,
  });

  if (!r.ok) {
    return NextResponse.json(
      { error: "Invio non riuscito: riprova tra qualche minuto." },
      { status: 502 },
    );
  }

  // Best-effort: se la mail di conferma fallisce, l'iscrizione (già notificata
  // sopra) resta comunque valida per l'utente finale.
  sendTratto(key, {
    from,
    to: email,
    subject: "Iscrizione confermata — FantaDraft2027",
    html: confirmationHtml(),
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 200 });
}
