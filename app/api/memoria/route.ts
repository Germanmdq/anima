import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return {
      errorResponse: NextResponse.json({ error: "Falta token" }, { status: 401 }),
      supabaseAdmin: null,
      user: null,
    };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !userData.user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Token inválido o vencido", details: error?.message ?? null },
        { status: 401 }
      ),
      supabaseAdmin,
      user: null,
    };
  }

  return {
    errorResponse: null,
    supabaseAdmin,
    user: userData.user,
  };
}

export async function GET(req: Request) {
  try {
    const { errorResponse, supabaseAdmin, user } = await getAuthenticatedUser(req);
    if (errorResponse || !supabaseAdmin || !user) {
      return errorResponse!;
    }

    const { data: memorias, error } = await supabaseAdmin
      .from("memoria")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memorias });
  } catch (error: any) {
    console.error("Error fetching memoria:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { errorResponse, supabaseAdmin, user } = await getAuthenticatedUser(req);
    if (errorResponse || !supabaseAdmin || !user) {
      return errorResponse!;
    }

    const body = await req.json();
    const { item_type, title, content, source, status } = body;

    if (!item_type || !content) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const { data: newMemory, error } = await supabaseAdmin
      .from("memoria")
      .insert({
        user_id: user.id,
        item_type,
        title: title || null,
        content,
        source: source || "Desconocido",
        status: status || "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting memoria:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, memoria: newMemory });
  } catch (error: any) {
    console.error("Error in memoria route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
