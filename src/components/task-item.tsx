'use client';
import type { Task, List } from '@/lib/types';
import { useState, useRef, useEffect, useTransition } from 'react';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, GripVertical, Edit, FolderKanban, Inbox } from 'lucide-react';
import { updateTask, deleteTask, moveTaskToList } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TaskItemProps {
  task: Task;
  lists: List[];
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, newListId: string | null) => void;
  isDraggable?: boolean;
}

export function TaskItem({
  task,
  lists,
  onUpdate,
  onDelete,
  onMove,
  isDraggable = false,
}: TaskItemProps) {
  const [isEditing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  
  const handleCheckboxChange = async (checked: boolean) => {
    const originalTask = { ...task };
    const updatedTask = { ...task, done: !!checked };
    
    startTransition(() => {
      onUpdate(updatedTask);
    });

    try {
      await updateTask(task.id, { done: !!checked });
    } catch (e: any) {
      onUpdate(originalTask);
      toast({ variant: "destructive", title: "Failed to update task", description: e.message });
    }
  };

  const handleNameUpdate = async () => {
    if (!name.trim() || name === task.name) {
        setName(task.name);
        setEditing(false);
        return;
    }
      
    const originalTask = { ...task };
    const updatedTask = { ...task, name };

    startTransition(() => {
      onUpdate(updatedTask);
    });
    setEditing(false);

    try {
      await updateTask(task.id, { name });
    } catch (e: any) {
      onUpdate(originalTask);
      toast({ variant: "destructive", title: "Failed to rename task", description: e.message });
    }
  };

  const handleDelete = async () => {
    const originalTask = { ...task };
    startTransition(() => {
      onDelete(task.id);
    });
    
    try {
      await deleteTask(task.id);
    } catch(e: any) {
        toast({ variant: "destructive", title: "Failed to delete task", description: e.message });
        onUpdate(originalTask); // Re-add the task if delete fails
    }
  };
  
  const handleEditClick = () => {
    setEditing(true);
  }

  const handleMoveToList = (newListId: string | null) => {
    if (task.list_id === newListId) return;

    startTransition(async () => {
      onMove(task.id, newListId);
      try {
        await moveTaskToList(task.id, newListId);
        toast({ title: 'Task moved' });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Failed to move task', description: e.message });
        // Note: Reverting optimistic update would be complex here,
        // relying on re-fetch or a more robust state management.
        // For now, a page refresh would fix inconsistencies.
      }
    });
  };

  return (
    <div
      className={cn(
        'group flex items-center p-2 my-1 rounded-lg transition-all duration-300 ease-in-out border',
        'bg-card',
        task.done ? 'bg-muted/50' : 'hover:bg-muted',
        isEditing ? 'bg-muted/80' : '',
        isPending && 'opacity-70'
      )}
    >
      {isDraggable && (
        <div className="h-5 w-5 mr-2 text-muted-foreground cursor-grab flex items-center justify-center">
            <GripVertical className="h-full w-full" />
        </div>
      )}
      <Checkbox
        id={task.id.toString()}
        checked={task.done}
        onCheckedChange={handleCheckboxChange}
        className="mr-3 h-5 w-5"
        aria-label={`Mark "${task.name}" as ${task.done ? 'not done' : 'done'}`}
      />
      {isEditing ? (
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameUpdate}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNameUpdate();
            if (e.key === 'Escape') {
                setName(task.name);
                setEditing(false);
            }
          }}
          className="flex-1 bg-transparent border-none h-auto p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
        />
      ) : (
        <label
          htmlFor={task.id.toString()}
          onDoubleClick={() => !task.done && setEditing(true)}
          className={cn(
            'flex-1 cursor-pointer transition-colors py-0.5 text-base',
            task.done && 'text-muted-foreground',
            !task.done && 'cursor-text'
          )}
        >
          {task.name}
        </label>
      )}
      <div className="flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
         {!task.done && 
          <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleEditClick}
              aria-label={`Edit task "${task.name}"`}
          >
              <Edit className="h-4 w-4" />
          </Button>
        }
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move task "${task.name}" to another list`}>
              <FolderKanban className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleMoveToList(null)} disabled={task.list_id === null}>
              <Inbox className="mr-2 h-4 w-4" />
              <span>Inbox</span>
            </DropdownMenuItem>
            {lists.map((list) => (
              <DropdownMenuItem
                key={list.id}
                onClick={() => handleMoveToList(list.id)}
                disabled={task.list_id === list.id}
              >
                <span className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: list.color || '#ccc' }} />
                <span>{list.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-400 hover:text-red-500"
          onClick={handleDelete}
          aria-label={`Delete task "${task.name}"`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
