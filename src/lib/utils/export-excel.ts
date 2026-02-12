import * as XLSX from "xlsx";
import type { ConsultationWithRelations } from "@/types/database";
import { format } from "date-fns";

interface ExportOptions {
  filename?: string;
  sheetName?: string;
}

// 업로드용 Excel 컬럼 정의
export const UPLOAD_COLUMNS = [
  "문의일자",
  "상담매체",
  "업체명",
  "연락처",
  "이메일",
  "취급품목",
  "문의품목",
  "상담내용",
  "상태",
] as const;

export interface ExcelUploadRow {
  문의일자: string;
  상담매체: string;
  업체명: string;
  연락처?: string;
  이메일?: string;
  취급품목?: string;
  문의품목?: string;
  상담내용: string;
  상태?: string;
}

/**
 * 업로드용 Excel 양식 다운로드
 */
export function downloadExcelTemplate() {
  const templateData = [
    {
      문의일자: format(new Date(), "yyyy-MM-dd"),
      상담매체: "전화",
      업체명: "샘플업체",
      연락처: "010-1234-5678",
      이메일: "sample@example.com",
      취급품목: "에어셀, 아이스팩",
      문의품목: "에어완충재, 보냉백",
      상담내용: "제품 문의입니다.",
      상태: "접수",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // 컬럼 너비 설정
  worksheet["!cols"] = [
    { wch: 12 },  // 문의일자
    { wch: 10 },  // 상담매체
    { wch: 15 },  // 업체명
    { wch: 15 },  // 연락처
    { wch: 25 },  // 이메일
    { wch: 25 },  // 취급품목
    { wch: 25 },  // 문의품목
    { wch: 50 },  // 상담내용
    { wch: 8 },   // 상태
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "상담등록양식");

  // 안내사항 시트 추가
  const guideData = [
    { 항목: "문의일자", 설명: "YYYY-MM-DD 형식 (예: 2024-01-15)", 필수: "O" },
    { 항목: "상담매체", 설명: "전화, 채널톡, 메일, 카카오톡, 기타 중 선택", 필수: "O" },
    { 항목: "업체명", 설명: "업체명 (없으면 자동 생성)", 필수: "O" },
    { 항목: "연락처", 설명: "연락처 (선택)", 필수: "" },
    { 항목: "이메일", 설명: "이메일 주소 (선택)", 필수: "" },
    { 항목: "취급품목", 설명: "쉼표(,)로 구분하여 입력 (선택)", 필수: "" },
    { 항목: "문의품목", 설명: "쉼표(,)로 구분하여 입력 (선택)", 필수: "" },
    { 항목: "상담내용", 설명: "상담 내용", 필수: "O" },
    { 항목: "상태", 설명: "접수, 진행, 완료, 보류 중 선택 (기본: 접수)", 필수: "" },
  ];
  const guideSheet = XLSX.utils.json_to_sheet(guideData);
  guideSheet["!cols"] = [{ wch: 12 }, { wch: 50 }, { wch: 6 }];
  XLSX.utils.book_append_sheet(workbook, guideSheet, "입력안내");

  XLSX.writeFile(workbook, "상담등록_양식.xlsx");
}

/**
 * Excel 파일 파싱
 */
export function parseExcelFile(file: File): Promise<ExcelUploadRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // 첫 번째 시트 읽기
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // JSON으로 변환
        const rows = XLSX.utils.sheet_to_json<ExcelUploadRow>(worksheet, {
          defval: "",
        });

        resolve(rows);
      } catch (error) {
        reject(new Error("Excel 파일을 읽는데 실패했습니다"));
      }
    };

    reader.onerror = () => {
      reject(new Error("파일을 읽는데 실패했습니다"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 상담 내역을 Excel 파일로 내보내기
 */
export function exportConsultationsToExcel(
  consultations: ConsultationWithRelations[],
  options: ExportOptions = {}
) {
  const { filename = `상담내역_${format(new Date(), "yyyyMMdd_HHmmss")}`, sheetName = "상담내역" } = options;

  // 데이터를 Excel 형식으로 변환
  const data = consultations.map((c) => ({
    상태: c.status,
    문의일자: format(new Date(c.consulted_at), "yyyy-MM-dd"),
    상담매체: c.medium?.name ?? "",
    취급품목: c.tags.map((t) => t.name).join(", "),
    문의품목: c.categories.map((cat) => cat.name).join(", "),
    상담내용: c.content,
    업체명: c.client?.name ?? "",
    연락처: c.client?.contact ?? "",
    이메일: c.client?.email ?? "",
    등록일: format(new Date(c.created_at), "yyyy-MM-dd HH:mm"),
    수정일: format(new Date(c.updated_at), "yyyy-MM-dd HH:mm"),
  }));

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(data);

  // 컬럼 너비 설정
  const columnWidths = [
    { wch: 8 },   // 상태
    { wch: 12 },  // 문의일자
    { wch: 10 },  // 상담매체
    { wch: 20 },  // 취급품목
    { wch: 20 },  // 문의품목
    { wch: 50 },  // 상담내용
    { wch: 15 },  // 업체명
    { wch: 15 },  // 연락처
    { wch: 25 },  // 이메일
    { wch: 18 },  // 등록일
    { wch: 18 },  // 수정일
  ];
  worksheet["!cols"] = columnWidths;

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 파일 다운로드
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * 상담 내역을 CSV 파일로 내보내기
 */
export function exportConsultationsToCSV(
  consultations: ConsultationWithRelations[],
  options: ExportOptions = {}
) {
  const { filename = `상담내역_${format(new Date(), "yyyyMMdd_HHmmss")}` } = options;

  // 데이터를 CSV 형식으로 변환
  const data = consultations.map((c) => ({
    상태: c.status,
    문의일자: format(new Date(c.consulted_at), "yyyy-MM-dd"),
    상담매체: c.medium?.name ?? "",
    취급품목: c.tags.map((t) => t.name).join(", "),
    문의품목: c.categories.map((cat) => cat.name).join(", "),
    상담내용: c.content,
    업체명: c.client?.name ?? "",
    연락처: c.client?.contact ?? "",
    이메일: c.client?.email ?? "",
    등록일: format(new Date(c.created_at), "yyyy-MM-dd HH:mm"),
    수정일: format(new Date(c.updated_at), "yyyy-MM-dd HH:mm"),
  }));

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(data);

  // CSV 문자열 생성
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // BOM 추가 (한글 깨짐 방지)
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  // 파일 다운로드
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
