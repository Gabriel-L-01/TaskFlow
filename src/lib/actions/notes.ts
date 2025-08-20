
'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { eq, and, asc, sql, or, isNull } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import type { Note, PrivacyType } from '@/lib/types';
import { db } from '@/lib/db';
import { notes, userNoteAccess, tags as tagsTable } from '@/lib/db/schema';

// --- Note Actions ---

export async function getNotes(
  userId: string | null = null,
  hideLocked: boolean = false
): Promise<Note[]> {
  const isPrivate = (type: PrivacyType | null) => type === 'private';
  
  if (!userId) {
    const query = db
      .select({
        id: notes.id,
        name: notes.name,
        content: notes.content,
        color: notes.color,
        createdAt: notes.createdAt,
        orderPosition: notes.orderPosition,
        type: notes.type,
        tags: notes.tags,
      })
      .from(notes)
      // Exclude personal notes when not logged in
      .where(or(eq(notes.type, 'public'), eq(notes.type, 'private'), isNull(notes.type)))
      .orderBy(asc(notes.orderPosition));

    if (hideLocked) {
      query.where(eq(notes.type, 'public'));
    }

    const publicNotes = await query;
    return publicNotes.map((n) => ({
      ...n,
      id: n.id.toString(),
      content: n.content ?? '',
      created_at: n.createdAt?.toISOString() ?? new Date().toISOString(),
      has_access: !isPrivate(n.type),
      order_position: n.orderPosition ?? 0,
      type: n.type ?? 'public',
      tags: n.tags ?? [],
    }));
  }

  // If a user is logged in
  const allNotes = await db
    .select({
      id: notes.id,
      name: notes.name,
      content: notes.content,
      color: notes.color,
      createdAt: notes.createdAt,
      orderPosition: notes.orderPosition,
      type: notes.type,
      ownerId: notes.owner_id,
      tags: notes.tags,
      accessGranted:
        sql<boolean>`CASE WHEN ${userNoteAccess.userId} IS NOT NULL THEN TRUE ELSE FALSE END`.mapWith(
          Boolean
        ),
    })
    .from(notes)
    .leftJoin(
      userNoteAccess,
      and(eq(userNoteAccess.noteId, notes.id), eq(userNoteAccess.userId, userId))
    )
    .where(
        // Return public/private notes OR personal notes owned by the current user
        or(
            eq(notes.type, 'public'),
            eq(notes.type, 'private'),
            isNull(notes.type),
            and(eq(notes.type, 'personal'), eq(notes.owner_id, userId))
        )
    )
    .orderBy(asc(notes.orderPosition));

  const result = allNotes.map((n) => ({
    ...n,
    id: n.id.toString(),
    content: n.content ?? '',
    created_at: n.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access: !isPrivate(n.type) || n.accessGranted || n.ownerId === userId,
    order_position: n.orderPosition ?? 0,
    type: n.type ?? 'public',
    tags: n.tags ?? [],
  }));

  if (hideLocked) {
    return result.filter((n) => n.has_access);
  }

  return result;
}

export async function addNote(
  name: string,
  color: string,
  type: PrivacyType,
  content: string,
  password?: string,
  userId?: string | null
): Promise<Note> {
  const isPrivate = type === 'private';
  const passwordHash = isPrivate && password ? await bcrypt.hash(password, 10) : null;

  const [maxOrderResult] = await db
    .select({ max: sql<number>`max(${notes.orderPosition})` })
    .from(notes);
  const maxOrder = (maxOrderResult.max ?? -1) as number;

  const [newNote] = await db
    .insert(notes)
    .values({
      id: crypto.randomUUID(),
      name,
      content,
      color,
      passwordHash,
      orderPosition: maxOrder + 1,
      type,
      owner_id: type === 'personal' ? userId : null,
      tags: [],
    })
    .returning();

  if (isPrivate && userId) {
    await db
      .insert(userNoteAccess)
      .values({ userId, noteId: newNote.id })
      .onConflictDoNothing();
  }

  revalidatePath('/app');
  return {
    ...newNote,
    id: newNote.id.toString(),
    content: newNote.content ?? '',
    created_at: newNote.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access: !isPrivate || !!userId,
    order_position: newNote.orderPosition ?? 0,
    type: newNote.type ?? 'public',
    tags: newNote.tags ?? [],
  };
}

