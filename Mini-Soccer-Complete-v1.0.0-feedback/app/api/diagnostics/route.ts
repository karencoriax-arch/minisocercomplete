export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {}

  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const safe = {
    kind: String(record.kind ?? "unknown").slice(0, 40),
    message: String(record.message ?? "unknown").slice(0, 1200),
    stack: String(record.stack ?? "").slice(0, 5000),
    href: String(record.href ?? "").slice(0, 500),
    userAgent: String(record.userAgent ?? "").slice(0, 500),
    at: String(record.at ?? "").slice(0, 80),
  };

  console.error("MSC_CLIENT_DIAGNOSTIC", JSON.stringify(safe));
  return Response.json({ ok: true });
}
