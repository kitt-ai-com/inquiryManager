import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

const createCategorySchema = z.object({
  name: z.string().min(1, "품목명을 입력해주세요").max(50),
});

// GET /api/categories - 품목 카테고리 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("item_categories")
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

// POST /api/categories - 품목 카테고리 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    const { data, error } = await supabase
      .from("item_categories")
      .insert({ name: validated.name })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "이미 존재하는 품목입니다" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "품목명을 올바르게 입력해주세요" }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// DELETE /api/categories - 품목 카테고리 삭제 (비활성화)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다" }, { status: 400 });
    }

    const { error } = await supabase
      .from("item_categories")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "삭제되었습니다" });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
