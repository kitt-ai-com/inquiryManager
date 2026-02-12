"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/components/consultations/status-badge";
import { useMediums } from "@/hooks/use-mediums";
import { useCategories, useCreateCategory } from "@/hooks/use-categories";
import { useTags, useCreateTag } from "@/hooks/use-tags";
import { useClients, useCreateClient } from "@/hooks/use-clients";
import {
  CONSULTATION_STATUSES,
  type ConsultationWithRelations,
  type ConsultationStatus,
  type Client,
} from "@/types/database";
import { formatDate } from "@/lib/utils/date";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Check, Plus } from "lucide-react";

// ===== 공통 타입 =====
interface InlineCellProps {
  consultation: ConsultationWithRelations;
  onUpdate: (field: string, value: unknown) => void;
}

// ===== 상태 셀 =====
export function InlineStatusCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer">
          <StatusBadge status={consultation.status} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-32 p-1" align="start">
        {CONSULTATION_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={cn(
              "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
              consultation.status === s && "bg-accent"
            )}
            onClick={() => {
              if (s !== consultation.status) {
                onUpdate("status", s);
              }
              setOpen(false);
            }}
          >
            <StatusBadge status={s as ConsultationStatus} />
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ===== 문의일자 셀 =====
export function InlineDateCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);
  const currentDate = parseISO(consultation.consulted_at);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer hover:underline">
          {formatDate(consultation.consulted_at)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={(date) => {
            if (date) {
              const isoDate = new Date(
                Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
              ).toISOString();
              onUpdate("consulted_at", isoDate);
            }
            setOpen(false);
          }}
          locale={ko}
        />
      </PopoverContent>
    </Popover>
  );
}

