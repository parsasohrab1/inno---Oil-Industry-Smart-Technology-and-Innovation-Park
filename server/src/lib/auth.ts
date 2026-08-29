import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Role, User } from '../types.ts'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me'
const JWT_TTL = process.env.JWT_TTL ?? '7d'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export interface TokenPayload {
  sub: string
  role: Role
  companyId: string | null
  name: string
}

export function signToken(user: User): string {
  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    companyId: user.companyId,
    name: user.name,
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_TTL } as jwt.SignOptions)
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload
}
