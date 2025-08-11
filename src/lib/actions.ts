'use server';

import { revalidatePath } from 'next/cache';
import type { List, Task, Preset, PresetTask, Settings, User } from './types';
import { db } from './db';
import { lists, tasks as tasksTable, presets, presetTasks, users, userListAccess, userPresetAccess } from './db/schema';
import { eq, and, asc, isNull, sql, inArray, or, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// --- Auth Actions ---

const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const parsed = RegisterSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: parsed.error.errors.map(e => e.message).join(', ') };
  }
  
  const { username, email, password } = parsed.data;

  const existingUser = await db.query.users.findFirst({
    where: or(eq(users.email, email), eq(users.username, username)),
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return { success: false, message: "User with this email already exists." };
    }
    if (existingUser.username === username) {
      return { success: false, message: "Username is already taken." };
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  
  const defaultSettings: Settings = {
      theme: 'system',
      language: 'pl',
      hideLocked: false,
      colorTheme: 'default',
  };

  await db.insert(users).values({
    id: crypto.randomUUID(),
    username,
    email,
    passwordHash,
    settings: defaultSettings,
  });

  return { success: true, message: "Registration successful!" };
}

const LoginSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loginUser(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  const parsed = LoginSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, message: "Invalid input." };
  }

  const { identifier, password } = parsed.data;
  
  const user = await db.query.users.findFirst({
    where: or(
        eq(users.email, identifier), 
        eq(users.username, identifier)
    ),
  });

  if (!user) {
    return { success: false, message: "Invalid credentials." };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return { success: false, message: "Invalid credentials." };
  }
  
  const userResult: User = {
    id: user.id,
    username: user.username,
    settings: (user.settings as Settings) ?? {
        theme: 'system',
        language: 'pl',
        hideLocked: false,
        colorTheme: 'default',
    },
  };

  return { success: true, user: userResult };
}

export async function updateUserSettings(userId: string, settings: Partial<Settings>) {
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) {
        throw new Error("User not found");
    }

    const currentSettings = (user.settings as Settings) ?? {};
    const newSettings = { ...currentSettings, ...settings };

    await db.update(users).set({ settings: newSettings }).where(eq(users.id, userId));
    
    revalidatePath('/app');
    return { success: true, settings: newSettings };
}


// --- List Actions ---

export async function getLists(userId: string | null = null, hideLocked: boolean = false): Promise<List[]> {
  if (!userId) {
     const query = db
      .select({
        id: lists.id,
        name: lists.name,
        color: lists.color,
        createdAt: lists.createdAt,
        isPrivate: lists.isPrivate,
      })
      .from(lists)
      .orderBy(asc(lists.createdAt));
      
      if (hideLocked) {
        query.where(eq(lists.isPrivate, false));
      }

    const publicLists = await query;
    return publicLists.map(l => ({ ...l, id: l.id.toString(), created_at: l.createdAt?.toISOString() ?? new Date().toISOString(), is_private: l.isPrivate ?? false, has_access: !l.isPrivate }));
  }

  // If a user is logged in
  const allLists = await db.select({
      id: lists.id,
      name: lists.name,
      color: lists.color,
      createdAt: lists.createdAt,
      isPrivate: lists.isPrivate,
      accessGranted: sql<boolean>`CASE WHEN ${userListAccess.userId} IS NOT NULL THEN TRUE ELSE FALSE END`.mapWith(Boolean),
  }).from(lists)
  .leftJoin(userListAccess, and(eq(userListAccess.listId, lists.id), eq(userListAccess.userId, userId)))
  .orderBy(asc(lists.createdAt));
  
  const result = allLists.map(l => ({
      ...l, 
      id: l.id.toString(), 
      created_at: l.createdAt?.toISOString() ?? new Date().toISOString(),
      is_private: l.isPrivate ?? false,
      has_access: !l.isPrivate || l.accessGranted,
  }));

  if (hideLocked) {
    return result.filter(l => l.has_access);
  }

  return result;
}

export async function addList(name: string, color: string, isPrivate: boolean, password?: string, userId?: string | null): Promise<List> {
  const passwordHash = isPrivate && password ? await bcrypt.hash(password, 10) : null;
  
  const [newList] = await db.insert(lists).values({
    id: crypto.randomUUID(), 
    name, 
    color,
    isPrivate,
    passwordHash
  }).returning();
  
  if (isPrivate && userId) {
      await db.insert(userListAccess).values({ userId, listId: newList.id }).onConflictDoNothing();
  }

  revalidatePath('/app');
  return {...newList, id: newList.id.toString(), created_at: newList.createdAt?.toISOString() ?? new Date().toISOString(), is_private: newList.isPrivate ?? false, has_access: !newList.isPrivate || !!userId};
}

