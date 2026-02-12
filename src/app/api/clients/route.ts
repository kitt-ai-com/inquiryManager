import { createClient } from "@/lib/supabase/server";
import { createClientSchema } from "@/lib/validations/consultation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/clients - 업체 목록 조회 (검색 지원)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search");

    let query = supabase
      .from("clients")
      .select("*")
      .order("name");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// PATCH /api/clients - 업체 수정
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// POST /api/clients - 업체 등록
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validated = createClientSchema.parse(body);

    const { data, error } = await supabase
      .from("clients")
      .insert(validated)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "업체 정보를 올바르게 입력해주세요" }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
