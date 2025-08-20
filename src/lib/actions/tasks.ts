
'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, asc, isNull, sql, inArray, or } from 'drizzle-orm';

import type { Task } from '@/lib/types';
import { db } from '@/lib/db';
import { tasks as tasksTable, users, lists, userListAccess } from '@/lib/db/schema';
import { getLists } from './lists';

// --- Task Actions ---

export async function getTasks(userId?: string | null): Promise<Task[]> {
  const accessibleLists = await getLists(userId, false);
  const accessibleListIds = accessibleLists
    .filter((l) => l.has_access)
    .map((l) => l.id);

  const query = db
    .select({
      id: tasksTable.id,
      name: tasksTable.name,
      description: tasksTable.description,
      done: tasksTable.done,
      listId: tasksTable.listId,
      orderPosition: tasksTable.orderPosition,
      createdAt: tasksTable.createdAt,
      tags: tasksTable.tags,
      assignee_id: tasksTable.assignee_id,
      due_date: tasksTable.due_date,
      assignee: {
        id: users.id,
        username: users.username,
      }
    })
    .from(tasksTable)
    .leftJoin(users, eq(tasksTable.assignee_id, users.id));

  const whereConditions: any[] = [isNull(tasksTable.listId)];
  if (accessibleListIds.length > 0) {
    whereConditions.push(inArray(tasksTable.listId, accessibleListIds));
  }

  query.where(or(...whereConditions));

  const allTasks = await query.orderBy(asc(tasksTable.orderPosition));

  return allTasks.map((t) => ({
    ...t,
    id: t.id.toString(),
    description: t.description ?? null,
    list_id: t.listId || null,
    order_position: t.orderPosition ?? 0,
    created_at: t.createdAt?.toISOString() ?? new Date().toISOString(),
    tags: t.tags ?? [],
    assignee_id: t.assignee_id ?? null,
    due_date: t.due_date?.toISOString() ?? null,
    assignee: t.assignee_id ? t.assignee : null,
  }));
}

export async function getListTasks(listId: string | null): Promise<Task[]> {
  const whereCondition = listId
    ? eq(tasksTable.listId, listId)
    : isNull(tasksTable.listId);
    
  const listTasks = await db
    .select({
      id: tasksTable.id,
      name: tasksTable.name,
      description: tasksTable.description,
      done: tasksTable.done,
      listId: tasksTable.listId,
      orderPosition: tasksTable.orderPosition,
      createdAt: tasksTable.createdAt,
      tags: tasksTable.tags,
      assignee_id: tasksTable.assignee_id,
      due_date: tasksTable.due_date,
      assignee: {
        id: users.id,
        username: users.username,
      }
    })
    .from(tasksTable)
    .leftJoin(users, eq(tasksTable.assignee_id, users.id))
    .where(whereCondition)
    .orderBy(asc(tasksTable.orderPosition));

  return listTasks.map((t) => ({
    ...t,
    id: t.id.toString(),
    description: t.description ?? null,
    list_id: t.listId || null,
    order_position: t.orderPosition ?? 0,
    created_at: t.createdAt?.toISOString() ?? new Date().toISOString(),
    tags: t.tags ?? [],
    assignee_id: t.assignee_id ?? null,
    due_date: t.due_date?.toISOString() ?? null,
    assignee: t.assignee_id ? t.assignee : null,
  }));
}

export async function addTask(
  name: string,
  list_id: string | null
): Promise<Task> {
  const [maxOrderResult] = await db
    .select({ max: sql<number>`max(${tasksTable.orderPosition})` })
    .from(tasksTable)
    .where(list_id ? eq(tasksTable.listId, list_id) : isNull(tasksTable.listId));

  const maxOrder = (maxOrderResult.max ?? -1) as number;

  const [newTask] = await db
    .insert(tasksTable)
    .values({
      id: crypto.randomUUID(),
      name,
      listId: list_id,
      orderPosition: maxOrder + 1,
      tags: [],
    })
    .returning();

  revalidatePath('/app');
  return {
    ...newTask,
    id: newTask.id.toString(),
    description: newTask.description ?? null,
    list_id: newTask.listId || null,
    order_position: newTask.orderPosition ?? 0,
    created_at: newTask.createdAt?.toISOString() ?? new Date().toISOString(),
    tags: newTask.tags ?? [],
    assignee_id: newTask.assignee_id ?? null,
    due_date: newTask.due_date?.toISOString() ?? null,
    assignee: null,
  };
}

