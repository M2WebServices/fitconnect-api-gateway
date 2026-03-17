import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getPrismaClient } from '../database/client';
import { cacheSet, cacheGet, cacheDelete } from '../cache/redis';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export interface UserPayload {
  id: string;
  email: string;
  pseudo: string;
}

export interface SignUpInput {
  email: string;
  pseudo: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  userId: string;
  email?: string;
  pseudo?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  pseudo: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Sign up a new user
 */
export async function signUp(input: SignUpInput): Promise<UserPayload> {
  const prisma = getPrismaClient();

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingEmail) {
    throw new Error('Email already registered');
  }

  // Check if pseudo already exists
  const existingPseudo = await prisma.user.findUnique({
    where: { pseudo: input.pseudo },
  });

  if (existingPseudo) {
    throw new Error('Pseudo already taken');
  }

  // Hash password
  const passwordHash = await hashPassword(input.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: input.email,
      pseudo: input.pseudo,
      passwordHash,
    },
  });

  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
  };
}

/**
 * Sign in a user
 */
export async function signIn(input: SignInInput): Promise<{ user: UserPayload; token: string }> {
  const prisma = getPrismaClient();

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const passwordMatch = await comparePassword(input.password, user.passwordHash);

  if (!passwordMatch) {
    throw new Error('Invalid email or password');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    pseudo: user.pseudo,
  });

  // Cache token
  await cacheSet(`token:${token}`, user.id, 7 * 24 * 60 * 60); // 7 days

  return {
    user: {
      id: user.id,
      email: user.email,
      pseudo: user.pseudo,
    },
    token,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<UserPayload | null> {
  const prisma = getPrismaClient();

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    pseudo: user.pseudo,
  };
}

/**
 * Update user profile fields (email and/or pseudo)
 */
export async function updateUserProfile(input: UpdateProfileInput): Promise<UserPayload> {
  const prisma = getPrismaClient();

  const current = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!current) {
    throw new Error("User not found");
  }

  const nextEmail = input.email?.trim();
  const nextPseudo = input.pseudo?.trim();

  if (nextEmail && nextEmail !== current.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: nextEmail } });
    if (existingEmail && existingEmail.id !== input.userId) {
      throw new Error("Email already registered");
    }
  }

  if (nextPseudo && nextPseudo !== current.pseudo) {
    const existingPseudo = await prisma.user.findUnique({ where: { pseudo: nextPseudo } });
    if (existingPseudo && existingPseudo.id !== input.userId) {
      throw new Error("Pseudo already taken");
    }
  }

  const updated = await prisma.user.update({
    where: { id: input.userId },
    data: {
      email: nextEmail ?? current.email,
      pseudo: nextPseudo ?? current.pseudo,
    },
  });

  if (!updated) {
    throw new Error("User not found");
  }

  return {
    id: updated.id,
    email: updated.email,
    pseudo: updated.pseudo,
  };
}

/**
 * Invalidate token (logout)
 */
export async function invalidateToken(token: string): Promise<void> {
  await cacheDelete(`token:${token}`);
  const payload = verifyToken(token);
  if (payload) {
    // Cache invalidated token to prevent reuse during its lifetime
    await cacheSet(`invalidated:${token}`, 'true', 7 * 24 * 60 * 60);
  }
}

/**
 * Check if token is invalidated
 */
export async function isTokenInvalidated(token: string): Promise<boolean> {
  const cached = await cacheGet(`invalidated:${token}`);
  return cached !== null;
}

/**
 * Validate token
 */
export async function validateToken(token: string): Promise<TokenPayload | null> {
  // Check if token is invalidated
  const invalidated = await isTokenInvalidated(token);
  if (invalidated) {
    return null;
  }

  // Verify token signature and expiration
  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  // Keep payload values in sync with latest profile updates.
  const user = await getUserById(payload.userId);
  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    pseudo: user.pseudo,
  };
}
