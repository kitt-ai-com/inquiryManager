import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

const VALID_STATUSES = ["접수", "진행", "완료", "보류"] as const;

const bulkUploadRowSchema = z.object({
  문의일자: z.string().min(1, "문의일자는 필수입니다"),
  상담매체: z.string().min(1, "상담매체는 필수입니다"),
  업체명: z.string().min(1, "업체명은 필수입니다"),
  연락처: z.string().optional(),
  이메일: z.string().optional(),
  취급품목: z.string().optional(),
  문의품목: z.string().optional(),
  상담내용: z.string().min(1, "상담내용은 필수입니다"),
  상태: z.string().optional(),
});

const bulkUploadSchema = z.object({
  rows: z.array(bulkUploadRowSchema).min(1, "최소 1개 이상의 데이터가 필요합니다"),
});

interface BulkImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

// POST /api/consultations/bulk - 대량 등록
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const validated = bulkUploadSchema.parse(body);
    const { rows } = validated;

    const result: BulkImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // 매체 목록 가져오기
    const { data: mediums } = await supabase
      .from("mediums")
      .select("*")
      .eq("is_active", true);

    const mediumMap = new Map(mediums?.map((m) => [m.name, m.id]) ?? []);

    // 기존 업체 목록 가져오기
    const { data: existingClients } = await supabase
      .from("clients")
      .select("*");

    const clientMap = new Map(
      existingClients?.map((c) => [c.name.toLowerCase(), c]) ?? []
    );

    // 기존 태그 목록 가져오기
    const { data: existingTags } = await supabase.from("tags").select("*");
    const tagMap = new Map(
      existingTags?.map((t) => [t.name.toLowerCase(), t.id]) ?? []
    );

    // 기존 카테고리 목록 가져오기
    const { data: existingCategories } = await supabase
      .from("item_categories")
      .select("*")
      .eq("is_active", true);

    const categoryMap = new Map(
      existingCategories?.map((c) => [c.name.toLowerCase(), c.id]) ?? []
    );

    // 각 행 처리
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel 행 번호 (헤더 + 1-indexed)

      try {
        // 1. 매체 확인
        const mediumId = mediumMap.get(row.상담매체);
        if (!mediumId) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            message: `알 수 없는 상담매체: ${row.상담매체}`,
          });
          continue;
        }

        // 2. 날짜 파싱
        let consultedAt: string;
        try {
          const dateValue = row.문의일자;
          // Excel 날짜 형식 처리 (숫자인 경우)
          if (typeof dateValue === "number") {
            const excelDate = new Date((dateValue - 25569) * 86400 * 1000);
            consultedAt = excelDate.toISOString();
          } else {
            const parsed = new Date(dateValue);
            if (isNaN(parsed.getTime())) {
              throw new Error("잘못된 날짜 형식");
            }
            consultedAt = parsed.toISOString();
          }
        } catch {
          result.failed++;
          result.errors.push({
            row: rowNum,
            message: `잘못된 날짜 형식: ${row.문의일자}`,
          });
          continue;
        }

        // 3. 상태 확인
        const status = row.상태?.trim() || "접수";
        if (!VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            message: `잘못된 상태값: ${row.상태}`,
          });
          continue;
        }

        // 4. 업체 찾기 또는 생성
        let clientId: string;
        const clientName = row.업체명.trim();
        const existingClient = clientMap.get(clientName.toLowerCase());

        if (existingClient) {
          clientId = existingClient.id;

          // 연락처/이메일 업데이트 (기존 값이 없는 경우에만)
          const contact = row.연락처?.trim();
          const email = row.이메일?.trim();

          if ((contact && !existingClient.contact) || (email && !existingClient.email)) {
            await supabase
              .from("clients")
              .update({
                ...(contact && !existingClient.contact ? { contact } : {}),
                ...(email && !existingClient.email ? { email } : {}),
              })
              .eq("id", clientId);
          }
        } else {
          // 새 업체 생성
          const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
              name: clientName,
              contact: row.연락처?.trim() || null,
              email: row.이메일?.trim() || null,
            })
            .select()
            .single();

          if (clientError || !newClient) {
            result.failed++;
            result.errors.push({
              row: rowNum,
              message: `업체 생성 실패: ${clientError?.message ?? "알 수 없는 오류"}`,
            });
            continue;
          }

          clientId = newClient.id;
          clientMap.set(clientName.toLowerCase(), newClient);
        }

        // 5. 태그 처리 (쉼표로 구분)
        const tagIds: string[] = [];
        if (row.취급품목?.trim()) {
          const tagNames = row.취급품목.split(",").map((t) => t.trim()).filter(Boolean);

          for (const tagName of tagNames) {
            let tagId = tagMap.get(tagName.toLowerCase());

            if (!tagId) {
              // 새 태그 생성
              const { data: newTag, error: tagError } = await supabase
                .from("tags")
                .insert({ name: tagName })
                .select()
                .single();

              if (!tagError && newTag) {
                tagId = newTag.id;
                tagMap.set(tagName.toLowerCase(), tagId);
              }
            }

            if (tagId) {
              tagIds.push(tagId);
            }
          }
        }

        // 6. 카테고리 처리 (쉼표로 구분)
        const categoryIds: string[] = [];
        if (row.문의품목?.trim()) {
          const categoryNames = row.문의품목.split(",").map((c) => c.trim()).filter(Boolean);

          for (const categoryName of categoryNames) {
            let categoryId = categoryMap.get(categoryName.toLowerCase());

            if (!categoryId) {
              // 새 카테고리 생성
              const { data: newCategory, error: catError } = await supabase
                .from("item_categories")
                .insert({ name: categoryName, is_active: true })
                .select()
                .single();

              if (!catError && newCategory) {
                categoryId = newCategory.id;
                categoryMap.set(categoryName.toLowerCase(), categoryId);
              }
            }

            if (categoryId) {
              categoryIds.push(categoryId);
            }
          }
        }

        // 7. 상담 내역 생성
        const { data: consultation, error: consultationError } = await supabase
          .from("consultations")
          .insert({
            consulted_at: consultedAt,
            medium_id: mediumId,
            client_id: clientId,
            content: row.상담내용.trim(),
            status,
          })
          .select()
          .single();

        if (consultationError || !consultation) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            message: `상담 생성 실패: ${consultationError?.message ?? "알 수 없는 오류"}`,
          });
          continue;
        }

        // 8. 태그 연결
        if (tagIds.length > 0) {
          await supabase.from("consultation_tags").insert(
            tagIds.map((tagId) => ({
              consultation_id: consultation.id,
              tag_id: tagId,
            }))
          );
        }

        // 9. 카테고리 연결
        if (categoryIds.length > 0) {
          await supabase.from("consultation_categories").insert(
            categoryIds.map((categoryId) => ({
              consultation_id: consultation.id,
              category_id: categoryId,
            }))
          );
        }

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNum,
          message: error instanceof Error ? error.message : "알 수 없는 오류",
        });
      }
    }

    return NextResponse.json({
      data: result,
      message: `${result.success}건 등록 완료${result.failed > 0 ? `, ${result.failed}건 실패` : ""}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "입력 데이터가 올바르지 않습니다", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
