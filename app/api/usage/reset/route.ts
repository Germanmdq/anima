import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    // 1. Verificar identidad (idealmente por token de sesión, pero por simplicidad chequeamos si pasaron el email del admin)
    const body = await req.json();
    const { email } = body;

    if (email !== "germangonzalezmdq@gmail.com") {
      return NextResponse.json({ error: "Acceso denegado. Solo admin." }, { status: 403 });
    }

    // 2. Buscar el user_id del admin en profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "germangonzalezmdq@gmail.com")
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 404 });
    }

    const adminId = profile.id;

    // 3. Resetear tabla usage_limits
    const { error: updateError } = await supabase
      .from("usage_limits")
      .upsert({
        user_id: adminId,
        coach_count: 0,
        narrator_count: 0,
        plan_count: 0,
        book_count: 0,
        questions_count: 0,
        telegram_count: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.error("Error resetting usage limits:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Contadores del administrador reseteados a 0." });
  } catch (error: any) {
    console.error("Error in usage reset route:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