export async function updateNote(
  id: string,
  updates: Partial<{ name: string; content: string; color: string; type: PrivacyType; tags: string[]; }>,
  currentPassword?: string,
  newPassword?: string,
  userId?: string | null
) {
  const note = await db.query.notes.findFirst({ where: eq(notes.id, id) });
  if (!note) {
    return { success: false, message: 'Note not found.' };
  }

  // Security check: Only owner can change a personal note
  if (note.type === 'personal' && note.owner_id !== userId) {
      return { success: false, message: 'You do not have permission to edit this note.' };
  }

  const isPrivate = updates.type === 'private';

  if (note.type === 'private') {
    if (!currentPassword) {
      return {
        success: false,
        message: 'Current password is required to edit a private note.',
      };
    }
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      note.passwordHash!
    );
    if (!isPasswordValid) {
      return { success: false, message: 'Incorrect current password.' };
    }
  }

  let passwordHash: string | null | undefined = undefined;
  if (isPrivate && newPassword) {
    passwordHash = await bcrypt.hash(newPassword, 10);
  } else if (updates.type && updates.type !== 'private') {
    passwordHash = null;
  }

  if (passwordHash !== undefined) {
    await db.delete(userNoteAccess).where(eq(userNoteAccess.noteId, id));
    if (userId) {
      await db
        .insert(userNoteAccess)
        .values({ userId, noteId: id })
        .onConflictDoNothing();
    }
  }

  const [updatedNote] = await db
    .update(notes)
    .set({
      ...updates,
      ...(updates.type && { owner_id: updates.type === 'personal' ? userId : (note.type === 'personal' ? null : note.owner_id) }),
      ...(passwordHash !== undefined && { passwordHash }),
    })
    .where(eq(notes.id, id))
    .returning();

  revalidatePath('/app');

  const result: Note = {
    ...updatedNote,
    id: updatedNote.id.toString(),
    content: updatedNote.content ?? '',
    created_at: updatedNote.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access:
      updatedNote.type !== 'private' ||
      (!!userId &&
        (await db.query.userNoteAccess.findFirst({
          where: and(
            eq(userNoteAccess.userId, userId),
            eq(userNoteAccess.noteId, id)
          ),
        })) !== undefined),
    order_position: updatedNote.orderPosition ?? 0,
    type: updatedNote.type ?? 'public',
    tags: updatedNote.tags ?? [],
  };

  return { success: true, note: result };
}

export async function deleteNote(
  id: string,
  password?: string,
  userId?: string | null
): Promise<{ success: boolean; message?: string }> {
  const note = await db.query.notes.findFirst({ where: eq(notes.id, id) });
  if (!note) {
    return { success: false, message: 'Note not found.' };
  }

  if (note.type === 'personal' && note.owner_id !== userId) {
    return { success: false, message: 'You do not have permission to delete this note.' };
  }

  if (note.type === 'private') {
    if (!password) {
      return {
        success: false,
        message: 'Hasło jest wymagane do usunięcia prywatnej notatki.',
      };
    }
    if (!note.passwordHash) {
      return {
        success: false,
        message: 'Notatka jest prywatna, ale nie ma ustawionego hasła.',
      };
    }
    const isPasswordValid = await bcrypt.compare(password, note.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: 'Nieprawidłowe hasło.' };
    }
  }

  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath('/app');
  return { success: true };
}

