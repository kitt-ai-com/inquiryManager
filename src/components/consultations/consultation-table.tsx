"use client";

import { useMemo, useState, useCallback } from "react";
import { type RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { ConsultationFiltersToolbar } from "@/components/consultations/consultation-filters";
import { getColumns } from "@/components/consultations/columns";
import { ConsultationFormDialog } from "@/components/consultations/consultation-form-dialog";
import { DeleteConfirmDialog } from "@/components/consultations/delete-confirm-dialog";
import {
  useConsultations,
  useUpdateConsultation,
  useDeleteConsultation,
  useBulkDeleteConsultations,
} from "@/hooks/use-consultations";
import { useUpdateClient } from "@/hooks/use-clients";
import { useMediums } from "@/hooks/use-mediums";
import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Download, Upload, FileSpreadsheet, FileText } from "lucide-react";
import { exportConsultationsToExcel, exportConsultationsToCSV, downloadExcelTemplate } from "@/lib/utils/export-excel";
import { BulkUploadDialog } from "@/components/consultations/bulk-upload-dialog";
import { toast } from "sonner";
import type { ConsultationFilters, ConsultationWithRelations } from "@/types/database";

export function ConsultationTable() {
  const [filters, setFilters] = useState<ConsultationFilters>({
    page: 1,
    limit: 20,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 다이얼로그 상태
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ConsultationWithRelations | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConsultationWithRelations | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);

  const { data, isLoading } = useConsultations(filters);
  const updateConsultation = useUpdateConsultation();
  const updateClient = useUpdateClient();
  const deleteConsultation = useDeleteConsultation();
  const bulkDelete = useBulkDeleteConsultations();
  const { data: mediumsData } = useMediums();
  const { data: categoriesData } = useCategories();

  const consultations = data?.data ?? [];
  const mediumNames = (mediumsData?.data ?? []).map((m) => m.name);
  const categoryNames = (categoriesData?.data ?? []).map((c) => c.name);
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const limit = filters.limit ?? 20;

  const handlePageChange = useCallback(
    (newPage: number) => {
      setFilters((prev) => ({ ...prev, page: newPage }));
      setRowSelection({});
    },
    []
  );

  const handleFiltersChange = useCallback(
    (newFilters: ConsultationFilters) => {
      setFilters(newFilters);
      setRowSelection({});
    },
    []
  );

  // 인라인 수정
  const handleInlineUpdate = useCallback(
    (id: string, field: string, value: unknown) => {
      // 연락처/이메일은 clients 테이블 업데이트
      if (field === "client_contact" || field === "client_email") {
        const consultation = consultations.find((c) => c.id === id);
        if (!consultation?.client_id) return;
        const updateData = field === "client_contact"
          ? { contact: value as string }
          : { email: value as string };
        updateClient.mutate(
          { id: consultation.client_id, ...updateData },
          {
            onSuccess: () => toast.success(field === "client_contact" ? "연락처가 수정되었습니다" : "이메일이 수정되었습니다"),
            onError: (e) => toast.error(e.message),
          }
        );
        return;
      }

      updateConsultation.mutate(
        { id, [field]: value },
        {
          onSuccess: () => toast.success("수정되었습니다"),
          onError: (e) => toast.error(e.message),
        }
      );
    },
    [consultations, updateConsultation, updateClient]
  );

  // 새 상담 등록
  const handleCreate = useCallback(() => {
    setEditTarget(null);
    setFormOpen(true);
  }, []);

  // 수정
  const handleEdit = useCallback((consultation: ConsultationWithRelations) => {
    setEditTarget(consultation);
    setFormOpen(true);
  }, []);

  // 단건 삭제
  const handleDelete = useCallback((consultation: ConsultationWithRelations) => {
    setDeleteTarget(consultation);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteConsultation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("상담 내역이 삭제되었습니다");
        setDeleteTarget(null);
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  }, [deleteTarget, deleteConsultation]);

  // 일괄 삭제
  const handleBulkDelete = useCallback(() => {
    setBulkDeleteOpen(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(() => {
    const selectedIds = Object.keys(rowSelection)
      .map((idx) => consultations[Number(idx)]?.id)
      .filter(Boolean);

    if (selectedIds.length === 0) return;

    bulkDelete.mutate(selectedIds, {
      onSuccess: () => {
        toast.success(`${selectedIds.length}건이 삭제되었습니다`);
        setRowSelection({});
        setBulkDeleteOpen(false);
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  }, [rowSelection, consultations, bulkDelete]);

  const columns = useMemo(
    () => getColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete]
  );

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      {/* 필터 + 새 상담 버튼 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ConsultationFiltersToolbar
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-1 size-4" />
                내보내기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => exportConsultationsToExcel(consultations)}
                disabled={consultations.length === 0}
              >
                <FileSpreadsheet className="mr-2 size-4" />
                Excel 파일 (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportConsultationsToCSV(consultations)}
                disabled={consultations.length === 0}
              >
                <FileText className="mr-2 size-4" />
                CSV 파일 (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-1 size-4" />
                가져오기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadExcelTemplate(mediumNames, categoryNames)}>
                <FileSpreadsheet className="mr-2 size-4" />
                양식 다운로드
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkUploadOpen(true)}>
                <Upload className="mr-2 size-4" />
                Excel 대량 등록
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleCreate}>
            <Plus className="mr-1 size-4" />
            새 상담
          </Button>
        </div>
      </div>

      {/* 일괄 작업 바 */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedCount}건 선택됨
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDelete.isPending}
          >
            <Trash2 className="mr-1 size-4" />
            일괄 삭제
          </Button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={consultations}
        total={total}
        page={page}
        limit={limit}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        meta={{ updateField: handleInlineUpdate }}
      />

      {/* 등록/수정 다이얼로그 */}
      <ConsultationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        consultation={editTarget}
      />

      {/* 단건 삭제 확인 */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="상담 삭제"
        description={`"${deleteTarget?.client?.name ?? ""}" 상담 내역을 삭제하시겠습니까?`}
        onConfirm={handleConfirmDelete}
        isPending={deleteConsultation.isPending}
      />

      {/* 일괄 삭제 확인 */}
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="일괄 삭제"
        description={`${selectedCount}건의 상담 내역을 삭제하시겠습니까?`}
        onConfirm={handleConfirmBulkDelete}
        isPending={bulkDelete.isPending}
      />

      {/* Excel 대량 등록 */}
      <BulkUploadDialog
        open={bulkUploadOpen}
        onOpenChange={setBulkUploadOpen}
      />
    </div>
  );
}
