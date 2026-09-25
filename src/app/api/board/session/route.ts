import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.BOARD_ADMIN_TOKEN;
  if (!expected) return Response.json({ error: "Owner access is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const supplied = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  const valid = supplied && Buffer.byteLength(supplied) === Buffer.byteLength(expected) && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
  if (!valid) return Response.json({ error: "Invalid owner token." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
