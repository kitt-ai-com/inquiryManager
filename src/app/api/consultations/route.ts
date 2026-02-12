import { createClient } from "@/lib/supabase/server";
import { createConsultationSchema, consultationFiltersSchema } from "@/lib/validations/consultation";
import { NextRequest, NextResponse } from "next/server";

// GET /api/consultations - 상담 목록 조회 (필터링, 페이지네이션)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;

    const filters = consultationFiltersSchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    const { page, limit, search, medium_id, category_id, status, date_from, date_to } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("consultations")
      .select(
        `
        *,
        medium:mediums(*),
        client:clients(*),
        consultation_categories(category:item_categories(*)),
        consultation_tags(tag:tags(*))
        `,
        { count: "exact" }
      )
      .is("deleted_at", null)
      .order("consulted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = supabase
        .from("consultations")
        .select(
          `
          *,
          medium:mediums(*),
          client:clients!inner(*),
          consultation_categories(category:item_categories(*)),
          consultation_tags(tag:tags(*))
          `,
          { count: "exact" }
        )
        .is("deleted_at", null)
        .or(`content.ilike.%${search}%,client.name.ilike.%${search}%`)
        .order("consulted_at", { ascending: false })
        .range(offset, offset + limit - 1);
    }

    if (medium_id) {
      query = query.eq("medium_id", medium_id);
    }
    if (category_id) {
      // 카테고리 필터는 조인 테이블을 통해 필터링
      query = query.eq("consultation_categories.category_id", category_id);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (date_from) {
      query = query.gte("consulted_at", date_from);
    }
    if (date_to) {
      query = query.lte("consulted_at", date_to);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // consultation_tags, consultation_categories 구조를 평탄화
    const consultations = (data ?? []).map((item) => ({
      ...item,
      categories: item.consultation_categories?.map((cc: { category: unknown }) => cc.category) ?? [],
      tags: item.consultation_tags?.map((ct: { tag: unknown }) => ct.tag) ?? [],
      consultation_categories: undefined,
      consultation_tags: undefined,
    }));

    return NextResponse.json({
      data: consultations,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "잘못된 요청 파라미터입니다" }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

// POST /api/consultations - 상담 등록
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validated = createConsultationSchema.parse(body);

    const { tag_ids, category_ids, ...consultationData } = validated;

    // 상담 내역 삽입
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .insert(consultationData)
      .select()
      .single();

    if (consultationError) {
      return NextResponse.json({ error: consultationError.message }, { status: 500 });
    }

    // 태그 연결
    if (tag_ids && tag_ids.length > 0) {
      const tagLinks = tag_ids.map((tag_id) => ({
        consultation_id: consultation.id,
        tag_id,
      }));

      const { error: tagError } = await supabase
        .from("consultation_tags")
        .insert(tagLinks);

      if (tagError) {
        return NextResponse.json({ error: tagError.message }, { status: 500 });
      }
    }

    // 카테고리 연결
    if (category_ids && category_ids.length > 0) {
      const categoryLinks = category_ids.map((category_id) => ({
        consultation_id: consultation.id,
        category_id,
      }));

      const { error: catError } = await supabase
        .from("consultation_categories")
        .insert(categoryLinks);

      if (catError) {
        return NextResponse.json({ error: catError.message }, { status: 500 });
      }
    }

    // 관계 데이터 포함하여 다시 조회
    const { data: result, error: fetchError } = await supabase
      .from("consultations")
      .select(
        `
        *,
        medium:mediums(*),
        client:clients(*),
        consultation_categories(category:item_categories(*)),
        consultation_tags(tag:tags(*))
        `
      )
      .eq("id", consultation.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const response = {
      ...result,
      categories: result.consultation_categories?.map((cc: { category: unknown }) => cc.category) ?? [],
      tags: result.consultation_tags?.map((ct: { tag: unknown }) => ct.tag) ?? [],
      consultation_categories: undefined,
      consultation_tags: undefined,
    };

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "입력값이 올바르지 않습니다" }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}
