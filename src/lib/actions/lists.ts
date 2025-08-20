
'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { eq, and, asc, sql, or, isNull } from 'drizzle-orm';

import type { List, PrivacyType } from '@/lib/types';
import { db } from '@/lib/db';
import { lists, userListAccess, users } from '@/lib/db/schema';

// --- List Actions ---

export async function getLists(
  userId: string | null = null,
  hideLocked: boolean = false
): Promise<List[]> {
  const isPrivate = (type: PrivacyType | null) => type === 'private';
  
  if (!userId) {
    const query = db
      .select({
        id: lists.id,
        name: lists.name,
        color: lists.color,
        createdAt: lists.createdAt,
        orderPosition: lists.orderPosition,
        type: lists.type,
      })
      .from(lists)
      // Exclude personal lists when not logged in
      .where(or(eq(lists.type, 'public'), eq(lists.type, 'private'), isNull(lists.type)))
      .orderBy(asc(lists.orderPosition));

    if (hideLocked) {
      query.where(eq(lists.type, 'public'));
    }

    const publicLists = await query;
    return publicLists.map((l) => ({
      ...l,
      id: l.id.toString(),
      created_at: l.createdAt?.toISOString() ?? new Date().toISOString(),
      has_access: !isPrivate(l.type),
      order_position: l.orderPosition ?? 0,
      type: l.type ?? 'public',
    }));
  }

  // If a user is logged in
  const allLists = await db
    .select({
      id: lists.id,
      name: lists.name,
      color: lists.color,
      createdAt: lists.createdAt,
      orderPosition: lists.orderPosition,
      type: lists.type,
      ownerId: lists.owner_id,
      accessGranted:
        sql<boolean>`CASE WHEN ${userListAccess.userId} IS NOT NULL THEN TRUE ELSE FALSE END`.mapWith(
          Boolean
        ),
    })
    .from(lists)
    .leftJoin(
      userListAccess,
      and(eq(userListAccess.listId, lists.id), eq(userListAccess.userId, userId))
    )
    .where(
        // Return public/private lists OR personal lists owned by the current user
        or(
            eq(lists.type, 'public'),
            eq(lists.type, 'private'),
            isNull(lists.type),
            and(eq(lists.type, 'personal'), eq(lists.owner_id, userId))
        )
    )
    .orderBy(asc(lists.orderPosition));

  const result = allLists.map((l) => ({
    ...l,
    id: l.id.toString(),
    created_at: l.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access: !isPrivate(l.type) || l.accessGranted || l.ownerId === userId,
    order_position: l.orderPosition ?? 0,
    type: l.type ?? 'public',
  }));

  if (hideLocked) {
    return result.filter((l) => l.has_access);
  }

  return result;
}

export async function addList(
  name: string,
  color: string,
  type: PrivacyType,
  password?: string,
  userId?: string | null
): Promise<List> {
  const isPrivate = type === 'private';
  const passwordHash = isPrivate && password ? await bcrypt.hash(password, 10) : null;

  const [maxOrderResult] = await db
    .select({ max: sql<number>`max(${lists.orderPosition})` })
    .from(lists);
  const maxOrder = (maxOrderResult.max ?? -1) as number;

  const [newList] = await db
    .insert(lists)
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
      .insert(userListAccess)
      .values({ userId, listId: newList.id })
      .onConflictDoNothing();
  }

  revalidatePath('/app');
  return {
    ...newList,
    id: newList.id.toString(),
    created_at: newList.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access: !isPrivate || !!userId,
    order_position: newList.orderPosition ?? 0,
    type: newList.type ?? 'public',
  };
}

