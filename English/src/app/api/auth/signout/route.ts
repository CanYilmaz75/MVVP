import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/server/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
