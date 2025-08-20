'use client';
import type { PresetTask } from '@/lib/types';
import { useState, useTransition, useRef, useEffect } from 'react';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Trash2, Plus, GripVertical, Edit, CheckSquare, RotateCcw, ClipboardList, Lock, AlignLeft } from 'lucide-react';
import { addPresetTask, deletePresetTask, updatePresetTask, resetAllPresetTasks, updatePresetTasksOrder } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { PresetTaskDetails } from './preset-task-details';

function PresetTaskItem({ task, isEditing, onUpdate, onDelete, onSelect }: PresetTaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditingName, setEditingName] = useState(false);
  const [name, setName] = useState(task.task_name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingName]);
  
  const handleItemClick = (e: React.MouseEvent) => {
    // Only toggle checkbox if the click is on the checkbox itself.
    // Otherwise, select the task to show details.
    if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
      return;
    }
    onSelect(task);
  }

  const handleCheckboxChange = (checked: boolean) => {
    startTransition(async () => {
      onUpdate(task.id, { done: !!checked });
       try {
        await updatePresetTask(task.id, { done: !!checked });
      } catch (e: any) {
        onUpdate(task.id, { done: !checked });
        toast({ variant: "destructive", title: "Failed to update preset task", description: e.message });
      }
    });
  };

  const handleDelete = () => {
    startTransition(() => {
      onDelete(task.id);
    });
  };

  const handleNameUpdate = async () => {
    if (!name.trim() || name === task.task_name) {
        setName(task.task_name);
        setEditingName(false);
        return;
    }
      
    const originalTaskName = task.task_name;
    const updates = { task_name: name };

    startTransition(async () => {
      onUpdate(task.id, updates);
      setEditingName(false);
      try {
        await updatePresetTask(task.id, { taskName: name });
      } catch (e: any) {
        onUpdate(task.id, { task_name: originalTaskName });
        toast({ variant: "destructive", title: "Failed to rename task", description: e.message });
      }
    });
  };


  return (
    <div
      onClick={handleItemClick}
      className={cn(
        'group flex items-center p-2 my-1 rounded-lg transition-all duration-300 ease-in-out border cursor-pointer',
        'bg-card',
        task.done ? 'bg-muted/50' : 'hover:bg-muted',
        isEditingName ? 'bg-muted/80' : '',
        isPending && 'opacity-70'
      )}
    >
      <div className={cn("h-5 w-5 mr-2 flex items-center justify-center", isEditing ? "text-muted-foreground cursor-grab" : "text-muted-foreground/30 cursor-default")}>
          <GripVertical className="h-full w-full" />
      </div>
      <Checkbox
        id={`preset-task-${task.id}`}
        checked={task.done}
        onCheckedChange={(checked) => {
            handleCheckboxChange(!!checked)
        }}
        onClick={(e) => e.stopPropagation()}
        className="mr-3 h-5 w-5"
        disabled={isEditingName}
      />
      {isEditingName ? (
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameUpdate}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNameUpdate();
            if (e.key === 'Escape') {
                setName(task.task_name);
                setEditingName(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent border-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base cursor-text"
        />

      ) : (
         <span 
            className={cn('flex-1 py-0.5 text-base', task.done && 'text-muted-foreground line-through')}
          >
          {task.task_name}
        </span>
      )}
      <div className='flex items-center ml-auto pl-2'>
        {task.description && !isEditingName && (
             <AlignLeft className="h-4 w-4 text-muted-foreground" />
        )}
        {isEditing && (
            <div className="flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditingName(true)}
                aria-label={`Edit preset task "${task.task_name}"`}
            >
                <Edit className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleDelete}
                aria-label={`Delete preset task "${task.task_name}"`}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
            </div>
        )}
      </div>
    </div>
  );
}

function AddPresetTask({ presetId, onTaskAdded }: AddPresetTaskProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setSubmitting(true);
    try {
      const newTask = await addPresetTask(presetId, name);
      onTaskAdded(newTask);
      setName('');
    } catch(err: any) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to add preset task: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full"
    >
      <div className="relative flex items-center">
        <Plus className="absolute left-3 h-5 w-5 text-muted-foreground" />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a preset task..."
          className="pl-10 pr-28 py-6 text-lg rounded-full bg-card/80 backdrop-blur-sm border-border focus-visible:ring-offset-0 focus-visible:ring-primary"
        />
        <div className="absolute right-2">
            <Button type="submit" disabled={!name.trim() || isSubmitting} className="rounded-full">
                {isSubmitting ? 'Adding...' : 'Add Task'}
            </Button>
        </div>
      </div>
    </form>
  );
}


interface PresetTaskListProps {
  presetId: string;
  initialTasks: PresetTask[];
  onTasksChange: (tasks: PresetTask[]) => void;
  isLoading: boolean;
  isLocked?: boolean;
}