// ===== 상담매체 셀 =====
export function InlineMediumCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);
  const { data: mediumsData } = useMediums();
  const mediums = mediumsData?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer">
          <Badge variant="outline">{consultation.medium?.name ?? "-"}</Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="start">
        {mediums.map((m) => (
          <button
            key={m.id}
            type="button"
            className={cn(
              "flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
              consultation.medium_id === m.id && "bg-accent"
            )}
            onClick={() => {
              if (m.id !== consultation.medium_id) {
                onUpdate("medium_id", m.id);
              }
              setOpen(false);
            }}
          >
            {m.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ===== 취급품목(태그) 셀 =====
export function InlineTagsCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: tagsData } = useTags();
  const createTag = useCreateTag();
  const tags = tagsData?.data ?? [];

  const selectedIds = consultation.tags.map((t) => t.id);

  const handleToggle = (tagId: string) => {
    const newIds = selectedIds.includes(tagId)
      ? selectedIds.filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    onUpdate("tag_ids", newIds);
  };

  const handleCreateTag = async () => {
    if (!search.trim()) return;
    try {
      const result = await createTag.mutateAsync({ name: search.trim() });
      const newTag = result.data;
      onUpdate("tag_ids", [...selectedIds, newTag.id]);
      setSearch("");
    } catch {
      // 에러는 mutation에서 처리
    }
  };

  const filteredTags = search
    ? tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : tags;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer text-left">
          {consultation.tags.length === 0 ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {consultation.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
              {consultation.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{consultation.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
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
                      selectedIds.includes(tag.id) ? "opacity-100" : "opacity-0"
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
  );
}

// ===== 문의품목(카테고리) 셀 - 다중 선택 =====
export function InlineCategoryCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: categoriesData } = useCategories();
  const createCategory = useCreateCategory();
  const categories = categoriesData?.data ?? [];

  const selectedIds = consultation.categories.map((c) => c.id);

  const handleToggle = (categoryId: string) => {
    const newIds = selectedIds.includes(categoryId)
      ? selectedIds.filter((id) => id !== categoryId)
      : [...selectedIds, categoryId];
    onUpdate("category_ids", newIds);
  };

  const handleCreateCategory = async () => {
    if (!search.trim()) return;
    try {
      const result = await createCategory.mutateAsync(search.trim());
      const newCategory = result.data;
      onUpdate("category_ids", [...selectedIds, newCategory.id]);
      setSearch("");
    } catch {
      // 에러는 mutation에서 처리
    }
  };

  const filteredCategories = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer text-left">
          {consultation.categories.length === 0 ? (
            <span className="text-muted-foreground">-</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {consultation.categories.slice(0, 2).map((cat) => (
                <Badge key={cat.id} variant="outline" className="text-xs">
                  {cat.name}
                </Badge>
              ))}
              {consultation.categories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{consultation.categories.length - 2}
                </Badge>
              )}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
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
                      selectedIds.includes(cat.id) ? "opacity-100" : "opacity-0"
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
  );
}

// ===== 상담내용 셀 =====
export function InlineContentCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(consultation.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setValue(consultation.content);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [open, consultation.content]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== consultation.content) {
      onUpdate("content", trimmed);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="block max-w-[300px] cursor-pointer truncate text-left hover:underline"
          title={consultation.content}
        >
          {consultation.content || "-"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-2" align="start">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSave();
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ===== 업체명 셀 =====
export function InlineClientCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: clientsData } = useClients(search || undefined);
  const createClient = useCreateClient();
  const clients = clientsData?.data ?? [];

  const handleCreateClient = async () => {
    if (!search.trim()) return;
    try {
      const result = await createClient.mutateAsync({ name: search.trim() });
      const newClient = result.data as Client;
      onUpdate("client_id", newClient.id);
      setSearch("");
      setOpen(false);
    } catch {
      // 에러는 mutation에서 처리
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer font-medium hover:underline">
          {consultation.client?.name ?? "-"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="업체명 검색..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  onSelect={() => {
                    if (client.id !== consultation.client_id) {
                      onUpdate("client_id", client.id);
                    }
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      consultation.client_id === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span>{client.name}</span>
                  {client.contact && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {client.contact}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {search.trim() && !clients.some((c) => c.name === search.trim()) && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateClient}
                    disabled={createClient.isPending}
                  >
                    <Plus className="mr-2 size-4" />
                    &quot;{search.trim()}&quot; 새 업체로 등록
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ===== 연락처 셀 =====
export function InlineContactCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(consultation.client?.contact ?? "");
  const valueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentContact = consultation.client?.contact ?? "";

  // valueRef를 항상 최신 value로 동기화
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (open) {
      setValue(currentContact);
      valueRef.current = currentContact;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, currentContact]);

  const handleSave = () => {
    const trimmed = valueRef.current.trim();
    if (trimmed !== currentContact) {
      onUpdate("client_contact", trimmed);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      if (!isOpen && open) {
        const trimmed = valueRef.current.trim();
        if (trimmed !== currentContact) {
          onUpdate("client_contact", trimmed);
        }
      }
      setOpen(isOpen);
    }}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer hover:underline">
          {consultation.client?.contact || "-"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 space-y-2" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Input
          ref={inputRef}
          placeholder="연락처 입력"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
            if (e.key === "Escape") {
              setValue(currentContact);
              valueRef.current = currentContact;
              setOpen(false);
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(currentContact);
              valueRef.current = currentContact;
              setOpen(false);
            }}
          >
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ===== 이메일 셀 =====
export function InlineEmailCell({ consultation, onUpdate }: InlineCellProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(consultation.client?.email ?? "");
  const valueRef = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentEmail = consultation.client?.email ?? "";

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (open) {
      setValue(currentEmail);
      valueRef.current = currentEmail;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, currentEmail]);

  const handleSave = () => {
    const trimmed = valueRef.current.trim();
    if (trimmed !== currentEmail) {
      onUpdate("client_email", trimmed);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
      if (!isOpen && open) {
        const trimmed = valueRef.current.trim();
        if (trimmed !== currentEmail) {
          onUpdate("client_email", trimmed);
        }
      }
      setOpen(isOpen);
    }}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer hover:underline">
          {consultation.client?.email || "-"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-2" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Input
          ref={inputRef}
          type="email"
          placeholder="이메일 입력"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
            if (e.key === "Escape") {
              setValue(currentEmail);
              valueRef.current = currentEmail;
              setOpen(false);
            }
          }}
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setValue(currentEmail);
              valueRef.current = currentEmail;
              setOpen(false);
            }}
          >
            취소
          </Button>
          <Button size="sm" onClick={handleSave}>
            저장
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