export async function verifyNotePassword(
  noteId: string,
  password: string,
  userId: string | null
): Promise<{ success: boolean }> {
  if (!password) {
    return { success: false };
  }
  const note = await db.query.notes.findFirst({
    where: eq(notes.id, noteId),
  });

  if (!note || note.type !== 'private' || !note.passwordHash) {
    return { success: note ? note.type !== 'private' : false };
  }

  const isPasswordValid = await bcrypt.compare(password, note.passwordHash);

  if (isPasswordValid && userId) {
    await db
      .insert(userNoteAccess)
      .values({ userId, noteId })
      .onConflictDoNothing();
  }

  revalidatePath('/app');
  return { success: isPasswordValid };
}

export async function revokeAllAccessForNote(
  noteId: string,
  userId: string | null
): Promise<{ success: boolean; message?: string }> {
  if (!userId) {
    return { success: false, message: 'User not authenticated.' };
  }
  
  const note = await db.query.notes.findFirst({ where: eq(notes.id, noteId) });

  // Only owner can revoke access for personal notes
  if (note?.type === 'personal' && note.owner_id !== userId) {
      return { success: false, message: "You do not have permission to perform this action." };
  }

  const access = await db.query.userNoteAccess.findFirst({
    where: and(
      eq(userNoteAccess.noteId, noteId),
      eq(userNoteAccess.userId, userId)
    ),
  });
  
  // Allow revoke if user has access OR if the note is not private (public notes don't need access records)
  if (!access && note?.type === 'private') {
    return {
      success: false,
      message: 'You do not have permission to perform this action.',
    };
  }

  await db.delete(userNoteAccess).where(eq(userNoteAccess.noteId, noteId));

  // Re-grant access to the current user
  await db
    .insert(userNoteAccess)
    .values({ userId, noteId })
    .onConflictDoNothing();

  revalidatePath('/app');
  return { success: true };
}

export async function updateNotesOrder(
  notesToUpdate: { id: string; order_position: number }[]
): Promise<{ success: boolean }> {
  for (const note of notesToUpdate) {
    await db
      .update(notes)
      .set({ orderPosition: note.order_position })
      .where(eq(notes.id, note.id));
  }
  revalidatePath('/app');
  return { success: true };
}

export async function updateNoteTags(id: string, tags: string[]): Promise<Note> {
  const [updatedNote] = await db
    .update(notes)
    .set({ tags })
    .where(eq(notes.id, id))
    .returning();
  if (!updatedNote) throw new Error('Note not found');

  revalidatePath('/app');
  return {
    ...updatedNote,
    id: updatedNote.id.toString(),
    content: updatedNote.content ?? '',
    created_at: updatedNote.createdAt?.toISOString() ?? new Date().toISOString(),
    has_access: false, // This should be properly determined
    order_position: updatedNote.orderPosition ?? 0,
    type: updatedNote.type ?? 'public',
    tags: updatedNote.tags ?? [],
  };
}

export async function addTagAndAssignToNote(noteId: string, tagName: string, color: string): Promise<{updatedNote: Note, newTag: schema.Tag | null}> {
    let tag = await db.query.tags.findFirst({ where: eq(tagsTable.name, tagName) });
    let newTagInfo: schema.Tag | null = null;

    if (!tag) {
       const [maxOrderResult] = await db
        .select({ max: sql<number>`max(${tagsTable.orderPosition})` })
        .from(tagsTable);
      const maxOrder = (maxOrderResult.max ?? -1) as number;

      const [createdTag] = await db
        .insert(tagsTable)
        .values({ name: tagName, color, orderPosition: maxOrder + 1 })
        .returning();
      tag = createdTag;
      newTagInfo = { ...tag, order_position: tag.orderPosition ?? 0 };
    }
    
    const note = await db.query.notes.findFirst({ where: eq(notes.id, noteId) });
    if (!note) {
      throw new Error('Note not found');
    }
    const currentTags = note.tags ?? [];
    const newTags = [...new Set([...currentTags, tagName])];
    
    const updatedNote = await updateNoteTags(noteId, newTags);

    revalidatePath('/app');

    return { 
        updatedNote, 
        newTag: newTagInfo
    };
}
