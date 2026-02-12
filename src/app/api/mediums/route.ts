import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/mediums - 매체 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("mediums")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
