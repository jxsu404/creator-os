import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Protege rutas /api cuando Supabase está configurado.
 * En modo solo-local (sin env) deja pasar.
 * @returns NextResponse 401 si falta sesión; null si puede continuar.
 */
export async function unauthorizedApiResponse(): Promise<NextResponse | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;

  const supabase = await createSupabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return null;
}
