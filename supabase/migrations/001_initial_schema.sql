-- =============================================
-- CS Manager - 초기 DB 스키마
-- =============================================

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. 매체 (Mediums) 테이블
-- =============================================
CREATE TABLE mediums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 2. 품목 카테고리 (Item Categories) 테이블
-- =============================================
CREATE TABLE item_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 3. 태그 (Tags) 테이블
-- =============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4. 업체 (Clients) 테이블
-- =============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 5. 상담 내역 (Consultations) 테이블
-- =============================================
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulted_at TIMESTAMPTZ NOT NULL,
  medium_id UUID NOT NULL REFERENCES mediums(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  category_id UUID REFERENCES item_categories(id),
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '접수',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- 6. 상담-태그 다대다 (Consultation Tags) 테이블
-- =============================================
CREATE TABLE consultation_tags (
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (consultation_id, tag_id)
);

-- =============================================
-- 인덱스
-- =============================================
CREATE INDEX idx_consultations_consulted_at ON consultations(consulted_at DESC);
CREATE INDEX idx_consultations_client_id ON consultations(client_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_medium_id ON consultations(medium_id);
CREATE INDEX idx_consultations_deleted_at ON consultations(deleted_at);
CREATE INDEX idx_consultations_category_id ON consultations(category_id);
CREATE INDEX idx_clients_name ON clients(name);

-- =============================================
-- updated_at 자동 갱신 트리거
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_consultations_updated_at
  BEFORE UPDATE ON consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 시드 데이터: 기본 매체
-- =============================================
INSERT INTO mediums (name) VALUES
  ('전화'),
  ('채널톡'),
  ('메일'),
  ('카카오톡'),
  ('기타');

-- =============================================
-- 시드 데이터: 기본 품목 카테고리 (예시)
-- =============================================
INSERT INTO item_categories (name) VALUES
  ('일반 문의'),
  ('제품 문의'),
  ('배송 문의'),
  ('교환/반품'),
  ('기타');
