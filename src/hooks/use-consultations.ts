"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ConsultationWithRelations,
  ConsultationCreateInput,
  ConsultationUpdateInput,
  ConsultationFilters,
} from "@/types/database";

interface ConsultationsResponse {
  data: ConsultationWithRelations[];
  total: number;
  page: number;
  limit: number;
}

// 필터 → query string 변환
function buildQueryString(filters: ConsultationFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

// 상담 목록 조회
export function useConsultations(filters: ConsultationFilters = {}) {
  return useQuery<ConsultationsResponse>({
    queryKey: ["consultations", filters],
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const res = await fetch(`/api/consultations?${qs}`);
      if (!res.ok) throw new Error("상담 목록을 불러오는데 실패했습니다");
      return res.json();
    },
  });
}

// 상담 단건 조회
export function useConsultation(id: string | null) {
  return useQuery<{ data: ConsultationWithRelations }>({
    queryKey: ["consultation", id],
    queryFn: async () => {
      const res = await fetch(`/api/consultations/${id}`);
      if (!res.ok) throw new Error("상담 내역을 불러오는데 실패했습니다");
      return res.json();
    },
    enabled: !!id,
  });
}

// 상담 등록
export function useCreateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConsultationCreateInput) => {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "등록에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

// 상담 수정
export function useUpdateConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: ConsultationUpdateInput & { id: string }) => {
      const res = await fetch(`/api/consultations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "수정에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
      queryClient.invalidateQueries({
        queryKey: ["consultation", variables.id],
      });
    },
  });
}

// 상담 삭제 (소프트 삭제)
export function useDeleteConsultation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/consultations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "삭제에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}

// 일괄 삭제
export function useBulkDeleteConsultations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/consultations/${id}`, { method: "DELETE" })
        )
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length}건의 삭제에 실패했습니다`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations"] });
    },
  });
}
