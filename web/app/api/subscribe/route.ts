import { NextRequest, NextResponse } from "next/server";

// Raccolta email "nuove versioni del tool".
// Ogni iscrizione arriva come mail a NOTIFY_TO via tratto.email (EU, GDPR).
// Env richieste su Vercel: TRATTO_KEY, NOTIFY_TO, FROM_EMAIL.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  const r = await fetch("https://api.tratto.email/v1/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `FantaDraft2027 — nuovo iscritto: ${email}`,
      html: `<p>Nuovo iscritto agli aggiornamenti del tool:</p><p><b>${email}</b></p><p>${new Date().toISOString()}</p>`,
    }),
  });

  if (!r.ok) {
    return NextResponse.json(
      { error: "Invio non riuscito: riprova tra qualche minuto." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
