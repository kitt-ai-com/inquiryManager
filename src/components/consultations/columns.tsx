"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { ConsultationWithRelations } from "@/types/database";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  InlineStatusCell,
  InlineDateCell,
  InlineMediumCell,
  InlineTagsCell,
  InlineCategoryCell,
  InlineContentCell,
  InlineClientCell,
  InlineContactCell,
  InlineEmailCell,
} from "@/components/consultations/inline-cells";

interface ColumnActions {
  onEdit?: (consultation: ConsultationWithRelations) => void;
  onDelete?: (consultation: ConsultationWithRelations) => void;
}

type UpdateFieldFn = (id: string, field: string, value: unknown) => void;

function getUpdateField(meta: unknown): UpdateFieldFn | undefined {
  return (meta as Record<string, unknown>)?.updateField as UpdateFieldFn | undefined;
}

export function getColumns(
  actions?: ColumnActions
): ColumnDef<ConsultationWithRelations>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="전체 선택"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="행 선택"
        />
      ),
      size: 40,
      enableSorting: false,
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineStatusCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
      size: 80,
    },
    {
      accessorKey: "consulted_at",
      header: "문의일자",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineDateCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
      size: 110,
    },
    {
      id: "medium",
      header: "상담매체",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineMediumCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
      size: 100,
    },
    {
      id: "tags",
      header: "취급품목",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineTagsCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
      size: 150,
    },
    {
      id: "category",
      header: "문의품목",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineCategoryCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
      size: 150,
    },
    {
      accessorKey: "content",
      header: "상담내용",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineContentCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
    },
    {
      id: "client",
      header: "업체명",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineClientCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
      size: 120,
    },
    {
      id: "contact",
      header: "연락처",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineContactCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
      size: 130,
    },
    {
      id: "email",
      header: "이메일",
      cell: ({ row, table }) => {
        const updateField = getUpdateField(table.options.meta);
        return (
          <InlineEmailCell
            consultation={row.original}
            onUpdate={(field, value) => updateField?.(row.original.id, field, value)}
          />
        );
      },
      size: 180,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => actions?.onEdit?.(row.original)}
            >
              <Pencil className="mr-2 size-4" />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => actions?.onDelete?.(row.original)}
            >
              <Trash2 className="mr-2 size-4" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 50,
    },
  ];
}
