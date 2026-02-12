import { createClient } from "@/lib/supabase/server";
import { createTagSchema } from "@/lib/validations/consultation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tags - 태그 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// POST /api/tags - 태그 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validated = createTagSchema.parse(body);

    const { data, error } = await supabase
      .from("tags")
      .insert({ name: validated.name })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "이미 존재하는 태그입니다" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "태그명을 올바르게 입력해주세요" }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
