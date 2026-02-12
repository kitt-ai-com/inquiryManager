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
 * 업로드용 Excel 양식 다운로드 (exceljs 사용 - 드롭다운 지원)
 */
export async function downloadExcelTemplate(
  mediumNames: string[] = [],
  categoryNames: string[] = [],
) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const statusList = ["접수", "진행", "완료", "보류"];
  const maxRow = 100;

  // === 상담등록양식 시트 ===
  const ws = workbook.addWorksheet("상담등록양식");

  // 헤더
  const headers = ["문의일자", "상담매체", "업체명", "연락처", "이메일", "취급품목", "문의품목", "상담내용", "상태"];
  ws.addRow(headers);

  // 샘플 데이터
  ws.addRow([
    format(new Date(), "yyyy-MM-dd"),
    mediumNames[0] ?? "전화",
    "샘플업체",
    "010-1234-5678",
    "sample@example.com",
    "",
    categoryNames[0] ?? "",
    "제품 문의입니다.",
    "접수",
  ]);

  // 컬럼 너비
  ws.columns = [
    { width: 14 }, { width: 12 }, { width: 16 }, { width: 16 },
    { width: 26 }, { width: 26 }, { width: 26 }, { width: 50 }, { width: 10 },
  ];

  // 헤더 스타일
  ws.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2EFDA" } };
  });

  // 드롭다운 설정 (2행~maxRow행)
  const mediumFormula = `"${mediumNames.join(",")}"`;
  const statusFormula = `"${statusList.join(",")}"`;
  const categoryFormula = categoryNames.length > 0 ? `"${categoryNames.join(",")}"` : null;

  for (let row = 2; row <= maxRow; row++) {
    // 상담매체 (B열)
    if (mediumNames.length > 0) {
      ws.getCell(`B${row}`).dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [mediumFormula],
        showErrorMessage: true,
        errorTitle: "입력 오류",
        error: `다음 중 선택: ${mediumNames.join(", ")}`,
      };
    }

    // 상태 (I열)
    ws.getCell(`I${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [statusFormula],
      showErrorMessage: true,
      errorTitle: "입력 오류",
      error: `다음 중 선택: ${statusList.join(", ")}`,
    };

    // 문의품목 (G열)
    if (categoryFormula) {
      ws.getCell(`G${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [categoryFormula],
        showErrorMessage: true,
        errorTitle: "입력 오류",
        error: `다음 중 선택: ${categoryNames.join(", ")}`,
      };
    }
  }

  // === 입력안내 시트 ===
  const guide = workbook.addWorksheet("입력안내");
  const mediumStr = mediumNames.length > 0 ? mediumNames.join(", ") : "전화, 채널톡, 메일, 카카오톡, 기타";
  const categoryStr = categoryNames.length > 0 ? categoryNames.join(", ") : "자유 입력";

  guide.addRow(["항목", "설명", "필수"]);
  guide.addRow(["문의일자", "YYYY-MM-DD 형식 (예: 2024-01-15)", "O"]);
  guide.addRow(["상담매체", `드롭다운 선택: ${mediumStr}`, "O"]);
  guide.addRow(["업체명", "업체명 (없으면 자동 생성)", "O"]);
  guide.addRow(["연락처", "연락처 (선택)", ""]);
  guide.addRow(["이메일", "이메일 주소 (선택)", ""]);
  guide.addRow(["취급품목", "쉼표(,)로 구분하여 입력 (선택)", ""]);
  guide.addRow(["문의품목", `드롭다운 선택: ${categoryStr}`, ""]);
  guide.addRow(["상담내용", "상담 내용", "O"]);
  guide.addRow(["상태", `드롭다운 선택: ${statusList.join(", ")} (기본: 접수)`, ""]);

  guide.columns = [{ width: 12 }, { width: 55 }, { width: 6 }];
  guide.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "상담등록_양식.xlsx";
  link.click();
  URL.revokeObjectURL(link.href);
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
