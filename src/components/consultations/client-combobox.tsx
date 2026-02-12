"use client";

import { useState } from "react";
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
import { useClients, useCreateClient } from "@/hooks/use-clients";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Client } from "@/types/database";

interface ClientComboboxProps {
  value: string | null;
  onChange: (clientId: string, client: Client) => void;
}

export function ClientCombobox({ value, onChange }: ClientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: clientsData } = useClients(search || undefined);
  const createClient = useCreateClient();

  const clients = clientsData?.data ?? [];
  const selectedClient = clients.find((c) => c.id === value);

  const handleCreateClient = async () => {
    if (!search.trim()) return;
    try {
      const result = await createClient.mutateAsync({ name: search.trim() });
      const newClient = result.data as Client;
      onChange(newClient.id, newClient);
      setSearch("");
      setOpen(false);
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedClient?.name ?? "업체를 선택하세요"}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="업체명 검색..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              검색 결과가 없습니다
            </CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  onSelect={() => {
                    onChange(client.id, client);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === client.id ? "opacity-100" : "opacity-0"
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