export async function updateList(id: string, name: string, color: string, isPrivate: boolean, currentPassword?: string, newPassword?: string, userId?: string | null) {
  const list = await db.query.lists.findFirst({ where: eq(lists.id, id) });
  if (!list) {
    return { success: false, message: 'List not found.' };
  }

  if (list.isPrivate) {
    if (!currentPassword) {
      return { success: false, message: 'Current password is required to edit a private list.' };
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, list.passwordHash!);
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
    if(userId) {
        await db.insert(userListAccess).values({ userId, listId: id }).onConflictDoNothing();
    }
  }

  const [updatedList] = await db.update(lists).set({ 
      name, 
      color,
      isPrivate,
      ...(passwordHash !== undefined && { passwordHash }),
  }).where(eq(lists.id, id)).returning();
  
  revalidatePath('/app');
  
  const result: List = {
      ...updatedList, 
      id: updatedList.id.toString(), 
      created_at: updatedList.createdAt?.toISOString() ?? new Date().toISOString(), 
      is_private: updatedList.isPrivate ?? false, 
      has_access: !updatedList.isPrivate || (!!userId && (await db.query.userListAccess.findFirst({where: and(eq(userListAccess.userId, userId), eq(userListAccess.listId, id))}) !== undefined))
  };

  return { success: true, list: result };
}

