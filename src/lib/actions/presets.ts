
'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { eq, and, asc, sql, or, isNull } from 'drizzle-orm';

import type { Preset, PrivacyType } from '@/lib/types';
import { db } from '@/lib/db';
import { presets, userPresetAccess } from '@/lib/db/schema';

// --- Preset Actions ---

export async function getPresets(
  userId: string | null = null,
  hideLocked: boolean = false
): Promise<Preset[]> {
  const isPrivate = (type: PrivacyType | null) => type === 'private';
  
  if (!userId) {
    const query = db
      .select({
        id: presets.id,
        name: presets.name,
        color: presets.color,
        createdAt: presets.createdAt,
        orderPosition: presets.orderPosition,
        type: presets.type,
      })
      .from(presets)
      // Exclude personal presets when not logged in
      .where(or(eq(presets.type, 'public'), eq(presets.type, 'private'), isNull(presets.type)))
      .orderBy(asc(presets.orderPosition));

    if (hideLocked) {
      query.where(eq(presets.type, 'public'));
    }

    const publicPresets = await query;
    return publicPresets.map((p) => ({
      ...p,
      id: p.id.toString(),
      created_at: p.createdAt?.toISOString() ?? new Date().toISOString(),
      has_access: !isPrivate(p.type),
      order_position: p.orderPosition ?? 0,
      type: p.type ?? 'public',
    }));
  }

  const allPresets = await db
    .select({
      id: presets.id,
      name: presets.name,
      color: presets.color,
      createdAt: presets.createdAt,
      orderPosition: presets.orderPosition,
      type: presets.type,
      ownerId: presets.owner_id,
      accessGranted:
        sql<boolean>`CASE WHEN ${userPresetAccess.userId} IS NOT NULL THEN TRUE ELSE FALSE END`.mapWith(
          Boolean
        ),
    })
    .from(presets)
    .leftJoin(
      userPresetAccess,
      and(
        eq(userPresetAccess.presetId, presets.id),
        eq(userPresetAccess.userId, userId)
      )
    )
    .where(
        // Return public/private presets OR personal presets owned by the current user
        or(
            eq(presets.type, 'public'),
            eq(presets.type, 'private'),
            isNull(presets.type),
            and(eq(presets.type, 'personal'), eq(presets.owner_id, userId))
        )
    )
    .orderBy(asc(presets.orderPosition));

  const result = allPresets.map((p) => ({
    ...p,
    id: p.id.toString(),
    created_at: p.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access: !isPrivate(p.type) || p.accessGranted || p.ownerId === userId,
    order_position: p.orderPosition ?? 0,
    type: p.type ?? 'public',
  }));

  if (hideLocked) {
    return result.filter((p) => p.has_access);
  }

  return result;
}

export async function addPreset(
  name: string,
  color: string,
  type: PrivacyType,
  password?: string,
  userId?: string | null
): Promise<Preset> {
  const isPrivate = type === 'private';
  const passwordHash = isPrivate && password ? await bcrypt.hash(password, 10) : null;

  const [maxOrderResult] = await db
    .select({ max: sql<number>`max(${presets.orderPosition})` })
    .from(presets);
  const maxOrder = (maxOrderResult.max ?? -1) as number;

  const [newPreset] = await db
    .insert(presets)
    .values({
      id: crypto.randomUUID(),
      name,
      color,
      passwordHash,
      orderPosition: maxOrder + 1,
      type,
      owner_id: type === 'personal' ? userId : null,
    })
    .returning();

  if (isPrivate && userId) {
    await db
      .insert(userPresetAccess)
      .values({ userId, presetId: newPreset.id })
      .onConflictDoNothing();
  }

  revalidatePath('/app');
  return {
    ...newPreset,
    id: newPreset.id.toString(),
    created_at: newPreset.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access: !isPrivate || !!userId,
    order_position: newPreset.orderPosition ?? 0,
    type: newPreset.type ?? 'public',
  };
}

