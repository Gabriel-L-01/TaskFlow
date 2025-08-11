'use client';
import type { Task, List, SortOption } from '@/lib/types';
import { useState, useMemo, useEffect, useTransition } from 'react';
import { TaskItem } from './task-item';
import { AddTask } from './add-task';
import { Button } from './ui/button';
import { deleteCompletedTasks, updateTasksOrder } from '@/lib/actions';
import { Eye, EyeOff, Trash2, ClipboardList, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

interface TaskListProps {
  tasks: Task[];
  allLists: List[];
  listId: string | null | 'all';
  onTasksChange: (tasks: Task[]) => void;
  onTaskAdded: (task: Task) => void;
  sortOption: SortOption;
  groupByList?: boolean;
  isLoading: boolean;
  isLocked?: boolean;
}

export function TaskList({ 
  tasks: initialTasks, 
  allLists, 
  listId, 
  onTasksChange, 
  onTaskAdded, 
  sortOption, 
  groupByList = false, 
  isLoading,
  isLocked = false,
}: TaskListProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [showCompleted, setShowCompleted] = useState(true);
  const [, startTransition] = useTransition();

  // When initialTasks prop changes, update the local state
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sortedTasks = useMemo(() => {
    const sortableTasks = [...tasks];
    
    // The main sort logic
    sortableTasks.sort((a, b) => {
      // Completed tasks always go to the bottom
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }
      // If sort is by order, respect the order_position
      if (sortOption === 'order_position') {
        return (a.order_position ?? 0) - (b.order_position ?? 0);
      }
      // Other sort options
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    });

    return sortableTasks;
  }, [tasks, sortOption]);
  
  const handleTaskUpdate = (updatedTask: Task) => {
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTasks);
    onTasksChange(newTasks);
  };
  
  const handleTaskDelete = (taskId: string) => {
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    onTasksChange(newTasks);
  };
   
  const handleTaskMove = (taskId: string, newListId: string | null) => {
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    
    // In 'all' view, update the task's list_id. In a specific list view, remove it.
    if (listId === 'all') {
      const updatedTask = { ...taskToMove, list_id: newListId };
      const newTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
       setTasks(newTasks);
       onTasksChange(newTasks);
    } else {
       const newTasks = tasks.filter(t => t.id !== taskId);
       setTasks(newTasks);
       onTasksChange(newTasks);
    }
  };
  
  const handleDeleteCompleted = async () => {
    const originalTasks = [...tasks];
    const completedTaskIds = tasks.filter(t => t.done).map(t => t.id);
    
    if (completedTaskIds.length === 0) return;

    // Optimistic update
    const newTasks = tasks.filter(t => !t.done);
    setTasks(newTasks);
    onTasksChange(newTasks);

    try {
      await deleteCompletedTasks(listId);
    } catch (e) {
      setTasks(originalTasks);
      onTasksChange(originalTasks);
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć ukończonych zadań.' });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    
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
        updateTasksOrder(
            updatedTasksWithOrder.map((t) => ({ id: t.id, order_position: t.order_position }))
        ).catch((e: Error) => {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to save new order: ${e.message}` });
            setTasks(originalTasks); 
            onTasksChange(originalTasks);
        });
    });
  };

  const visibleTasks = showCompleted ? sortedTasks : sortedTasks.filter(t => !t.done);
  const hasCompletedTasks = sortedTasks.some(t => t.done);
  
  const groupedTasks = useMemo(() => {
    if (!groupByList) return null;
    
    const groups: { [key: string]: Task[] } = { 'null': [] }; // For inbox
    allLists.forEach(l => groups[l.id] = []);

    visibleTasks.forEach(task => {
        const key = String(task.list_id || 'null');
        if (groups[key]) {
            groups[key].push(task);
        } else {
            groups['null'].push(task);
        }
    });
    
    return Object.entries(groups)
      .filter(([, tasksInGroup]) => tasksInGroup.length > 0)
      .sort(([listIdA], [listIdB]) => {
          if (listIdA === 'null') return -1;
          if (listIdB === 'null') return 1;
          const listA = allLists.find(l => l.id === listIdA);
          const listB = allLists.find(l => l.id === listIdB);
          return listA?.name.localeCompare(listB?.name || '') || 0;
      });

  }, [groupByList, visibleTasks, allLists]);
  
  const currentListId = listId === 'all' ? null : listId;
  const isDraggable = sortOption === 'order_position' && !groupByList;
  
  const renderEmptyState = () => (
    <div className="text-center py-16">
      <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Ta lista jest pusta</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Dodaj swoje pierwsze zadanie, aby zacząć.
      </p>
    </div>
  );

  const renderLockedState = () => (
    <div className="text-center py-16">
      <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Lista jest zablokowana</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Kliknij na listę w panelu bocznym, aby ją odblokować.
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

  const renderTaskList = (tasksToRender: Task[]) => (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="tasks">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {tasksToRender.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!isDraggable || task.done}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(snapshot.isDragging && 'opacity-80 shadow-lg')}
                  >
                    <TaskItem 
                      task={task}
                      lists={allLists}
                      onUpdate={handleTaskUpdate}
                      onDelete={handleTaskDelete}
                      onMove={handleTaskMove}
                      isDraggable={isDraggable && !task.done}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-transparent">
        <div className="flex-1">
            {isLoading ? renderLoadingState() : (
              isLocked ? renderLockedState() : (
                groupedTasks ? (
                    groupedTasks.map(([listId, tasksInGroup]) => {
                        const list = allLists.find(l => l.id === listId);
                        const listName = list ? list.name : 'Skrzynka';
                        const listColor = list ? list.color : '#94a3b8';
                        return (
                            <div key={listId} className="mb-6">
                                <div className="flex items-center gap-3 mb-2 px-2">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: listColor || '#94a3b8' }}></span>
                                    <h2 className="text-lg font-bold">{listName}</h2>
                                </div>
                                {tasksInGroup.length > 0 ? renderTaskList(tasksInGroup) : (
                                  <p className="text-sm text-muted-foreground px-2">Brak zadań w tej liście.</p>
                                )}
                            </div>
                        );
                    })
                ) : visibleTasks.length > 0 ? (
                  renderTaskList(visibleTasks)
                ) : (
                  renderEmptyState()
                )
              )
            )}
        </div>
        {!isLocked && (
            <div className="shrink-0 pt-6 space-y-4">
                {hasCompletedTasks && (
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowCompleted(!showCompleted)}>
                            {showCompleted ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
                            {showCompleted ? 'Ukryj ukończone' : 'Pokaż ukończone'}
                        </Button>
                        <Button variant="ghost" onClick={handleDeleteCompleted} className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-2" />
                            Usuń ukończone
                        </Button>
                    </div>
                )}
                <AddTask listId={currentListId} onTaskAdded={onTaskAdded} />
            </div>
        )}
    </div>
  );
}

    