export async function updateTask(
  id: string,
  updates: Partial<
    Omit<Task, 'id' | 'list_id' | 'order_position' | 'created_at' | 'tags' | 'assignee'> & { assignee_id?: string | null }
  >
): Promise<Task> {

   if (updates.assignee_id !== undefined) {
    const task = await db.query.tasks.findFirst({ where: eq(tasksTable.id, id) });
    if (task?.listId) {
      const list = await db.query.lists.findFirst({ where: eq(lists.id, task.listId) });
      if (list) {
        // Only validate if we are actually assigning a user
        if (updates.assignee_id) {
            if (list.type === 'personal' && list.owner_id !== updates.assignee_id) {
                throw new Error("Cannot assign this task to a user who doesn't own the personal list.");
            }
            if (list.type === 'private') {
                const access = await db.query.userListAccess.findFirst({
                    where: and(eq(userListAccess.listId, list.id), eq(userListAccess.userId, updates.assignee_id))
                });
                if (!access) {
                    throw new Error("Cannot assign this task to a user who does not have access to the private list.");
                }
            }
        }
      }
    }
  }

  const [updatedTask] = await db
    .update(tasksTable)
    .set({
      name: updates.name,
      description: updates.description,
      done: updates.done,
      assignee_id: updates.assignee_id,
      due_date: updates.due_date ? new Date(updates.due_date) : null,
    })
    .where(eq(tasksTable.id, id))
    .returning();

  if (!updatedTask) throw new Error('Task not found');
  
  const finalTask = await db.query.tasks.findFirst({
      where: eq(tasksTable.id, updatedTask.id),
      with: {
          assignee: {
              columns: {
                  id: true,
                  username: true,
              }
          }
      }
  })

  revalidatePath('/app');
  return {
    ...finalTask!,
    id: finalTask!.id.toString(),
    description: finalTask!.description ?? null,
    list_id: finalTask!.listId || null,
    order_position: finalTask!.orderPosition ?? 0,
    created_at: finalTask!.createdAt?.toISOString() ?? new Date().toISOString(),
    tags: finalTask!.tags ?? [],
    assignee_id: finalTask!.assignee_id ?? null,
    due_date: finalTask!.due_date?.toISOString() ?? null,
    assignee: finalTask!.assignee_id ? finalTask!.assignee : null,
  };
}

export async function updateTaskTags(id: string, tags: string[]): Promise<Task> {
  const [updatedTask] = await db
    .update(tasksTable)
    .set({ tags })
    .where(eq(tasksTable.id, id))
    .returning();
  if (!updatedTask) throw new Error('Task not found');

  revalidatePath('/app');
  return {
    ...updatedTask,
    id: updatedTask.id.toString(),
    description: updatedTask.description ?? null,
    list_id: updatedTask.listId || null,
    order_position: updatedTask.orderPosition ?? 0,
    created_at: updatedTask.createdAt?.toISOString() ?? new Date().toISOString(),
    tags: updatedTask.tags ?? [],
    assignee_id: updatedTask.assignee_id ?? null,
    due_date: updatedTask.due_date?.toISOString() ?? null,
    assignee: null,
  };
}

export async function updateTasksOrder(
  tasksToUpdate: { id: string; order_position: number }[]
): Promise<{ success: boolean }> {
  for (const task of tasksToUpdate) {
    await db
      .update(tasksTable)
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

export async function deleteCompletedTasks(
  listId: string | null | 'all'
): Promise<{ success: boolean }> {
  if (listId === 'all') {
    await db.delete(tasksTable).where(eq(tasksTable.done, true));
  } else {
    if (listId) {
      await db
        .delete(tasksTable)
        .where(and(eq(tasksTable.done, true), eq(tasksTable.listId, listId)));
    } else {
      await db
        .delete(tasksTable)
        .where(and(eq(tasksTable.done, true), isNull(tasksTable.listId)));
    }
  }
  revalidatePath('/app');
  return { success: true };
}

export async function moveTaskToList(
  taskId: string,
  newListId: string | null
): Promise<{ success: boolean }> {
  const [maxOrderResult] = await db
    .select({ max: sql<number>`max("order_position")` })
    .from(tasksTable)
    .where(
      newListId ? eq(tasksTable.listId, newListId) : isNull(tasksTable.listId)
    );

  const newOrderPosition = ((maxOrderResult.max as number) ?? -1) + 1;

  await db
    .update(tasksTable)
    .set({ listId: newListId, orderPosition: newOrderPosition })
    .where(eq(tasksTable.id, taskId));

  revalidatePath('/app');
  return { success: true };
}
