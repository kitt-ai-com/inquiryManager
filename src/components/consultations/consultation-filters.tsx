"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useMediums } from "@/hooks/use-mediums";
import { useCategories } from "@/hooks/use-categories";
import { CONSULTATION_STATUSES, type ConsultationFilters } from "@/types/database";
import { CategoryManager } from "@/components/consultations/category-manager";
import { CalendarIcon, Search, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ConsultationFiltersProps {
  filters: ConsultationFilters;
  onFiltersChange: (filters: ConsultationFilters) => void;
}

export function ConsultationFiltersToolbar({
  filters,
  onFiltersChange,
}: ConsultationFiltersProps) {
  const { data: mediumsData } = useMediums();
  const { data: categoriesData } = useCategories();

  const mediums = mediumsData?.data ?? [];
  const categories = categoriesData?.data ?? [];

  // 디바운스 검색
  const [searchValue, setSearchValue] = useState(filters.search ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (filters.search ?? "")) {
        onFiltersChange({ ...filters, search: searchValue || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActiveFilters =
    filters.search ||
    filters.medium_id ||
    filters.category_id ||
    filters.status ||
    filters.date_from ||
    filters.date_to;

  const handleReset = () => {
    setSearchValue("");
    onFiltersChange({ page: 1, limit: filters.limit });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 검색 */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="업체명 또는 상담내용 검색..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 매체 필터 */}
      <Select
        value={filters.medium_id ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            medium_id: value === "all" ? undefined : value,
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="매체" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 매체</SelectItem>
          {mediums.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 카테고리 필터 + 관리 버튼 */}
      <div className="flex items-center gap-1">
        <Select
          value={filters.category_id ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              category_id: value === "all" ? undefined : value,
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="문의품목" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 품목</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CategoryManager />
      </div>

      {/* 상태 필터 */}
      <Select
        value={filters.status ?? "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === "all" ? undefined : (value as ConsultationFilters["status"]),
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="상태" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 상태</SelectItem>
          {CONSULTATION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 시작일 */}
      <DatePickerFilter
        value={filters.date_from}
        onChange={(date) =>
          onFiltersChange({ ...filters, date_from: date, page: 1 })
        }
        placeholder="시작일"
      />

      {/* 종료일 */}
      <DatePickerFilter
        value={filters.date_to}
        onChange={(date) =>
          onFiltersChange({ ...filters, date_to: date, page: 1 })
        }
        placeholder="종료일"
      />

      {/* 필터 초기화 */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <X className="mr-1 size-4" />
          초기화
        </Button>
      )}
    </div>
  );
}

// 날짜 선택 서브 컴포넌트
function DatePickerFilter({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (date?: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 w-[130px] justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value ? format(parseISO(value), "yyyy-MM-dd") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : undefined);
            setOpen(false);
          }}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  );
}
