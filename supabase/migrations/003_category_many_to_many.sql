-- =============================================
-- 문의품목(category) 다대다 관계로 변경
-- 기존: consultations.category_id (1:N)
-- 변경: consultation_categories 조인 테이블 (M:N)
-- =============================================

-- 1. 조인 테이블 생성
CREATE TABLE consultation_categories (
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES item_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (consultation_id, category_id)
);

-- 2. 기존 category_id 데이터를 조인 테이블로 마이그레이션
INSERT INTO consultation_categories (consultation_id, category_id)
SELECT id, category_id FROM consultations WHERE category_id IS NOT NULL;

-- 3. consultations 테이블에서 category_id 컬럼 제거
ALTER TABLE consultations DROP COLUMN category_id;

-- 4. 기존 인덱스 자동 삭제됨 (idx_consultations_category_id)
