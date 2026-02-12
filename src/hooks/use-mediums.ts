"use client";

import { useQuery } from "@tanstack/react-query";
import type { Medium } from "@/types/database";

// 매체 목록 조회
export function useMediums() {
  return useQuery<{ data: Medium[] }>({
    queryKey: ["mediums"],
    queryFn: async () => {
      const res = await fetch("/api/mediums");
      if (!res.ok) throw new Error("매체 목록을 불러오는데 실패했습니다");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5분 (거의 변경되지 않는 데이터)
  });
}
