import { hash, verify } from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    type: 2, // argon2id
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

export async function verifyPassword(password: string, hash_: string): Promise<boolean> {
  try {
    return await verify(hash_, password);
  } catch {
    return false;
  }
}
