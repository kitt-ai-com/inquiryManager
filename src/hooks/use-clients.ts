"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client, ClientCreateInput } from "@/types/database";

// 업체 목록 조회 (검색 지원)
export function useClients(search?: string) {
  return useQuery<{ data: Client[] }>({
    queryKey: ["clients", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/clients${params}`);
      if (!res.ok) throw new Error("업체 목록을 불러오는데 실패했습니다");
      return res.json();
    },
  });
}

// 업체 수정
export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; contact?: string; email?: string }) => {
      const res = await fetch("/api/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...input }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "업체 수정에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      // consultations 쿼리를 즉시 refetch하여 업데이트된 client 정보 반영
      queryClient.invalidateQueries({
        queryKey: ["consultations"],
        refetchType: "active",
      });
    },
  });
}

// 업체 등록
export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ClientCreateInput) => {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "업체 등록에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
