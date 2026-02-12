"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useCategories, useCreateCategory } from "@/hooks/use-categories";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryMultiSelectProps {
  value: string[];
  onChange: (categoryIds: string[]) => void;
}

export function CategoryMultiSelect({ value, onChange }: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: categoriesData } = useCategories();
  const createCategory = useCreateCategory();

  const categories = categoriesData?.data ?? [];
  const selectedCategories = categories.filter((c) => value.includes(c.id));

  const handleToggle = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onChange(value.filter((id) => id !== categoryId));
    } else {
      onChange([...value, categoryId]);
    }
  };

  const handleRemove = (categoryId: string) => {
    onChange(value.filter((id) => id !== categoryId));
  };

  const handleCreateCategory = async () => {
    if (!search.trim()) return;
    try {
      const result = await createCategory.mutateAsync(search.trim());
      const newCategory = result.data;
      onChange([...value, newCategory.id]);
      setSearch("");
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const filteredCategories = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <div className="space-y-2">
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCategories.map((cat) => (
            <Badge key={cat.id} variant="outline" className="gap-1">
              {cat.name}
              <button
                type="button"
                onClick={() => handleRemove(cat.id)}
                className="rounded-full hover:bg-muted-foreground/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedCategories.length > 0
              ? `${selectedCategories.length}개 선택됨`
              : "문의품목 선택"}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="품목 검색..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((cat) => (
                  <CommandItem
                    key={cat.id}
                    value={cat.id}
                    onSelect={() => handleToggle(cat.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value.includes(cat.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {cat.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() &&
                !categories.some(
                  (c) => c.name.toLowerCase() === search.trim().toLowerCase()
                ) && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreateCategory}
                        disabled={createCategory.isPending}
                      >
                        <Plus className="mr-2 size-4" />
                        &quot;{search.trim()}&quot; 새 품목으로 추가
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