export function PresetTaskList({ presetId, initialTasks, onTasksChange, isLoading, isLocked = false }: PresetTaskListProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<PresetTask | null>(null);
  const [, startTransition] = useTransition();

  
  useEffect(() => {
      setTasks(initialTasks);
  }, [initialTasks])

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !isEditing) return;

    const originalTasks = [...tasks];
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedTasksWithOrder = items.map((task, index) => ({
      ...task,
      order_position: index
    }));
    
    setTasks(updatedTasksWithOrder);
    onTasksChange(updatedTasksWithOrder);

    startTransition(() => {
        updatePresetTasksOrder(
            updatedTasksWithOrder.map((t) => ({ id: t.id, order_position: t.order_position }))
        ).catch((e: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to save new order: ${e.message}` });
            setTasks(originalTasks);
            onTasksChange(originalTasks);
        });
    });
  };

  const handleAddTask = (newTask: PresetTask) => {
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    onTasksChange(newTasks);
  };
  
  const handleTaskDelete = (taskId: string) => {
    const originalTasks = [...tasks];
    const newTasks = tasks.filter(t => t.id !== taskId)
    setTasks(newTasks);
    onTasksChange(newTasks);
    deletePresetTask(taskId).catch(() => {
        setTasks(originalTasks);
        onTasksChange(originalTasks);
    })
  };
  
  const handleTaskUpdate = (taskId: string, updates: Partial<PresetTask>) => {
    const newTasks = tasks.map(t => t.id === taskId ? {...t, ...updates} : t);
    setTasks(newTasks);
    onTasksChange(newTasks);
     if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updates });
    }
  }
  
  const handleResetTasks = async () => {
    const originalTasks = [...tasks];
    const newTasks = tasks.map(t => ({ ...t, done: false }));
    setTasks(newTasks);
    onTasksChange(newTasks);
    try {
      await resetAllPresetTasks(presetId);
    } catch {
      setTasks(originalTasks);
      onTasksChange(originalTasks);
    }
  };

  const hasCompletedTasks = tasks.some(t => t.done);
  
  const renderEmptyState = () => (
    <div className="text-center py-16">
      <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Ten preset jest pusty</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Kliknij "Edytuj preset", aby dodać do niego zadania.
      </p>
    </div>
  );
  
   const renderLockedState = () => (
    <div className="text-center py-16">
      <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Preset jest zablokowany</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Kliknij na preset w panelu bocznym, aby go odblokować.
      </p>
    </div>
  );

  const renderLoadingState = () => (
     <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
    </div>
  );

  return (
    <>
    <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-transparent">
        <div className="flex-1">
             {isLoading ? renderLoadingState() : (
              isLocked ? renderLockedState() : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId={`preset-${presetId}`}>
                        {(provided, snapshot) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={cn('space-y-1', snapshot.isDraggingOver && 'bg-muted/50 rounded-lg')}
                        >
                            {tasks.length > 0 ? (
                                tasks.map((task, index) => (
                                     <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!isEditing}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className={cn(snapshot.isDragging && 'opacity-80 shadow-lg')}
                                            >
                                                <PresetTaskItem 
                                                    task={task}
                                                    isEditing={isEditing}
                                                    onUpdate={handleTaskUpdate}
                                                    onDelete={handleTaskDelete}
                                                    onSelect={() => setSelectedTask(task)}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                ))
                            ) : (
                                !snapshot.isDraggingOver && renderEmptyState()
                            )}
                            {provided.placeholder}
                        </div>
                        )}
                    </Droppable>
                </DragDropContext>
              )
            )}
        </div>
        {!isLocked && (
            <div className="shrink-0 pt-6 space-y-4">
                <div className="flex justify-end gap-2">
                    {hasCompletedTasks && !isEditing && (
                        <Button variant="ghost" onClick={handleResetTasks}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Resetuj zadania
                        </Button>
                    )}
                    <Button variant={isEditing ? "default" : "secondary"} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? <CheckSquare className="mr-2 h-4 w-4"/> : <Edit className="mr-2 h-4 w-4" />}
                        {isEditing ? 'Gotowe' : 'Edytuj preset'}
                    </Button>
                </div>
                {isEditing && <AddPresetTask presetId={presetId} onTaskAdded={handleAddTask} />}
            </div>
        )}
    </div>
    {selectedTask && (
        <PresetTaskDetails
            task={selectedTask}
            onTaskUpdate={handleTaskUpdate}
            open={!!selectedTask}
            onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}
            isEditing={isEditing}
        />
    )}
    </>
  );
}

interface PresetTaskItemProps {
  task: PresetTask;
  isEditing: boolean;
  onUpdate: (taskId: string, updates: Partial<PresetTask>) => void;
  onDelete: (taskId: string) => void;
  onSelect: (task: PresetTask) => void;
}

interface AddPresetTaskProps {
    presetId: string;
    onTaskAdded: (task: PresetTask) => void;
}