export async function updateList(
  id: string,
  name: string,
  color: string,
  type: PrivacyType,
  currentPassword?: string,
  newPassword?: string,
  userId?: string | null
) {
  const list = await db.query.lists.findFirst({ where: eq(lists.id, id) });
  if (!list) {
    return { success: false, message: 'List not found.' };
  }

  // Security check: Only owner can change a personal list
  if (list.type === 'personal' && list.owner_id !== userId) {
      return { success: false, message: 'You do not have permission to edit this list.' };
  }

  const isPrivate = type === 'private';

  if (list.type === 'private') {
    if (!currentPassword) {
      return {
        success: false,
        message: 'Current password is required to edit a private list.',
      };
    }
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      list.passwordHash!
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
    await db.delete(userListAccess).where(eq(userListAccess.listId, id));
    if (userId) {
      await db
        .insert(userListAccess)
        .values({ userId, listId: id })
        .onConflictDoNothing();
    }
  }

  const [updatedList] = await db
    .update(lists)
    .set({
      name,
      color,
      type,
      owner_id: type === 'personal' ? userId : (list.type === 'personal' ? null : list.owner_id),
      ...(passwordHash !== undefined && { passwordHash }),
    })
    .where(eq(lists.id, id))
    .returning();

  revalidatePath('/app');

  const result: List = {
    ...updatedList,
    id: updatedList.id.toString(),
    created_at: updatedList.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access:
      updatedList.type !== 'private' ||
      (!!userId &&
        (await db.query.userListAccess.findFirst({
          where: and(
            eq(userListAccess.userId, userId),
            eq(userListAccess.listId, id)
          ),
        })) !== undefined),
    order_position: updatedList.orderPosition ?? 0,
    type: updatedList.type ?? 'public',
  };

  return { success: true, list: result };
}

export async function deleteList(
  id: string,
  password?: string,
  userId?: string | null
): Promise<{ success: boolean; message?: string }> {
  const list = await db.query.lists.findFirst({ where: eq(lists.id, id) });
  if (!list) {
    return { success: false, message: 'List not found.' };
  }

  if (list.type === 'personal' && list.owner_id !== userId) {
    return { success: false, message: 'You do not have permission to delete this list.' };
  }

  if (list.type === 'private') {
    if (!password) {
      return {
        success: false,
        message: 'Hasło jest wymagane do usunięcia prywatnej listy.',
      };
    }
    if (!list.passwordHash) {
      return {
        success: false,
        message: 'Lista jest prywatna, ale nie ma ustawionego hasła.',
      };
    }
    const isPasswordValid = await bcrypt.compare(password, list.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Nieprawidłowe hasło.' };
    }
  }

  await db.delete(lists).where(eq(lists.id, id));
  revalidatePath('/app');
  return { success: true };
}

export async function verifyListPassword(
  listId: string,
  password: string,
  userId: string | null
): Promise<{ success: boolean }> {
  if (!password) {
    return { success: false };
  }
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  if (!list || list.type !== 'private' || !list.passwordHash) {
    return { success: list ? list.type !== 'private' : false };
  }

  const isPasswordValid = await bcrypt.compare(password, list.passwordHash);

  if (isPasswordValid && userId) {
    await db
      .insert(userListAccess)
      .values({ userId, listId })
      .onConflictDoNothing();
  }

  revalidatePath('/app');
  return { success: isPasswordValid };
}

export async function revokeAllAccessForList(
  listId: string,
  userId: string | null
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  
  const list = await db.query.lists.findFirst({ where: eq(lists.id, listId) });

  // Only owner can revoke access for personal lists
  if (list?.type === 'personal' && list.owner_id !== userId) {
      return { success: false, message: "You do not have permission to perform this action." };
  }

  const access = await db.query.userListAccess.findFirst({
    where: and(
      eq(userListAccess.listId, listId),
      eq(userListAccess.userId, userId)
    ),
  });
  
  // Allow revoke if user has access OR if the list is not private (public lists don't need access records)
  if (!access && list?.type === 'private') {
    return {
      success: false,
      message: 'You do not have permission to perform this action.',
    };
  }

  await db.delete(userListAccess).where(eq(userListAccess.listId, listId));

  // Re-grant access to the current user
  await db
    .insert(userListAccess)
    .values({ userId, listId })
    .onConflictDoNothing();

  revalidatePath('/app');
  return { success: true };
}

export async function updateListsOrder(
  listsToUpdate: { id: string; order_position: number }[]
): Promise<{ success: boolean }> {
  for (const list of listsToUpdate) {
    await db
      .update(lists)
      .set({ orderPosition: list.order_position })
      .where(eq(lists.id, list.id));
  }
  revalidatePath('/app');
  return { success: true };
}
