// ===== 상담 상태 =====
export const CONSULTATION_STATUSES = ["접수", "진행", "완료", "보류"] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

// ===== 매체 (Medium) =====
export interface Medium {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

// ===== 품목 카테고리 (Item Category) =====
export interface ItemCategory {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

// ===== 태그 (Tag) =====
export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

// ===== 업체 (Client) =====
export interface Client {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

// ===== 상담 내역 (Consultation) =====
export interface Consultation {
  id: string;
  consulted_at: string;
  medium_id: string;
  client_id: string;
  content: string;
  status: ConsultationStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// 조인 데이터 포함 상담 내역
export interface ConsultationWithRelations extends Consultation {
  medium: Medium;
  client: Client;
  categories: ItemCategory[];
  tags: Tag[];
}

// ===== API 요청/응답 타입 =====
export interface ConsultationCreateInput {
  consulted_at: string;
  medium_id: string;
  client_id: string;
  category_ids?: string[];
  content: string;
  status?: ConsultationStatus;
  tag_ids?: string[];
}

export interface ConsultationUpdateInput {
  consulted_at?: string;
  medium_id?: string;
  client_id?: string;
  category_ids?: string[];
  content?: string;
  status?: ConsultationStatus;
  tag_ids?: string[];
}

export interface ClientCreateInput {
  name: string;
  contact?: string;
  address?: string;
}

export interface TagCreateInput {
  name: string;
}

// ===== 필터 타입 =====
export interface ConsultationFilters {
  search?: string;
  medium_id?: string;
  category_id?: string;
  status?: ConsultationStatus;
  date?: string;
  page?: number;
  limit?: number;
}
