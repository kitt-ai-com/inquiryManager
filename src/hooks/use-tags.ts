"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Tag, TagCreateInput } from "@/types/database";

// 태그 목록 조회
export function useTags() {
  return useQuery<{ data: Tag[] }>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("태그 목록을 불러오는데 실패했습니다");
      return res.json();
    },
  });
}

// 태그 생성
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TagCreateInput) => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "태그 생성에 실패했습니다");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
