"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ClientCombobox } from "@/components/consultations/client-combobox";
import { TagMultiSelect } from "@/components/consultations/tag-multi-select";
import { CategoryMultiSelect } from "@/components/consultations/category-multi-select";
import { useMediums } from "@/hooks/use-mediums";
import {
  useCreateConsultation,
  useUpdateConsultation,
} from "@/hooks/use-consultations";
import { useUpdateClient } from "@/hooks/use-clients";
import {
  CONSULTATION_STATUSES,
  type ConsultationWithRelations,
  type Client,
} from "@/types/database";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConsultationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultation?: ConsultationWithRelations | null;
}

interface FormData {
  status: string;
  consulted_at: string;
  medium_id: string;
  tag_ids: string[];
  category_ids: string[];
  content: string;
  client_id: string;
  contact: string;
  email: string;
}

const initialFormData: FormData = {
  status: "접수",
  consulted_at: new Date().toISOString().split("T")[0],
  medium_id: "",
  tag_ids: [],
  category_ids: [],
  content: "",
  client_id: "",
  contact: "",
  email: "",
};

export function ConsultationFormDialog({
  open,
  onOpenChange,
  consultation,
}: ConsultationFormDialogProps) {
  const isEdit = !!consultation;
  const [form, setForm] = useState<FormData>(initialFormData);
  const [dateOpen, setDateOpen] = useState(false);

  const { data: mediumsData } = useMediums();
  const createConsultation = useCreateConsultation();
  const updateConsultation = useUpdateConsultation();
  const updateClient = useUpdateClient();

  const mediums = mediumsData?.data ?? [];

  const isPending = createConsultation.isPending || updateConsultation.isPending || updateClient.isPending;

  // 수정 모드: 기존 데이터로 폼 초기화
  useEffect(() => {
    if (open && consultation) {
      setForm({
        status: consultation.status,
        consulted_at: consultation.consulted_at.split("T")[0],
        medium_id: consultation.medium_id,
        tag_ids: consultation.tags.map((t) => t.id),
        category_ids: consultation.categories.map((c) => c.id),
        content: consultation.content,
        client_id: consultation.client_id,
        contact: consultation.client?.contact ?? "",
        email: consultation.client?.email ?? "",
      });
    } else if (open && !consultation) {
      setForm(initialFormData);
    }
  }, [open, consultation]);

  const handleClientChange = (clientId: string, client: Client) => {
    setForm((prev) => ({
      ...prev,
      client_id: clientId,
      contact: client.contact ?? "",
      email: client.email ?? "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.medium_id) {
      toast.error("상담매체를 선택해주세요");
      return;
    }
    if (!form.client_id) {
      toast.error("업체를 선택해주세요");
      return;
    }
    if (!form.content.trim()) {
      toast.error("상담내용을 입력해주세요");
      return;
    }

    try {
      const consulted_at = new Date(form.consulted_at).toISOString();

      if (isEdit) {
        await updateConsultation.mutateAsync({
          id: consultation!.id,
          consulted_at,
          medium_id: form.medium_id,
          client_id: form.client_id,
          category_ids: form.category_ids,
          content: form.content.trim(),
          status: form.status as "접수" | "진행" | "완료" | "보류",
          tag_ids: form.tag_ids,
        });
        toast.success("상담 내역이 수정되었습니다");
      } else {
        await createConsultation.mutateAsync({
          consulted_at,
          medium_id: form.medium_id,
          client_id: form.client_id,
          category_ids: form.category_ids,
          content: form.content.trim(),
          status: form.status as "접수" | "진행" | "완료" | "보류",
          tag_ids: form.tag_ids,
        });
        toast.success("새 상담이 등록되었습니다");
      }

      // 연락처/이메일이 변경되었으면 clients 테이블 업데이트
      const originalContact = consultation?.client?.contact ?? "";
      const originalEmail = consultation?.client?.email ?? "";
      const hasContactChange = form.contact.trim() !== originalContact;
      const hasEmailChange = form.email.trim() !== originalEmail;

      if (hasContactChange || hasEmailChange) {
        await updateClient.mutateAsync({
          id: form.client_id,
          ...(hasContactChange && { contact: form.contact.trim() }),
          ...(hasEmailChange && { email: form.email.trim() }),
        });
      }

      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "저장에 실패했습니다");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "상담 수정" : "새 상담 등록"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 1행: 상태 + 문의일자 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSULTATION_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>문의일자</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !form.consulted_at && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {form.consulted_at
                      ? format(parseISO(form.consulted_at), "yyyy-MM-dd")
                      : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.consulted_at ? parseISO(form.consulted_at) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setForm((prev) => ({
                          ...prev,
                          consulted_at: format(date, "yyyy-MM-dd"),
                        }));
                      }
                      setDateOpen(false);
                    }}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 2행: 상담매체 */}
          <div className="space-y-2">
            <Label>상담매체 *</Label>
            <Select
              value={form.medium_id}
              onValueChange={(v) => setForm((prev) => ({ ...prev, medium_id: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="매체 선택" />
              </SelectTrigger>
              <SelectContent>
                {mediums.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3행: 취급품목 (태그) */}
          <div className="space-y-2">
            <Label>취급품목</Label>
            <TagMultiSelect
              value={form.tag_ids}
              onChange={(ids) => setForm((prev) => ({ ...prev, tag_ids: ids }))}
            />
          </div>

          {/* 4행: 문의품목 (카테고리 다중 선택) */}
          <div className="space-y-2">
            <Label>문의품목</Label>
            <CategoryMultiSelect
              value={form.category_ids}
              onChange={(ids) => setForm((prev) => ({ ...prev, category_ids: ids }))}
            />
          </div>

          {/* 5행: 업체명 */}
          <div className="space-y-2">
            <Label>업체명 *</Label>
            <ClientCombobox
              value={form.client_id || null}
              onChange={handleClientChange}
            />
          </div>

          {/* 6행: 연락처 + 이메일 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>연락처</Label>
              <Input
                placeholder="연락처 입력"
                value={form.contact}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, contact: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>이메일</Label>
              <Input
                type="email"
                placeholder="이메일 입력"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>

          {/* 6행: 상담내용 */}
          <div className="space-y-2">
            <Label>상담내용 *</Label>
            <Textarea
              placeholder="상담 내용을 입력하세요"
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "저장 중..." : isEdit ? "수정" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
