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
import { useTags, useCreateTag } from "@/hooks/use-tags";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagMultiSelectProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagMultiSelect({ value, onChange }: TagMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: tagsData } = useTags();
  const createTag = useCreateTag();

  const tags = tagsData?.data ?? [];
  const selectedTags = tags.filter((t) => value.includes(t.id));

  const handleToggle = (tagId: string) => {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  };

  const handleRemove = (tagId: string) => {
    onChange(value.filter((id) => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!search.trim()) return;
    try {
      const result = await createTag.mutateAsync({ name: search.trim() });
      const newTag = result.data;
      onChange([...value, newTag.id]);
      setSearch("");
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  const filteredTags = search
    ? tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tags;

  return (
    <div className="space-y-2">
      {/* 선택된 태그 표시 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemove(tag.id)}
                className="rounded-full hover:bg-muted-foreground/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 태그 선택 드롭다운 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedTags.length > 0
              ? `${selectedTags.length}개 선택됨`
              : "취급품목 선택"}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="태그 검색..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.id}
                    onSelect={() => handleToggle(tag.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value.includes(tag.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {search.trim() &&
                !tags.some(
                  (t) => t.name.toLowerCase() === search.trim().toLowerCase()
                ) && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreateTag}
                        disabled={createTag.isPending}
                      >
                        <Plus className="mr-2 size-4" />
                        &quot;{search.trim()}&quot; 새 태그로 추가
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