export async function updatePreset(
  id: string,
  name: string,
  color: string,
  type: PrivacyType,
  currentPassword?: string,
  newPassword?: string,
  userId?: string | null
) {
  const preset = await db.query.presets.findFirst({ where: eq(presets.id, id) });
  if (!preset) {
    return { success: false, message: 'Preset not found.' };
  }

  if (preset.type === 'personal' && preset.owner_id !== userId) {
      return { success: false, message: 'You do not have permission to edit this preset.' };
  }

  const isPrivate = type === 'private';

  if (preset.type === 'private') {
    if (!currentPassword) {
      return {
        success: false,
        message: 'Current password is required to edit a private preset.',
      };
    }
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      preset.passwordHash!
    );
    if (!isPasswordValid) {
      return { success: false, message: 'Incorrect current password.' };
    }
  }

  let passwordHash: string | null | undefined = undefined;
  if (isPrivate && newPassword) {
    passwordHash = await bcrypt.hash(newPassword, 10);
  } else if (!isPrivate) {
    passwordHash = null;
  }

  if (passwordHash !== undefined) {
    await db.delete(userPresetAccess).where(eq(userPresetAccess.presetId, id));
    if (userId) {
      await db
        .insert(userPresetAccess)
        .values({ userId, presetId: id })
        .onConflictDoNothing();
    }
  }

  const [updatedPreset] = await db
    .update(presets)
    .set({
      name,
      color,
      type,
      owner_id: type === 'personal' ? userId : (preset.type === 'personal' ? null : preset.owner_id),
      ...(passwordHash !== undefined && { passwordHash }),
    })
    .where(eq(presets.id, id))
    .returning();

  revalidatePath('/app');

  const result: Preset = {
    ...updatedPreset,
    id: updatedPreset.id.toString(),
    created_at: updatedPreset.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access:
      updatedPreset.type !== 'private' ||
      (!!userId &&
        (await db.query.userPresetAccess.findFirst({
          where: and(
            eq(userPresetAccess.userId, userId),
            eq(userPresetAccess.presetId, id)
          ),
        })) !== undefined),
    order_position: updatedPreset.orderPosition ?? 0,
    type: updatedPreset.type ?? 'public',
  };

  return { success: true, preset: result };
}

export async function deletePreset(
  id: string,
  password?: string,
  userId?: string | null
): Promise<{ success: boolean; message?: string }> {
  const preset = await db.query.presets.findFirst({ where: eq(presets.id, id) });
  if (!preset) {
    return { success: false, message: 'Preset not found.' };
  }

  if (preset.type === 'personal' && preset.owner_id !== userId) {
      return { success: false, message: 'You do not have permission to delete this preset.' };
  }

  if (preset.type === 'private') {
    if (!password) {
      return {
        success: false,
        message: 'Hasło jest wymagane do usunięcia prywatnego presetu.',
      };
    }
    if (!preset.passwordHash) {
      return {
        success: false,
        message: 'Preset jest prywatny, ale nie ma ustawionego hasła.',
      };
    }
    const isPasswordValid = await bcrypt.compare(password, preset.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Nieprawidłowe hasło.' };
    }
  }

  await db.delete(presets).where(eq(presets.id, id));
  revalidatePath('/app');
  return { success: true };
}

export async function verifyPresetPassword(
  presetId: string,
  password: string,
  userId: string | null
): Promise<{ success: boolean }> {
  if (!password) {
    return { success: false };
  }
  const preset = await db.query.presets.findFirst({
    where: eq(presets.id, presetId),
  });

  if (!preset || preset.type !== 'private' || !preset.passwordHash) {
    return { success: preset ? preset.type !== 'private' : false };
  }

  const isPasswordValid = await bcrypt.compare(password, preset.passwordHash);

  if (isPasswordValid && userId) {
    await db
      .insert(userPresetAccess)
      .values({ userId, presetId })
      .onConflictDoNothing();
  }

  revalidatePath('/app');
  return { success: isPasswordValid };
}

export async function revokeAllAccessForPreset(
  presetId: string,
  userId: string | null
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }

  const preset = await db.query.presets.findFirst({
    where: eq(presets.id, presetId),
  });

  if (preset?.type === 'personal' && preset.owner_id !== userId) {
      return { success: false, message: 'You do not have permission to perform this action.' };
  }

  const access = await db.query.userPresetAccess.findFirst({
    where: and(
      eq(userPresetAccess.presetId, presetId),
      eq(userPresetAccess.userId, userId)
    ),
  });

  if (!access && preset?.type === 'private') {
    return {
      success: false,
      message: 'You do not have permission to perform this action.',
    };
  }

  await db.delete(userPresetAccess).where(eq(userPresetAccess.presetId, presetId));

  // Re-grant access to the current user
  await db
    .insert(userPresetAccess)
    .values({ userId, presetId })
    .onConflictDoNothing();

  revalidatePath('/app');
  return { success: true };
}

export async function updatePresetsOrder(
  presetsToUpdate: { id: string; order_position: number }[]
): Promise<{ success: boolean }> {
  for (const preset of presetsToUpdate) {
    await db
      .update(presets)
      .set({ orderPosition: preset.order_position })
      .where(eq(presets.id, preset.id));
  }
  revalidatePath('/app');
  return { success: true };
}
