/**
 * 비밀번호 해싱 유틸. 신규 해시는 argon2(표준), 검증은 argon2 + 레거시 bcrypt 동시 지원.
 * 기존 사용자의 bcrypt 해시($2*)는 마이그레이션 없이 계속 로그인되며, 새 비밀번호만 argon2로 저장된다.
 */
export async function hashPassword(password: string): Promise<string> {
  const argon2 = await import('argon2');
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (hash.startsWith('$argon2')) {
    const argon2 = await import('argon2');
    return argon2.verify(hash, password);
  }
  // 레거시 bcrypt 해시 검증 (전환기 폴백).
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}
