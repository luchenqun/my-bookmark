import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

export function md5(value: string): string {
  return createHash('md5').update(value).digest('hex');
}

export function isLegacyMd5(hash: string): boolean {
  return /^[a-f0-9]{32}$/i.test(hash);
}

function verifyScryptPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(':');
  if (!salt || !storedHash) {
    return false;
  }

  const inputHash = scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, 'hex');

  if (inputHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(inputHash, expectedHash);
}

export async function verifyPassword(password: string, passwordHash: string, passwordAlgo: string) {
  if (passwordAlgo === 'md5_legacy') {
    return {
      valid: md5(password) === passwordHash,
      nextHash: await hashPassword(password),
      nextAlgo: 'scrypt'
    };
  }

  return {
    valid: verifyScryptPassword(password, passwordHash),
    nextHash: null,
    nextAlgo: null
  };
}
