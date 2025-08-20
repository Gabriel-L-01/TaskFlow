'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';
import { addTask } from '@/lib/actions';
import type { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddTaskProps {
  listId: string | null;
  onTaskAdded: (task: Task) => void;
}

export function AddTask({ listId, onTaskAdded }: AddTaskProps) {
  const [name, setName] = useState('');
  const [isFocused, setFocused] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setSubmitting(true);
    try {
      const newTask = await addTask(name, listId);
      onTaskAdded(newTask);
      setName('');
      setFocused(false);
    } catch(err: any) {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to add task: ${err.message}` });
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
          onFocus={() => setFocused(true)}
          onBlur={() => !name && setFocused(false)}
          placeholder="Dodaj zadanie..."
          className={cn(
            "pl-10 py-6 text-lg rounded-full bg-card/80 backdrop-blur-sm border-border focus-visible:ring-offset-0 focus-visible:ring-primary",
            isFocused || name ? "pr-14" : "pr-2" 
          )}
        />
        <div className="absolute right-2">
            <Button 
                type="submit" 
                size="icon"
                disabled={!name.trim() || isSubmitting} 
                className={cn(
                    "rounded-full h-10 w-10 transition-opacity",
                    isFocused || name ? "opacity-100" : "opacity-0"
                )}
            >
                {isSubmitting ? '...' : <Plus className="h-5 w-5" />}
            </Button>
        </div>
      </div>
    </form>
  );
}
