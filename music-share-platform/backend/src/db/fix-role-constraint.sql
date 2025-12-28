-- users 테이블 role 제약조건 수정
-- partner 역할 추가

-- 기존 제약조건 삭제
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 새 제약조건 추가 (user, admin, partner 허용)
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('user', 'admin', 'partner'));

-- 확인
SELECT 'Role constraint updated successfully!' as status;
