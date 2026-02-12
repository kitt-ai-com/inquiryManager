"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataTablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  selectedCount: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  page,
  pageCount,
  total,
  selectedCount,
  onPageChange,
}: DataTablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {selectedCount > 0 ? (
          <span>{selectedCount}건 선택됨</span>
        ) : (
          <span>총 {total}건</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-sm text-muted-foreground">
          {page} / {pageCount || 1} 페이지
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(pageCount)}
          disabled={page >= pageCount}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
