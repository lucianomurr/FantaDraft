import { NextResponse } from "next/server";

// Sha del deploy corrente, letta a ogni richiesta (sempre fresca — a differenza
// del bundle client, che un tab può tenere aperto per ore). Usata da
// UpdateBanner.tsx per sapere se il tab sta girando su una versione superata.
export async function GET() {
  return NextResponse.json(
    { sha: process.env.VERCEL_GIT_COMMIT_SHA || "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
