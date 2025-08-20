
'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { eq, or } from 'drizzle-orm';
import { z } from 'zod';

import type { Settings, User } from '@/lib/types';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

// In-memory store for temporary login tokens
const tokenStore = new Map<string, { userId: string; expires: number }>();
const TOKEN_LIFETIME_MS = 60 * 1000; // 60 seconds

// --- Auth Actions ---

const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function registerUser(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const parsed = RegisterSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors.map((e) => e.message).join(', '),
    };
  }

  const { username, email, password } = parsed.data;

  const existingUser = await db.query.users.findFirst({
    where: or(eq(users.email, email), eq(users.username, username)),
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return { success: false, message: 'User with this email already exists.' };
    }
    if (existingUser.username === username) {
      return { success: false, message: 'Username is already taken.' };
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const defaultSettings: Settings = {
    theme: 'system',
    language: 'pl',
    hideLocked: false,
    colorTheme: 'default',
    groupByList: false,
    showCompleted: true,
    showTags: true,
    workMode: 'lists',
    devMode: false,
  };

  await db.insert(users).values({
    id: crypto.randomUUID(),
    username,
    email,
    passwordHash,
    settings: defaultSettings,
  });

  return { success: true, message: 'Registration successful!' };
}

const LoginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function loginUser(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const parsed = LoginSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: 'Invalid input.' };
  }

  const { identifier, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: or(eq(users.email, identifier), eq(users.username, identifier)),
  });

  if (!user) {
    return { success: false, message: 'Invalid credentials.' };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return { success: false, message: 'Invalid credentials.' };
  }

  const defaultSettings: Settings = {
    theme: 'system',
    language: 'pl',
    hideLocked: false,
    colorTheme: 'default',
    groupByList: false,
    showCompleted: true,
    showTags: true,
    workMode: 'lists',
    devMode: false,
  };

  const userResult: User = {
    id: user.id,
    username: user.username,
    settings: {
      ...defaultSettings,
      ...((user.settings as Settings) ?? {}),
    },
  };

  return { success: true, user: userResult };
}

export async function updateUserSettings(
  userId: string,
  settings: Partial<Settings>
) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    throw new Error('User not found');
  }

  const currentSettings = (user.settings as Settings) ?? {};
  const newSettings = { ...currentSettings, ...settings };

  await db.update(users).set({ settings: newSettings }).where(eq(users.id, userId));

  revalidatePath('/app');
  return { success: true, settings: newSettings };
}

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const parsed = ChangePasswordSchema.safeParse({
    currentPassword,
    newPassword,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors.map((e) => e.message).join(', '),
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    return { success: false, message: 'Incorrect current password.' };
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.id, userId));

  return { success: true, message: 'Password updated successfully.' };
}

// --- Temporary Token Actions ---

export async function generateTempLoginToken(userId: string) {
  if (!userId) {
    return { success: false, message: 'User not found' };
  }
  const token = crypto.randomUUID();
  const expires = Date.now() + TOKEN_LIFETIME_MS;

  tokenStore.set(token, { userId, expires });

  // Clean up expired tokens
  setTimeout(() => {
    tokenStore.delete(token);
  }, TOKEN_LIFETIME_MS);

  return { success: true, token };
}

export async function loginWithTempToken(token: string) {
  const tokenData = tokenStore.get(token);

  if (!tokenData || tokenData.expires < Date.now()) {
    tokenStore.delete(token);
    return { success: false, message: 'Token is invalid or has expired.' };
  }

  // Invalidate token immediately after use
  tokenStore.delete(token);

  const user = await db.query.users.findFirst({
    where: eq(users.id, tokenData.userId),
  });

  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const defaultSettings: Settings = {
    theme: 'system',
    language: 'pl',
    hideLocked: false,
    colorTheme: 'default',
    groupByList: false,
    showCompleted: true,
    showTags: true,
    workMode: 'lists',
    devMode: false,
  };

  const userResult: User = {
    id: user.id,
    username: user.username,
    settings: {
      ...defaultSettings,
      ...((user.settings as Settings) ?? {}),
    },
  };

  return { success: true, user: userResult };
}
