import { z } from "zod/v4";

// 상담 상태
const consultationStatus = z.enum(["접수", "진행", "완료", "보류"]);

// 상담 생성 스키마
export const createConsultationSchema = z.object({
  consulted_at: z.iso.datetime({ message: "올바른 날짜 형식이 아닙니다" }),
  medium_id: z.uuid({ message: "매체를 선택해주세요" }),
  client_id: z.uuid({ message: "업체를 선택해주세요" }),
  category_ids: z.array(z.uuid()).optional().default([]),
  content: z.string().min(1, "상담 내용을 입력해주세요"),
  status: consultationStatus.optional().default("접수"),
  tag_ids: z.array(z.uuid()).optional().default([]),
});

// 상담 수정 스키마
export const updateConsultationSchema = z.object({
  consulted_at: z.iso.datetime().optional(),
  medium_id: z.uuid().optional(),
  client_id: z.uuid().optional(),
  category_ids: z.array(z.uuid()).optional(),
  content: z.string().min(1, "상담 내용을 입력해주세요").optional(),
  status: consultationStatus.optional(),
  tag_ids: z.array(z.uuid()).optional(),
});

// 업체 생성 스키마
export const createClientSchema = z.object({
  name: z.string().min(1, "업체명을 입력해주세요"),
  contact: z.string().optional(),
  address: z.string().optional(),
});

// 태그 생성 스키마
export const createTagSchema = z.object({
  name: z.string().min(1, "태그명을 입력해주세요").max(50, "태그명은 50자 이하여야 합니다"),
});

// 필터 스키마
export const consultationFiltersSchema = z.object({
  search: z.string().optional(),
  medium_id: z.uuid().optional(),
  category_id: z.uuid().optional(),
  status: consultationStatus.optional(),
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type ConsultationFiltersInput = z.infer<typeof consultationFiltersSchema>;
