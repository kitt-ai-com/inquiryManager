import { createClient } from "@/lib/supabase/server";
import { updateConsultationSchema } from "@/lib/validations/consultation";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const CONSULTATION_SELECT = `
  *,
  medium:mediums(*),
  client:clients(*),
  consultation_categories(category:item_categories(*)),
  consultation_tags(tag:tags(*))
`;

function flattenRelations(data: Record<string, unknown>) {
  return {
    ...data,
    categories: (data.consultation_categories as { category: unknown }[] | undefined)?.map((cc) => cc.category) ?? [],
    tags: (data.consultation_tags as { tag: unknown }[] | undefined)?.map((ct) => ct.tag) ?? [],
    consultation_categories: undefined,
    consultation_tags: undefined,
  };
}

// GET /api/consultations/[id] - 단건 조회
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("consultations")
      .select(CONSULTATION_SELECT)
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      return NextResponse.json({ error: "상담 내역을 찾을 수 없습니다" }, { status: 404 });
    }

    return NextResponse.json({ data: flattenRelations(data) });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// PATCH /api/consultations/[id] - 수정
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await request.json();
    const validated = updateConsultationSchema.parse(body);

    const { tag_ids, category_ids, ...updateData } = validated;

    // 상담 내역 업데이트
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("consultations")
        .update(updateData)
        .eq("id", id)
        .is("deleted_at", null);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // 태그 업데이트 (기존 삭제 후 재삽입)
    if (tag_ids !== undefined) {
      await supabase
        .from("consultation_tags")
        .delete()
        .eq("consultation_id", id);

      if (tag_ids.length > 0) {
        const tagLinks = tag_ids.map((tag_id) => ({
          consultation_id: id,
          tag_id,
        }));

        const { error: tagError } = await supabase
          .from("consultation_tags")
          .insert(tagLinks);

        if (tagError) {
          return NextResponse.json({ error: tagError.message }, { status: 500 });
        }
      }
    }

    // 카테고리 업데이트 (기존 삭제 후 재삽입)
    if (category_ids !== undefined) {
      await supabase
        .from("consultation_categories")
        .delete()
        .eq("consultation_id", id);

      if (category_ids.length > 0) {
        const categoryLinks = category_ids.map((category_id) => ({
          consultation_id: id,
          category_id,
        }));

        const { error: catError } = await supabase
          .from("consultation_categories")
          .insert(categoryLinks);

        if (catError) {
          return NextResponse.json({ error: catError.message }, { status: 500 });
        }
      }
    }

    // 업데이트된 데이터 조회
    const { data, error: fetchError } = await supabase
      .from("consultations")
      .select(CONSULTATION_SELECT)
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ data: flattenRelations(data) });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다" }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// DELETE /api/consultations/[id] - 소프트 삭제
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("consultations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "삭제되었습니다" });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
