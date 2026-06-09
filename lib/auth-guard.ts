import { NextRequest, NextResponse } from "next/server";

/**
 * Validates the X-Anima-Access-Token header against the
 * ANIMA_API_ACCESS_TOKEN environment variable.
 *
 * This is a temporary protection layer until real auth is implemented.
 * It prevents unauthenticated external clients from hitting protected
 * API routes while the app runs with a fixed default user.
 *
 * Returns null if authorised, or a 401 NextResponse to return immediately.
 */
export function requireAccessToken(
  request: NextRequest
): NextResponse | null {
  const expected = process.env.ANIMA_API_ACCESS_TOKEN;

  // If no token is configured, skip enforcement (local dev without token).
  if (!expected) return null;

  const provided = request.headers.get("X-Anima-Access-Token");

  if (provided !== expected) {
    return NextResponse.json(
      { error: "Acceso no autorizado. Token inválido o ausente." },
      { status: 401 }
    );
  }

  return null;
}
