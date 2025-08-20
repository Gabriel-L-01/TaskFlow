
'use client';
import type { Task, List, Tag } from '@/lib/types';
import { useState, useRef, useEffect, useTransition, useMemo } from 'react';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2, GripVertical, Edit, FolderKanban, Inbox, Tag as TagIcon, AlignLeft, Plus, Calendar } from 'lucide-react';
import { updateTask, moveTaskToList, updateTaskTags, addTagAndAssignToTask } from '@/lib/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from './ui/badge';
import { CollapsibleBadgeList } from './ui/collapsible-badge-list';
import { format, isToday, isPast, parseISO } from 'date-fns';

const colorPalette = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#a855f7', '#ec4899', '#64748b'
];

interface TaskItemProps {
  task: Task;
  lists: List[];
  allTags: Tag[];
  onUpdate: (task: Task) => void;
  onDelete: (task: Task) => void;
  onMove: (taskId: string, newListId: string | null) => void;
  onSelect: (task: Task) => void;
  onTagAdded: (tag: Tag) => void;
  isDraggable?: boolean;
  showTags: boolean;
}

export function TaskItem({
  task,
  lists,
  allTags,
  onUpdate,
  onDelete,
  onMove,
  onSelect,
  onTagAdded,
  isDraggable = false,
  showTags,
}: TaskItemProps) {
  const [isEditing, setEditing] = useState(false);
  const [name, setName] = useState(task.name);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [tagSearch, setTagSearch] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [isTagMenuOpen, setTagMenuOpen] = useState(false);
  const [isListMenuOpen, setListMenuOpen] = useState(false);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);
  
  useEffect(() => {
    if (!isTagMenuOpen) setTagSearch('');
    if (!isListMenuOpen) setListSearch('');
  }, [isTagMenuOpen, isListMenuOpen]);

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

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task);
  }
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  }

  const handleMoveToList = (newListId: string | null) => {
    if (task.list_id === newListId) return;

    startTransition(async () => {
      onMove(task.id, newListId);
      try {
        await moveTaskToList(task.id, newListId);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Failed to move task', description: e.message });
        // Note: Reverting optimistic update would be complex here,
        // relying on re-fetch or a more robust state management.
        // For now, a page refresh would fix inconsistencies.
      }
    });
  };

  const handleLabelClick = () => {
    if (!isEditing) {
      onSelect(task);
    }
  };

  const handleTagToggle = (tagName: string, isChecked: boolean) => {
    const currentTags = task.tags ?? [];
    const newTags = isChecked
      ? [...currentTags, tagName]
      : currentTags.filter(t => t !== tagName);

    const originalTask = { ...task };
    const updatedTask = { ...task, tags: newTags };

    startTransition(async () => {
      onUpdate(updatedTask);
      try {
        await updateTaskTags(task.id, newTags);
      } catch (e: any) {
        onUpdate(originalTask);
        toast({ variant: "destructive", title: "Failed to update tags", description: e.message });
      }
    });
  };

  const handleTagAdd = (tagName: string) => {
    const newTagName = tagName.trim();
    if (!newTagName) return;

    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    startTransition(async () => {
      try {
        const result = await addTagAndAssignToTask(task.id, newTagName, randomColor);
        if (result.newTag) {
          onTagAdded(result.newTag);
        }
        onUpdate(result.updatedTask);
        setTagSearch('');
      } catch (e: any) {
        toast({ variant: "destructive", title: "Failed to add tag", description: e.message });
      }
    });
  };

  const sortedTaskTags = useMemo(() => {
    if (!task.tags) return [];
    const tagOrderMap = new Map(allTags.map(t => [t.name, t.order_position]));
    return [...task.tags].sort((a, b) => (tagOrderMap.get(a) ?? 0) - (tagOrderMap.get(b) ?? 0));
  }, [task.tags, allTags]);

  const filteredTags = useMemo(() => {
    if (!tagSearch) {
      return allTags;
    }
    const lowercasedSearch = tagSearch.toLowerCase();
    return allTags
      .filter(tag => tag.name.toLowerCase().includes(lowercasedSearch))
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(lowercasedSearch);
        const bStartsWith = b.name.toLowerCase().startsWith(lowercasedSearch);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [allTags, tagSearch]);
  
  const filteredLists = useMemo(() => {
    if (!listSearch) {
      return lists;
    }
    const lowercasedSearch = listSearch.toLowerCase();
    return lists
      .filter(list => list.name.toLowerCase().includes(lowercasedSearch))
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(lowercasedSearch);
        const bStartsWith = b.name.toLowerCase().startsWith(lowercasedSearch);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [lists, listSearch]);
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent dropdown menu from stealing focus
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === ' ') {
        e.stopPropagation();
    }
  };

  const showInbox = useMemo(() => {
    return 'skrzynka'.includes(listSearch.toLowerCase());
  }, [listSearch]);

    const showAddTagOption = useMemo(() => {
    if (!tagSearch.trim()) return false;
    return !allTags.some(tag => tag.name.toLowerCase() === tagSearch.trim().toLowerCase());
  }, [allTags, tagSearch]);
  
  const dueDateHasTime = task.due_date && format(new Date(task.due_date), 'HH:mm') !== '00:00';
  const date = task.due_date ? parseISO(task.due_date) : null;
  const isOverdue = date && isPast(date) && !isToday(date);
  const isDueToday = date && isToday(date);


  return (
    <div
      className={cn(
        'group flex flex-col items-start p-2 my-1 rounded-lg transition-all duration-300 ease-in-out border',
        'bg-card',
        task.done ? 'bg-muted/50' : 'hover:bg-muted',
        isEditing ? 'bg-muted/80' : '',
        isPending && 'opacity-70'
      )}
    >
      <div className="flex items-center w-full">
        <div className={cn("h-5 w-5 mr-2 flex items-center justify-center self-start mt-1", isDraggable ? "text-muted-foreground cursor-grab" : "text-muted-foreground/30 cursor-default")}>
            <GripVertical className="h-full w-full" />
        </div>
        <Checkbox
          id={task.id.toString()}
          checked={task.done}
          onCheckedChange={handleCheckboxChange}
          className="mr-3 h-5 w-5 self-start mt-1"
          aria-label={`Mark "${task.name}" as ${task.done ? 'not done' : 'done'}`}
        />
        <div className="flex-1 flex flex-col min-w-0" onClick={handleLabelClick}>
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
              <span
                className={cn(
                  'cursor-pointer transition-colors py-0.5 text-base',
                  task.done && 'text-muted-foreground line-through',
                )}
              >
                {task.name}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                {task.description && (
                    <AlignLeft className="h-4 w-4 text-muted-foreground" />
                )}
                {task.due_date && (
                    <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", 
                        isOverdue && !task.done && "text-red-500",
                        isDueToday && !task.done && "text-yellow-500"
                    )}>
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(task.due_date), dueDateHasTime ? "MMM d, p" : "MMM d")}</span>
                    </div>
                )}
                {showTags && sortedTaskTags.length > 0 && (
                  <CollapsibleBadgeList tags={sortedTaskTags} allTags={allTags} />
                )}
            </div>
        </div>
        <div className="flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ml-2 self-start">
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
           <DropdownMenu open={isTagMenuOpen} onOpenChange={setTagMenuOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Manage tags for task "${task.name}"`}>
                    <TagIcon className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px]" onKeyDown={(e) => e.stopPropagation()}>
                <DropdownMenuLabel>Zarządzaj tagami</DropdownMenuLabel>
                 <div className="px-2 py-1">
                  <Input 
                    placeholder="Szukaj lub dodaj tag..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="h-8"
                  />
                </div>
                <DropdownMenuSeparator />
                 <div className="max-h-60 overflow-y-auto">
                    {showAddTagOption && (
                        <DropdownMenuItem onSelect={() => handleTagAdd(tagSearch)}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Dodaj tag: "{tagSearch}"</span>
                        </DropdownMenuItem>
                    )}
                    {filteredTags.map(tag => (
                        <DropdownMenuCheckboxItem
                            key={tag.name}
                            checked={task.tags?.includes(tag.name)}
                            onCheckedChange={(checked) => handleTagToggle(tag.name, checked)}
                            onSelect={(e) => e.preventDefault()}
                        >
                            <span className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: tag.color || '#ccc' }} />
                            {tag.name}
                        </DropdownMenuCheckboxItem>
                    ))}
                </div>
            </DropdownMenuContent>
          </DropdownMenu>
           <DropdownMenu open={isListMenuOpen} onOpenChange={setListMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move task "${task.name}" to another list`}>
                <FolderKanban className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[250px]">
              <DropdownMenuLabel>Przenieś do listy</DropdownMenuLabel>
               <div className="px-2 py-1">
                  <Input 
                    placeholder="Szukaj listy..."
                    value={listSearch}
                    onChange={(e) => setListSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="h-8"
                  />
                </div>
              <DropdownMenuSeparator />
              <div className="max-h-60 overflow-y-auto">
                {showInbox && (
                  <DropdownMenuItem onSelect={() => handleMoveToList(null)} disabled={task.list_id === null}>
                    <div className="flex items-center">
                      <Inbox className="mr-2 h-4 w-4" />
                      <span>Skrzynka</span>
                    </div>
                  </DropdownMenuItem>
                )}
                {filteredLists.map((list) => (
                  <DropdownMenuItem
                    key={list.id}
                    onSelect={() => handleMoveToList(list.id)}
                    disabled={task.list_id === list.id}
                  >
                    <div className="flex items-center">
                      <span className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: list.color || '#ccc' }} />
                      <span>{list.name}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400 hover:text-red-500"
            onClick={handleDeleteClick}
            aria-label={`Delete task "${task.name}"`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
