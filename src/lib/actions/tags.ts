
'use server';

import { revalidatePath } from 'next/cache';
import { eq, asc, sql } from 'drizzle-orm';

import type { Tag, Task } from '@/lib/types';
import { db } from '@/lib/db';
import { tags, tasks as tasksTable } from '@/lib/db/schema';
import { updateTaskTags } from './tasks';

// --- Tag Actions ---

export async function getTags(): Promise<Tag[]> {
  const allTags = await db.select().from(tags).orderBy(asc(tags.orderPosition));
  return allTags.map((t) => ({ ...t, order_position: t.orderPosition ?? 0 }));
}

export async function addTag(name: string, color: string): Promise<Tag> {
  const [maxOrderResult] = await db
    .select({ max: sql<number>`max(${tags.orderPosition})` })
    .from(tags);
  const maxOrder = (maxOrderResult.max ?? -1) as number;

  const [newTag] = await db
    .insert(tags)
    .values({ name, color, orderPosition: maxOrder + 1 })
    .returning();
  revalidatePath('/app');
  return { ...newTag, order_position: newTag.orderPosition ?? 0 };
}

export async function addTagAndAssignToTask(taskId: string, tagName: string, color: string): Promise<{updatedTask: Task, newTag: Tag | null}> {
    // 1. Check if tag already exists
    let tag = await db.query.tags.findFirst({ where: eq(tags.name, tagName) });
    let newTagInfo: Tag | null = null;

    // 2. If not, create it
    if (!tag) {
       const [maxOrderResult] = await db
        .select({ max: sql<number>`max(${tags.orderPosition})` })
        .from(tags);
      const maxOrder = (maxOrderResult.max ?? -1) as number;

      const [createdTag] = await db
        .insert(tags)
        .values({ name: tagName, color, orderPosition: maxOrder + 1 })
        .returning();
      tag = createdTag;
      newTagInfo = { ...tag, order_position: tag.orderPosition ?? 0 };
    }
    
    // 3. Assign tag to task
    const task = await db.query.tasks.findFirst({ where: eq(tasksTable.id, taskId) });
    if (!task) {
      throw new Error('Task not found');
    }
    const currentTags = task.tags ?? [];
    const newTags = [...new Set([...currentTags, tagName])];
    
    const updatedTask = await updateTaskTags(taskId, newTags);

    revalidatePath('/app');

    return { 
        updatedTask, 
        newTag: newTagInfo
    };
}


export async function updateTagColor(name: string, color: string): Promise<Tag> {
  const [updatedTag] = await db
    .update(tags)
    .set({ color })
    .where(eq(tags.name, name))
    .returning();
  revalidatePath('/app');
  return { ...updatedTag, order_position: updatedTag.orderPosition ?? 0 };
}

export async function updateTagsOrder(
  tagsToUpdate: { name: string; order_position: number }[]
): Promise<{ success: boolean }> {
  for (const tag of tagsToUpdate) {
    await db
      .update(tags)
      .set({ orderPosition: tag.order_position })
      .where(eq(tags.name, tag.name));
  }
  revalidatePath('/app');
  return { success: true };
}

export async function deleteTag(name: string): Promise<{ success: boolean }> {
  // First, remove the tag from all tasks
  const allTasksWithTag = await db
    .select({ id: tasksTable.id, tags: tasksTable.tags })
    .from(tasksTable)
    .where(sql`"tags" @> ARRAY[${name}]`);

  for (const task of allTasksWithTag) {
    const newTags = task.tags?.filter((t) => t !== name) ?? [];
    await db
      .update(tasksTable)
      .set({ tags: newTags })
      .where(eq(tasksTable.id, task.id));
  }

  // Then, delete the tag itself
  await db.delete(tags).where(eq(tags.name, name));

  revalidatePath('/app');
  return { success: true };
}
