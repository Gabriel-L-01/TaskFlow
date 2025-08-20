
'use client';
import type { Task, List, SortOption, Tag } from '@/lib/types';
import { useState, useMemo, useEffect, useTransition } from 'react';
import { TaskItem } from './task-item';
import { AddTask } from './add-task';
import { Button } from './ui/button';
import { deleteCompletedTasks, updateTasksOrder, deleteTask } from '@/lib/actions';
import { Eye, EyeOff, Trash2, ClipboardList, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { TaskDetails } from './task-details';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';

interface TaskListProps {
  tasks: Task[];
  allLists: List[];
  allTags: Tag[];
  listId: string | null | 'all';
  onTasksChange: (tasks: Task[]) => void;
  onTaskAdded: (task: Task) => void;
  onTagAdded: (tag: Tag) => void;
  sortOption: SortOption;
  groupByList?: boolean;
  isLoading: boolean;
  isLocked?: boolean;
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
  showTags: boolean;
  onShowTagsChange: (show: boolean) => void;
}

export function TaskList({ 
  tasks: initialTasks, 
  allLists, 
  allTags,
  listId, 
  onTasksChange, 
  onTaskAdded, 
  onTagAdded,
  sortOption, 
  groupByList = false, 
  isLoading,
  isLocked = false,
  showCompleted,
  onShowCompletedChange,
  showTags,
}: TaskListProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sortedTasks = useMemo(() => {
    const sortableTasks = [...tasks];
    
    sortableTasks.sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }
      if (sortOption === 'order_position') {
        return (a.order_position ?? 0) - (b.order_position ?? 0);
      }
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
    if(selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };
  
  const handleTaskDeleteRequest = (task: Task) => {
    setTaskToDelete(task);
  };
   
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    const originalTasks = [...tasks];
    const newTasks = tasks.filter(t => t.id !== taskToDelete.id);
    setTasks(newTasks);
    onTasksChange(newTasks);
    setTaskToDelete(null);
    
    try {
      await deleteTask(taskToDelete.id);
      toast({ title: 'Zadanie usunięte' });
    } catch(e: any) {
        toast({ variant: "destructive", title: "Nie udało się usunąć zadania", description: e.message });
        onTasksChange(originalTasks);
    }
    return true; // for dialog
  }

  const handleTaskMove = (taskId: string, newListId: string | null) => {
    const taskToMove = tasks.find(t => t.id === taskId);
    if (!taskToMove) return;

    // In 'all' view, update the task's list_id for optimistic UI update.
    if (listId === 'all') {
      const updatedTask = { ...taskToMove, list_id: newListId };
      const newTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
      onTasksChange(newTasks);
    } else {
      // In a specific list view, the task disappears from the current list.
      const newTasks = tasks.filter(t => t.id !== taskId);
      onTasksChange(newTasks);
    }
  };
  
  const handleDeleteCompleted = async () => {
    const originalTasks = [...tasks];
    const completedTaskIds = tasks.filter(t => t.done).map(t => t.id);
    
    if (completedTaskIds.length === 0) return;

    const newTasks = tasks.filter(t => !t.done);
    onTasksChange(newTasks);

    try {
      await deleteCompletedTasks(listId);
    } catch (e) {
      onTasksChange(originalTasks);
      toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się usunąć ukończonych zadań.' });
    }
  };

 const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return;
    }

    if (type === 'TASK') {
        const listIdentifier = destination.droppableId;
        const items = listIdentifier === 'all-tasks' 
          ? sortedTasks.filter(t => !t.done)
          : sortedTasks.filter(t => (t.list_id || 'inbox') === listIdentifier && !t.done);

        const originalItems = [...items];
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);

        const updatedOrder = items.map((item, index) => ({
            ...item,
            order_position: index,
        }));
        
        const fullUpdatedTasks = sortedTasks.map(task => 
            updatedOrder.find(ut => ut.id === task.id) || task
        );

        onTasksChange(fullUpdatedTasks);

        updateTasksOrder(updatedOrder.map(t => ({ id: t.id, order_position: t.order_position })))
            .catch(() => {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to save new task order.' });
                // Revert to original order of all tasks on failure
                onTasksChange(sortedTasks);
            });
    }
  };
  
  const visibleTasks = showCompleted ? sortedTasks : sortedTasks.filter(t => !t.done);
  const hasCompletedTasks = sortedTasks.some(t => t.done);
  
  const groupedTasks = useMemo(() => {
    if (!groupByList) return null;
    
    const groups: { [key: string]: Task[] } = { 'inbox': [] };
    allLists.forEach(l => {
      if(l.has_access) groups[l.id] = []
    });

    visibleTasks.forEach(task => {
        const key = String(task.list_id || 'inbox');
        if (groups[key]) {
            groups[key].push(task);
        }
    });
    
    return Object.entries(groups)
      .filter(([, tasksInGroup]) => tasksInGroup.length > 0)
      .sort(([listIdA], [listIdB]) => {
          if (listIdA === 'inbox') return -1;
          if (listIdB === 'inbox') return 1;
          const listA = allLists.find(l => l.id === listIdA);
          const listB = allLists.find(l => l.id === listIdB);
          return (listA?.order_position ?? 0) - (listB?.order_position ?? 0);
      });

  }, [groupByList, visibleTasks, allLists]);
  
  const currentListId = listId === 'all' ? null : listId;
  const isDraggable = sortOption === 'order_position';
  
  const renderEmptyState = () => (
    <div className="text-center py-16">
      <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Brak zadań w tym widoku</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Dodaj nowe zadanie lub zmień filtry.
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

  const renderTaskList = (tasksToRender: Task[], droppableId: string) => (
      <Droppable droppableId={droppableId} type="TASK">
        {(provided, snapshot) => (
          <div 
            {...provided.droppableProps} 
            ref={provided.innerRef}
            className={cn(
                'min-h-[40px] rounded-lg transition-colors', // Added min-h for drop area
                snapshot.isDraggingOver && 'bg-accent/50'
            )}
          >
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
                      lists={allLists.filter(l => l.has_access)}
                      allTags={allTags}
                      onUpdate={handleTaskUpdate}
                      onDelete={handleTaskDeleteRequest}
                      onMove={handleTaskMove}
                      onSelect={() => setSelectedTask(task)}
                      onTagAdded={onTagAdded}
                      isDraggable={isDraggable && !task.done}
                      showTags={showTags}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
  );

  return (
    <>
    <div className="flex-1 flex flex-col overflow-y-auto p-6 bg-transparent">
       <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-y-auto">
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
                                {renderTaskList(tasksInGroup, listId)}
                            </div>
                        );
                    })
                ) : visibleTasks.length > 0 ? (
                  renderTaskList(visibleTasks, listId === 'all' ? 'all-tasks' : (listId || 'inbox'))
                ) : (
                  renderEmptyState()
                )
              )
            )}
        </div>
      </DragDropContext>
        {!isLocked && (
            <div className="shrink-0 pt-6 space-y-4">
                <div className="flex justify-end gap-2">
                    {hasCompletedTasks && (
                        <Button variant="ghost" onClick={() => onShowCompletedChange(!showCompleted)}>
                            {showCompleted ? <EyeOff className="mr-2" /> : <Eye className="mr-2" />}
                            {showCompleted ? 'Ukryj ukończone' : 'Pokaż ukończone'}
                        </Button>
                    )}
                    {hasCompletedTasks && (
                        <Button variant="ghost" onClick={handleDeleteCompleted} className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-2" />
                            Usuń ukończone
                        </Button>
                    )}
                </div>
                {listId !== 'all' && (
                  <AddTask listId={currentListId} onTaskAdded={onTaskAdded} />
                )}
            </div>
        )}
    </div>
    {selectedTask && (
      <TaskDetails 
        task={selectedTask}
        allTags={allTags}
        allLists={allLists.filter(l => l.has_access)}
        onTaskUpdate={handleTaskUpdate}
        onTaskMove={handleTaskMove}
        onTagAdded={onTagAdded}
        open={!!selectedTask}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedTask(null);
          }
        }}
      />
    )}
     {taskToDelete && (
        <DeleteConfirmationDialog
          open={!!taskToDelete}
          onOpenChange={(isOpen) => !isOpen && setTaskToDelete(null)}
          itemName={taskToDelete.name}
          itemType="task" 
          isPrivate={false}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}
