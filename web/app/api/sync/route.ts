import { NextRequest, NextResponse } from "next/server";

// Sync multi-device per la modalità "Inizia asta" (mobile): stato asta condiviso
// via codice a 6 cifre, backend Upstash Redis (REST API, no SDK). TTL 48h — non è
// storage permanente, solo un ponte per far vedere lo stesso stato a 2 device
// durante l'asta live. Nessun dato sensibile: solo id giocatori/fasce/prezzi.
// Env richieste su Vercel: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN.

const CODE_RE = /^\d{6}$/;
const TTL_SECONDS = 60 * 60 * 48;

function upstashConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstash(command: (string | number)[]) {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`upstash error: ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  if (!upstashConfigured()) {
    return NextResponse.json({ error: "sync non configurato" }, { status: 503 });
  }
  const code = req.nextUrl.searchParams.get("code") ?? "";
  if (!CODE_RE.test(code)) {
    return NextResponse.json({ error: "codice non valido" }, { status: 400 });
  }
  try {
    const { result } = await upstash(["GET", `asta:${code}`]);
    return NextResponse.json({ state: result ? JSON.parse(result) : null });
  } catch {
    return NextResponse.json({ error: "errore sync" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!upstashConfigured()) {
    return NextResponse.json({ error: "sync non configurato" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const code = body?.code;
  if (typeof code !== "string" || !CODE_RE.test(code)) {
    return NextResponse.json({ error: "codice non valido" }, { status: 400 });
  }
  if (!body.cfg || !body.st || typeof body.updatedAt !== "number") {
    return NextResponse.json({ error: "payload non valido" }, { status: 400 });
  }
  const payload = JSON.stringify({ cfg: body.cfg, st: body.st, updatedAt: body.updatedAt });
  try {
    await upstash(["SET", `asta:${code}`, payload, "EX", TTL_SECONDS]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "errore sync" }, { status: 502 });
  }
}
