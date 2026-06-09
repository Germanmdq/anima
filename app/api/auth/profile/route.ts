import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return NextResponse.json(
        { error: "Falta token" },
        { status: 401 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Configuración de servidor incompleta.", details: "Faltan variables de entorno de Supabase Admin." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Token inválido o vencido", details: userError?.message ?? null },
        { status: 401 }
      );
    }

    const user = userData.user;
    const isAdmin = user.email === "germangonzalezmdq@gmail.com";
    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      null;
    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;
    const locale =
      user.user_metadata?.locale ||
      null;

    const profileData: Record<string, any> = {
      id: user.id,
      email: user.email ?? null,
      display_name: displayName,
      avatar_url: avatarUrl,
      locale,
      plan: isAdmin ? "founder" : "free",
      plan_tier: isAdmin ? "founder" : "free",
      status: "active",
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profileData, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json(
        { error: "Error creando profile.", details: profileError.message },
        { status: 500 }
      );
    }

    const { error: usageError } = await supabaseAdmin
      .from("usage_limits")
      .upsert({
        user_id: user.id,
        coach_count: 0,
        narrator_count: 0,
        plan_count: 0,
        book_count: 0,
        questions_count: 0,
        telegram_count: 0,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (usageError) {
      return NextResponse.json(
        { error: "Error creando usage_limits.", details: usageError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: {
        id: user.id,
        email: user.email ?? null,
        display_name: displayName,
        avatar_url: avatarUrl,
        locale,
        plan: isAdmin ? "founder" : "free",
        plan_tier: isAdmin ? "founder" : "free",
        status: "active",
      },
      user: {
        id: user.id,
        email: user.email ?? null,
        user_metadata: user.user_metadata ?? {},
      },
      role: isAdmin ? "admin" : "user",
      plan: isAdmin ? "founder" : "free",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error interno del servidor.", details: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
