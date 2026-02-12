-- 기존 카테고리 삭제 (참조하는 상담이 없으므로 안전)
DELETE FROM item_categories;

-- 실제 품목 카테고리 삽입
INSERT INTO item_categories (name) VALUES
  ('에어셀'),
  ('아이스팩'),
  ('에어완충재'),
  ('종이포장재'),
  ('에어쿠션'),
  ('보냉백'),
  ('박스'),
  ('테이프');
