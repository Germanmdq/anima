import { NextResponse } from "next/server";

/**
 * Returns the current user ID from the ANIMA_DEFAULT_USER_ID env var.
 * Throws a descriptive error if the variable is not set.
 *
 * When a real auth system is added, this function should be replaced
 * with session/token-based user resolution.
 */
export function getCurrentUserId(): string {
  const userId = process.env.ANIMA_DEFAULT_USER_ID;
  if (!userId) {
    throw new MissingUserError();
  }
  return userId;
}

export class MissingUserError extends Error {
  constructor() {
    super(
      "ANIMA_DEFAULT_USER_ID is not set. Add it to .env.local to identify the default user."
    );
    this.name = "MissingUserError";
  }
}

/**
 * Standard 500 response for missing user configuration.
 */
export function missingUserResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "Usuario no configurado. Agregá ANIMA_DEFAULT_USER_ID en .env.local.",
    },
    { status: 500 }
  );
}
