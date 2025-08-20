'use server';

import { revalidatePath } from 'next/cache';
import { eq, asc, sql } from 'drizzle-orm';

import type { PresetTask } from '@/lib/types';
import { db } from '@/lib/db';
import { presetTasks } from '@/lib/db/schema';

// --- Preset Task Actions ---

export async function getPresetTasks(presetId: string): Promise<PresetTask[]> {
  const allPresetTasks = await db
    .select()
    .from(presetTasks)
    .where(eq(presetTasks.presetId, presetId))
    .orderBy(asc(presetTasks.orderPosition));

  return allPresetTasks.map((pt) => ({
    ...pt,
    id: pt.id.toString(),
    preset_id: pt.presetId,
    task_name: pt.taskName,
    description: pt.description ?? null,
    order_position: pt.orderPosition ?? 0,
    created_at: pt.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

export async function addPresetTask(
  presetId: string,
  taskName: string
): Promise<PresetTask> {
  const [maxOrderResult] = await db
    .select({ max: sql<number>`max(${presetTasks.orderPosition})` })
    .from(presetTasks)
    .where(eq(presetTasks.presetId, presetId));

  const maxOrder = (maxOrderResult.max ?? -1) as number;

  const [newPresetTask] = await db
    .insert(presetTasks)
    .values({
      id: crypto.randomUUID(),
      presetId,
      taskName,
      description: '',
      orderPosition: maxOrder + 1,
    })
    .returning();

  revalidatePath('/app');
  return {
    ...newPresetTask,
    id: newPresetTask.id.toString(),
    preset_id: newPresetTask.presetId,
    task_name: newPresetTask.taskName,
    description: newPresetTask.description ?? null,
    order_position: newPresetTask.orderPosition ?? 0,
    created_at: newPresetTask.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function updatePresetTask(
  id: string,
  updates: Partial<{ taskName: string; description: string; done: boolean }>
): Promise<PresetTask> {
  const [updatedPresetTask] = await db
    .update(presetTasks)
    .set(updates)
    .where(eq(presetTasks.id, id))
    .returning();
  if (!updatedPresetTask) throw new Error('Preset task not found');

  revalidatePath('/app');
  return {
    ...updatedPresetTask,
    id: updatedPresetTask.id.toString(),
    preset_id: updatedPresetTask.presetId,
    task_name: updatedPresetTask.taskName,
    description: updatedPresetTask.description ?? null,
    order_position: updatedPresetTask.orderPosition ?? 0,
    created_at: updatedPresetTask.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function deletePresetTask(id: string): Promise<{ success: boolean }> {
  await db.delete(presetTasks).where(eq(presetTasks.id, id));
  revalidatePath('/app');
  return { success: true };
}

export async function resetAllPresetTasks(
  presetId: string
): Promise<{ success: boolean }> {
  await db
    .update(presetTasks)
    .set({ done: false })
    .where(eq(presetTasks.presetId, presetId));
  revalidatePath('/app');
  return { success: true };
}

export async function updatePresetTasksOrder(
  tasksToUpdate: { id: string; order_position: number }[]
): Promise<{ success: boolean }> {
  for (const task of tasksToUpdate) {
    await db
      .update(presetTasks)
      .set({ orderPosition: task.order_position })
      .where(eq(presetTasks.id, task.id));
  }
  revalidatePath('/app');
  return { success: true };
}
