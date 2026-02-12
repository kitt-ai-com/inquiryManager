"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  downloadExcelTemplate,
  parseExcelFile,
  type ExcelUploadRow,
} from "@/lib/utils/export-excel";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useMediums } from "@/hooks/use-mediums";
import { useCategories } from "@/hooks/use-categories";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

type UploadStatus = "idle" | "parsing" | "uploading" | "success" | "error";

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ExcelUploadRow[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: mediumsData } = useMediums();
  const { data: categoriesData } = useCategories();
  const mediumNames = (mediumsData?.data ?? []).map((m) => m.name);
  const categoryNames = (categoriesData?.data ?? []).map((c) => c.name);

  const resetState = () => {
    setStatus("idle");
    setSelectedFile(null);
    setParsedRows([]);
    setUploadResult(null);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 확장자 검증
    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      toast.error("Excel 파일(.xlsx, .xls)만 업로드 가능합니다");
      return;
    }

    setSelectedFile(file);
    setStatus("parsing");
    setErrorMessage("");

    try {
      const rows = await parseExcelFile(file);

      if (rows.length === 0) {
        setErrorMessage("업로드할 데이터가 없습니다");
        setStatus("error");
        return;
      }

      // 필수 필드 검증
      const requiredFields = ["문의일자", "상담매체", "업체명", "상담내용"];
      const firstRow = rows[0];
      const missingFields = requiredFields.filter(
        (field) => !(field in firstRow)
      );

      if (missingFields.length > 0) {
        setErrorMessage(`필수 컬럼이 없습니다: ${missingFields.join(", ")}`);
        setStatus("error");
        return;
      }

      setParsedRows(rows);
      setStatus("idle");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "파일 파싱 실패");
      setStatus("error");
    }
  };

  const handleUpload = async () => {
    if (parsedRows.length === 0) return;

    setStatus("uploading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/consultations/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "업로드 실패");
      }

      setUploadResult(data.data);
      setStatus("success");

      // 쿼리 무효화하여 목록 갱신
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      toast.success(data.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "업로드 실패");
      setStatus("error");
    }
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Excel 대량 등록</DialogTitle>
          <DialogDescription>
            Excel 파일로 여러 상담 내역을 한 번에 등록합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 양식 다운로드 */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">1. 양식 다운로드</p>
                <p className="text-sm text-muted-foreground">
                  입력 양식과 안내사항이 포함된 Excel 파일
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadExcelTemplate(mediumNames, categoryNames)}>
                <Download className="mr-1 size-4" />
                양식 다운로드
              </Button>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="mb-2 font-medium">2. Excel 파일 업로드</p>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              {status === "parsing" ? (
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              ) : selectedFile ? (
                <>
                  <FileSpreadsheet className="size-8 text-green-600" />
                  <p className="mt-2 text-sm font-medium">{selectedFile.name}</p>
                  {parsedRows.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {parsedRows.length}건의 데이터
                    </p>
                  )}
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    클릭하여 파일 선택 (.xlsx, .xls)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <Alert variant="destructive">
              <XCircle className="size-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* 업로드 결과 */}
          {uploadResult && (
            <div className="space-y-2">
              <Alert variant={uploadResult.failed > 0 ? "default" : "default"}>
                <CheckCircle2 className="size-4 text-green-600" />
                <AlertDescription>
                  <span className="font-medium text-green-600">
                    {uploadResult.success}건 등록 완료
                  </span>
                  {uploadResult.failed > 0 && (
                    <span className="ml-2 text-destructive">
                      / {uploadResult.failed}건 실패
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {uploadResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded border p-2 text-sm">
                  {uploadResult.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="flex gap-2 text-destructive">
                      <AlertCircle className="mt-0.5 size-3 shrink-0" />
                      <span>
                        {err.row}행: {err.message}
                      </span>
                    </div>
                  ))}
                  {uploadResult.errors.length > 10 && (
                    <p className="mt-1 text-muted-foreground">
                      외 {uploadResult.errors.length - 10}건의 오류
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {status === "success" ? "닫기" : "취소"}
          </Button>
          {status !== "success" && (
            <Button
              onClick={handleUpload}
              disabled={parsedRows.length === 0 || status === "uploading"}
            >
              {status === "uploading" ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="mr-1 size-4" />
                  {parsedRows.length > 0 ? `${parsedRows.length}건 등록` : "등록"}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