export async function deleteList(id: string, password?: string): Promise<{ success: boolean, message?: string }> {
  const list = await db.query.lists.findFirst({ where: eq(lists.id, id) });
  if (!list) {
      return { success: false, message: 'List not found.' };
  }
  
  if (list.isPrivate) {
      if (!password) {
          return { success: false, message: 'Hasło jest wymagane do usunięcia prywatnej listy.' };
      }
      if (!list.passwordHash) {
          return { success: false, message: 'Lista jest prywatna, ale nie ma ustawionego hasła.' };
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

export async function verifyListPassword(listId: string, password: string, userId: string | null): Promise<{ success: boolean }> {
  if (!password) {
    return { success: false };
  }
  const list = await db.query.lists.findFirst({
      where: eq(lists.id, listId),
  });

  if (!list || !list.isPrivate || !list.passwordHash) {
    return { success: list ? !list.isPrivate : false };
  }

  const isPasswordValid = await bcrypt.compare(password, list.passwordHash);
  
  if(isPasswordValid && userId) {
      await db.insert(userListAccess).values({ userId, listId }).onConflictDoNothing();
  }

  revalidatePath('/app');
  return { success: isPasswordValid };
}

export async function revokeAllAccessForList(listId: string, userId: string | null): Promise<{ success: boolean; message?: string }> {
    if (!userId) {
        return { success: false, message: "User not authenticated." };
    }

    const access = await db.query.userListAccess.findFirst({
        where: and(eq(userListAccess.listId, listId), eq(userListAccess.userId, userId))
    });

    const list = await db.query.lists.findFirst({ where: eq(lists.id, listId) });

    // Allow revoke if user has access OR if the list is not private (public lists don't need access records)
    if (!access && list?.isPrivate) {
        return { success: false, message: "You do not have permission to perform this action." };
    }

    await db.delete(userListAccess).where(eq(userListAccess.listId, listId));
    
    // Re-grant access to the current user
    await db.insert(userListAccess).values({ userId, listId }).onConflictDoNothing();

    revalidatePath('/app');
    return { success: true };
}


// --- Task Actions ---

export async function getTasks(userId?: string | null): Promise<Task[]> {
  const accessibleLists = await getLists(userId, false);
  const accessibleListIds = accessibleLists.filter(l => l.has_access).map(l => l.id);

  const query = db.select({
      id: tasksTable.id,
      name: tasksTable.name,
      done: tasksTable.done,
      listId: tasksTable.listId,
      orderPosition: tasksTable.orderPosition,
      createdAt: tasksTable.createdAt,
  }).from(tasksTable);

  const whereConditions: any[] = [isNull(tasksTable.listId)];
  if (accessibleListIds.length > 0) {
      whereConditions.push(inArray(tasksTable.listId, accessibleListIds));
  }

  query.where(or(...whereConditions));

  const allTasks = await query.orderBy(asc(tasksTable.orderPosition));
  
  return allTasks.map(t => ({
      ...t, 
      id: t.id.toString(), 
      list_id: t.listId || null,
      order_position: t.orderPosition ?? 0,
      created_at: t.createdAt?.toISOString() ?? new Date().toISOString()
    }));
}

export async function getListTasks(listId: string | null): Promise<Task[]> {
    const whereCondition = listId ? eq(tasksTable.listId, listId) : isNull(tasksTable.listId);
    const listTasks = await db.select({
      id: tasksTable.id,
      name: tasksTable.name,
      done: tasksTable.done,
      listId: tasksTable.listId,
      orderPosition: tasksTable.orderPosition,
      createdAt: tasksTable.createdAt,
    }).from(tasksTable).where(whereCondition).orderBy(asc(tasksTable.orderPosition));
    return listTasks.map(t => ({
      ...t, 
      id: t.id.toString(), 
      list_id: t.listId || null,
      order_position: t.orderPosition ?? 0,
      created_at: t.createdAt?.toISOString() ?? new Date().toISOString()
    }));
}


export async function addTask(name: string, list_id: string | null): Promise<Task> {
    const [maxOrderResult] = await db.select({ max: sql<number>`max(${tasksTable.orderPosition})` })
        .from(tasksTable)
        .where(list_id ? eq(tasksTable.listId, list_id) : isNull(tasksTable.listId));
    
    const maxOrder = (maxOrderResult.max ?? -1) as number;
    
    const [newTask] = await db.insert(tasksTable).values({
        id: crypto.randomUUID(), 
        name, 
        listId: list_id, 
        orderPosition: maxOrder + 1 
    }).returning();

    revalidatePath('/app');
    return {
        ...newTask,
        id: newTask.id.toString(),
        list_id: newTask.listId || null,
        order_position: newTask.orderPosition ?? 0,
        created_at: newTask.createdAt?.toISOString() ?? new Date().toISOString()
    };
}

export async function updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'list_id' | 'order_position' | 'created_at'>>): Promise<Task> {
    const [updatedTask] = await db.update(tasksTable).set(updates).where(eq(tasksTable.id, id)).returning();
    if (!updatedTask) throw new Error('Task not found');
    
    revalidatePath('/app');
    return {
        ...updatedTask,
        id: updatedTask.id.toString(),
        list_id: updatedTask.listId || null,
        order_position: updatedTask.orderPosition ?? 0,
        created_at: updatedTask.createdAt?.toISOString() ?? new Date().toISOString()
    };
}

export async function updateTasksOrder(tasksToUpdate: { id: string; order_position: number }[]): Promise<{ success: boolean }> {
  for (const task of tasksToUpdate) {
    await db.update(tasksTable)
      .set({ orderPosition: task.order_position })
      .where(eq(tasksTable.id, task.id));
  }
  revalidatePath('/app');
  return { success: true };
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  revalidatePath('/app');
  return { success: true };
}


export async function deleteCompletedTasks(listId: string | null | 'all'): Promise<{ success: boolean }> {
    if (listId === 'all') {
        await db.delete(tasksTable).where(eq(tasksTable.done, true));
    } else {
        if (listId) {
            await db.delete(tasksTable).where(and(eq(tasksTable.done, true), eq(tasksTable.listId, listId)));
        } else {
            await db.delete(tasksTable).where(and(eq(tasksTable.done, true), isNull(tasksTable.listId)));
        }
    }
    revalidatePath('/app');
    return { success: true };
}

export async function moveTaskToList(taskId: string, newListId: string | null): Promise<{ success: boolean }> {
  const [maxOrderResult] = await db.select({ max: sql<number>`max("order_position")` }).from(tasksTable)
    .where(newListId ? eq(tasksTable.listId, newListId) : isNull(tasksTable.listId));

  const newOrderPosition = ((maxOrderResult.max as number) ?? -1) + 1;

  await db.update(tasksTable)
    .set({ listId: newListId, orderPosition: newOrderPosition })
    .where(eq(tasksTable.id, taskId));

  revalidatePath('/app');
  return { success: true };
}

// --- Preset Actions ---

export async function getPresets(userId: string | null = null, hideLocked: boolean = false): Promise<Preset[]> {
 if (!userId) {
     const query = db
      .select({
        id: presets.id,
        name: presets.name,
        color: presets.color,
        createdAt: presets.createdAt,
        isPrivate: presets.isPrivate,
      })
      .from(presets)
      .orderBy(asc(presets.createdAt));
      
      if (hideLocked) {
        query.where(eq(presets.isPrivate, false));
      }

    const publicPresets = await query;
    return publicPresets.map(p => ({ ...p, id: p.id.toString(), created_at: p.createdAt?.toISOString() ?? new Date().toISOString(), is_private: p.isPrivate ?? false, has_access: !p.isPrivate }));
  }

  const allPresets = await db.select({
      id: presets.id,
      name: presets.name,
      color: presets.color,
      createdAt: presets.createdAt,
      isPrivate: presets.isPrivate,
      accessGranted: sql<boolean>`CASE WHEN ${userPresetAccess.userId} IS NOT NULL THEN TRUE ELSE FALSE END`.mapWith(Boolean),
  }).from(presets)
  .leftJoin(userPresetAccess, and(eq(userPresetAccess.presetId, presets.id), eq(userPresetAccess.userId, userId)))
  .orderBy(asc(presets.createdAt));

  const result = allPresets.map(p => ({
      ...p,
      id: p.id.toString(),
      created_at: p.createdAt?.toISOString() ?? new Date().toISOString(),
      is_private: p.isPrivate ?? false,
      has_access: !p.isPrivate || p.accessGranted,
  }));
  
  if (hideLocked) {
    return result.filter(p => p.has_access);
  }

  return result;
}


export async function addPreset(name: string, color: string, isPrivate: boolean, password?: string, userId?: string | null): Promise<Preset> {
  const passwordHash = isPrivate && password ? await bcrypt.hash(password, 10) : null;
  
  const [newPreset] = await db.insert(presets).values({ 
      id: crypto.randomUUID(), 
      name, 
      color,
      isPrivate,
      passwordHash
  }).returning();
  
  if (isPrivate && userId) {
      await db.insert(userPresetAccess).values({ userId, presetId: newPreset.id }).onConflictDoNothing();
  }

  revalidatePath('/app');
  return {...newPreset, id: newPreset.id.toString(), created_at: newPreset.createdAt?.toISOString() ?? new Date().toISOString(), is_private: newPreset.isPrivate ?? false, has_access: !newPreset.isPrivate || !!userId };
}

export async function updatePreset(id: string, name: string, color: string, isPrivate: boolean, currentPassword?: string, newPassword?: string, userId?: string | null) {
    const preset = await db.query.presets.findFirst({ where: eq(presets.id, id) });
    if (!preset) {
        return { success: false, message: 'Preset not found.' };
    }

    if (preset.isPrivate) {
        if (!currentPassword) {
            return { success: false, message: 'Current password is required to edit a private preset.' };
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, preset.passwordHash!);
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
         if(userId) {
            await db.insert(userPresetAccess).values({ userId, presetId: id }).onConflictDoNothing();
        }
    }
    
    const [updatedPreset] = await db.update(presets).set({
        name,
        color,
        isPrivate,
        ...(passwordHash !== undefined && { passwordHash })
    }).where(eq(presets.id, id)).returning();
    
    revalidatePath('/app');

    const result: Preset = {
        ...updatedPreset, 
        id: updatedPreset.id.toString(), 
        created_at: updatedPreset.createdAt?.toISOString() ?? new Date().toISOString(), 
        is_private: updatedPreset.isPrivate ?? false, 
        has_access: !updatedPreset.isPrivate || (!!userId && (await db.query.userPresetAccess.findFirst({where: and(eq(userPresetAccess.userId, userId), eq(userPresetAccess.presetId, id))}) !== undefined))
    };

    return { success: true, preset: result };
}


export async function deletePreset(id: string, password?: string): Promise<{ success: boolean, message?: string }> {
  const preset = await db.query.presets.findFirst({ where: eq(presets.id, id) });
  if (!preset) {
      return { success: false, message: 'Preset not found.' };
  }
  
  if (preset.isPrivate) {
      if (!password) {
          return { success: false, message: 'Hasło jest wymagane do usunięcia prywatnego presetu.' };
      }
      if (!preset.passwordHash) {
          return { success: false, message: 'Preset jest prywatny, ale nie ma ustawionego hasła.' };
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


export async function verifyPresetPassword(presetId: string, password: string, userId: string | null): Promise<{ success: boolean }> {
    if (!password) {
        return { success: false };
    }
    const preset = await db.query.presets.findFirst({
        where: eq(presets.id, presetId),
    });

    if (!preset || !preset.isPrivate || !preset.passwordHash) {
        return { success: preset ? !preset.isPrivate : false };
    }

    const isPasswordValid = await bcrypt.compare(password, preset.passwordHash);

    if (isPasswordValid && userId) {
        await db.insert(userPresetAccess).values({ userId, presetId }).onConflictDoNothing();
    }
    
    revalidatePath('/app');
    return { success: isPasswordValid };
}


export async function revokeAllAccessForPreset(presetId: string, userId: string | null): Promise<{ success: boolean; message?: string }> {
    if (!userId) {
        return { success: false, message: "User not authenticated." };
    }

    const access = await db.query.userPresetAccess.findFirst({
        where: and(eq(userPresetAccess.presetId, presetId), eq(userPresetAccess.userId, userId))
    });
    
    const preset = await db.query.presets.findFirst({ where: eq(presets.id, presetId) });

    if (!access && preset?.isPrivate) {
        return { success: false, message: "You do not have permission to perform this action." };
    }

    await db.delete(userPresetAccess).where(eq(userPresetAccess.presetId, presetId));

    // Re-grant access to the current user
    await db.insert(userPresetAccess).values({ userId, presetId }).onConflictDoNothing();
    
    revalidatePath('/app');
    return { success: true };
}

// --- Preset Task Actions ---

export async function getPresetTasks(presetId: string): Promise<PresetTask[]> {
  const allPresetTasks = await db.select().from(presetTasks)
    .where(eq(presetTasks.presetId, presetId))
    .orderBy(asc(presetTasks.orderPosition));
  
  return allPresetTasks.map(pt => ({
    ...pt,
    id: pt.id.toString(),
    preset_id: pt.presetId,
    task_name: pt.taskName,
    order_position: pt.orderPosition ?? 0,
    created_at: pt.createdAt?.toISOString() ?? new Date().toISOString()
  }));
}

export async function addPresetTask(presetId: string, taskName: string): Promise<PresetTask> {
    const [maxOrderResult] = await db.select({ max: sql<number>`max(${presetTasks.orderPosition})` })
        .from(presetTasks)
        .where(eq(presetTasks.presetId, presetId));
    
    const maxOrder = (maxOrderResult.max ?? -1) as number;
    
    const [newPresetTask] = await db.insert(presetTasks).values({
        id: crypto.randomUUID(),
        presetId,
        taskName,
        orderPosition: maxOrder + 1,
    }).returning();
    
    revalidatePath('/app');
    return {
        ...newPresetTask,
        id: newPresetTask.id.toString(),
        preset_id: newPresetTask.presetId,
        task_name: newPresetTask.taskName,
        order_position: newPresetTask.orderPosition ?? 0,
        created_at: newPresetTask.createdAt?.toISOString() ?? new Date().toISOString(),
    };
}

export async function updatePresetTask(id: string, updates: Partial<{ taskName: string, done: boolean }>): Promise<PresetTask> {
    const [updatedPresetTask] = await db.update(presetTasks).set(updates).where(eq(presetTasks.id, id)).returning();
    if (!updatedPresetTask) throw new Error('Preset task not found');

    revalidatePath('/app');
    return {
        ...updatedPresetTask,
        id: updatedPresetTask.id.toString(),
        preset_id: updatedPresetTask.presetId,
        task_name: updatedPresetTask.taskName,
        order_position: updatedPresetTask.orderPosition ?? 0,
        created_at: updatedPresetTask.createdAt?.toISOString() ?? new Date().toISOString(),
    };
}


export async function deletePresetTask(id: string): Promise<{ success: boolean }> {
    await db.delete(presetTasks).where(eq(presetTasks.id, id));
    revalidatePath('/app');
    return { success: true };
}

export async function resetAllPresetTasks(presetId: string): Promise<{ success: boolean }> {
    await db.update(presetTasks).set({ done: false }).where(eq(presetTasks.presetId, presetId));
    revalidatePath('/app');
    return { success: true };
}

export async function updatePresetTasksOrder(tasksToUpdate: { id: string; order_position: number }[]): Promise<{ success: boolean }> {
  for (const task of tasksToUpdate) {
    await db.update(presetTasks)
      .set({ orderPosition: task.order_position })
      .where(eq(presetTasks.id, task.id));
  }
  revalidatePath('/app');
  return { success: true };
}
