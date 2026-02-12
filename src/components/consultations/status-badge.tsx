"use client";

import { Badge } from "@/components/ui/badge";
import type { ConsultationStatus } from "@/types/database";

const STATUS_CONFIG: Record<
  ConsultationStatus,
  { label: string; className: string }
> = {
  접수: {
    label: "접수",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
  },
  진행: {
    label: "진행",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300",
  },
  완료: {
    label: "완료",
    className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300",
  },
  보류: {
    label: "보류",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
};

interface StatusBadgeProps {
  status: ConsultationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
