import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), "yyyy-MM-dd", { locale: ko });
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), "yyyy-MM-dd HH:mm", { locale: ko });
}
