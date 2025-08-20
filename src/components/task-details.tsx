
'use client';

import { useState, useEffect, useTransition, useMemo, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Textarea } from './ui/textarea';
import type { Task, Tag, List, User } from '@/lib/types';
import { updateTask, updateTaskTags, moveTaskToList, addTagAndAssignToTask } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Tag as TagIcon, Edit, CalendarDays, FolderKanban, Inbox, Plus, User as UserIcon, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parse, set, isToday, isPast, parseISO } from 'date-fns';
import { MarkdownDisplay } from './ui/markdown-display';
import { cn } from '@/lib/utils';
import { CollapsibleBadgeList } from './ui/collapsible-badge-list';
import { Avatar, AvatarFallback } from './ui/avatar';
import { getUsersForList } from '@/lib/actions/users';

const colorPalette = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#a855f7', '#ec4899', '#64748b'
];

interface TaskDetailsProps {
  task: Task;
  allTags: Tag[];
  allLists: List[];
  onTaskUpdate: (task: Task) => void;
  onTaskMove: (taskId: string, newListId: string | null) => void;
  onTagAdded: (tag: Tag) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetails({
  task,
  allTags,
  allLists,
  onTaskUpdate,
  onTaskMove,
  onTagAdded,
  open,
  onOpenChange,
}: TaskDetailsProps) {
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description || '');
  const [originalDescription, setOriginalDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const [tagSearch, setTagSearch] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(task.due_date ? new Date(task.due_date) : undefined);
  const [selectedTime, setSelectedTime] = useState(task.due_date ? format(new Date(task.due_date), 'HH:mm') : '');

  const isClosingRef = useRef(false);

  useEffect(() => {
    async function fetchUsers() {
        if(open) {
          const users = await getUsersForList(task.list_id);
          setAssignableUsers(users);
        }
    }
    fetchUsers();
  }, [task.list_id, open])

  useEffect(() => {
    if (open) {
      setName(task.name);
      const currentDesc = task.description || '';
      setDescription(currentDesc);
      setOriginalDescription(currentDesc);
      setIsEditingDescription(false);
      setIsPreviewing(false);
      setSelectedDate(task.due_date ? new Date(task.due_date) : undefined);
      setSelectedTime(task.due_date ? format(new Date(task.due_date), 'HH:mm') : '');
      isClosingRef.current = false;
    } else {
        if (!isClosingRef.current) {
            handlePanelClose();
        }
    }
  }, [task, open]);
  
  useEffect(() => {
    if (!open) {
      setTagSearch('');
      setListSearch('');
    }
  }, [open]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const saveName = async () => {
    if (name === task.name || !name.trim()) {
      setName(task.name);
      return;
    }
    
    const originalTask = { ...task };
    const updatedTask = { ...task, name };
    onTaskUpdate(updatedTask); // Optimistic update

    startTransition(async () => {
      try {
        await updateTask(task.id, { name });
      } catch (error) {
        onTaskUpdate(originalTask); // Revert on error
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować nazwy zadania.' });
      }
    });
  };
  
  const saveDescription = async (newDescription: string) => {
    if (newDescription === originalDescription) {
      if(isEditingDescription) setIsEditingDescription(false);
      return;
    }
    
    const originalTask = { ...task };
    const updatedTask = { ...task, description: newDescription };
    onTaskUpdate(updatedTask); // Optimistic update
    
    startTransition(async () => {
      try {
        await updateTask(task.id, { description: newDescription });
        setOriginalDescription(newDescription); // Update original on success
      } catch (error) {
        onTaskUpdate(originalTask); // Revert on error
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować opisu zadania.' });
      } finally {
        if(isEditingDescription) setIsEditingDescription(false);
      }
    });
  };

  const handleFinalSaveDescription = () => {
    saveDescription(description);
  }

  const handleCancelDescription = () => {
    setDescription(originalDescription);
    setIsEditingDescription(false);
  };
  
  const handleCheckboxChange = async (checked: boolean) => {
    const originalTask = { ...task };
    const updatedTask = { ...task, done: !!checked };
    
    onTaskUpdate(updatedTask);

    startTransition(async () => {
       try {
        await updateTask(task.id, { done: !!checked });
      } catch (e: any) {
        onTaskUpdate(originalTask);
        toast({ variant: "destructive", title: "Failed to update task", description: e.message });
      }
    });
  };

  const handleMoveToList = (newListId: string | null) => {
    if (task.list_id === newListId) return;

    const originalTask = {...task};
    startTransition(async () => {
      onTaskMove(task.id, newListId);
      try {
        await moveTaskToList(task.id, newListId);
        onTaskUpdate({ ...task, list_id: newListId });
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Nie udało się przenieść zadania', description: e.message });
        onTaskMove(task.id, originalTask.list_id); // Revert optimistic move
        onTaskUpdate(originalTask);
      }
    });
  };

  const handleDueDateChange = (newDueDate: string | null) => {
    const originalTask = {...task};
    if (newDueDate === task.due_date) return;

    startTransition(async () => {
        onTaskUpdate({ ...task, due_date: newDueDate });
        try {
            await updateTask(task.id, { due_date: newDueDate });
        } catch(e: any) {
            toast({ variant: "destructive", title: "Failed to update due date", description: e.message });
            onTaskUpdate(originalTask);
        }
    });
  }
  
  const handleSetDueDate = () => {
    if (!selectedDate) {
      handleDueDateChange(null);
      return;
    }
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDate = set(selectedDate, { hours, minutes });
    
    handleDueDateChange(newDate.toISOString());
  }

  const handleAssignUser = (userId: string | null) => {
    const originalTask = {...task};
    const assignee = assignableUsers.find(u => u.id === userId) || null;
    
    startTransition(async () => {
        if(userId === null) {
            onTaskUpdate({ ...task, assignee_id: null, assignee: null });
        } else {
            onTaskUpdate({ ...task, assignee_id: userId, assignee });
        }

        try {
            await updateTask(task.id, { assignee_id: userId });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Failed to assign user", description: e.message });
            onTaskUpdate(originalTask);
        }
    })
  }

  const handleTagToggle = (tagName: string, isChecked: boolean) => {
    const currentTags = task.tags ?? [];
    const newTags = isChecked 
      ? [...currentTags, tagName]
      : currentTags.filter(t => t !== tagName);
    
    const originalTask = { ...task };
    const updatedTask = { ...task, tags: newTags };
    
    startTransition(async () => {
      onTaskUpdate(updatedTask);
      try {
        await updateTaskTags(task.id, newTags);
      } catch (e: any) {
        onTaskUpdate(originalTask);
        toast({ variant: "destructive", title: "Failed to update tags", description: e.message });
      }
    });
  };
  
  const handleTagAdd = (tagName: string) => {
    const newTagName = tagName.trim();
    if (!newTagName) {
        return;
    }
    if (allTags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
        if (!task.tags?.includes(newTagName)) {
            handleTagToggle(newTagName, true);
        }
        setTagSearch('');
        return;
    }

    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    startTransition(async () => {
      try {
        const result = await addTagAndAssignToTask(task.id, newTagName, randomColor);
        if (result.newTag) {
          onTagAdded(result.newTag);
        }
        onTaskUpdate(result.updatedTask);
        setTagSearch('');
      } catch (e: any) {
        toast({ variant: "destructive", title: "Failed to add tag", description: e.message });
      }
    });
  };

  const handleMarkdownCheckboxToggle = (lineIndex: number) => {
    const lines = description.split('\n');
    const line = lines[lineIndex];
    if (!line) return;

    let updatedLine;
    if (line.trim().startsWith('- [ ]')) {
        updatedLine = line.replace('[ ]', '[x]');
    } else if (line.trim().startsWith('- [x]')) {
        updatedLine = line.replace('[x]', '[ ]');
    } else {
        return;
    }
    
    lines[lineIndex] = updatedLine;
    const newDescription = lines.join('\n');
    setDescription(newDescription);
    saveDescription(newDescription);
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
      return allLists;
    }
    const lowercasedSearch = listSearch.toLowerCase();
    return allLists
      .filter(list => list.name.toLowerCase().includes(lowercasedSearch))
      .sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(lowercasedSearch);
        const bStartsWith = b.name.toLowerCase().startsWith(lowercasedSearch);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [allLists, listSearch]);

  const showInbox = useMemo(() => {
    return 'skrzynka'.includes(listSearch.toLowerCase());
  }, [listSearch]);

    const showAddTagOption = useMemo(() => {
    if (!tagSearch.trim()) return false;
    return !allTags.some(tag => tag.name.toLowerCase() === tagSearch.trim().toLowerCase());
  }, [allTags, tagSearch]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete' || e.key === ' ') {
        e.stopPropagation();
    }
  };

  const handlePanelClose = () => {
    isClosingRef.current = true;
    saveName();
    if (isEditingDescription) {
        handleFinalSaveDescription();
    }
    setTagSearch('');
    setListSearch('');
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        handlePanelClose();
    }
    onOpenChange(isOpen);
  };
  
  const currentList = allLists.find(l => l.id === task.list_id);
  
  const dueDateHasTime = task.due_date && format(new Date(task.due_date), 'HH:mm') !== '00:00';
  const date = task.due_date ? parseISO(task.due_date) : null;
  const isOverdue = date && isPast(date) && !isToday(date);
  const isDueToday = date && isToday(date);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4">
            <SheetTitle className="sr-only">Szczegóły zadania</SheetTitle>
            <div className="flex items-center gap-4">
            <Checkbox
                id={`details-check-${task.id}`}
                checked={task.done}
                onCheckedChange={handleCheckboxChange}
                className="h-6 w-6"
                />
                <Input 
                    value={name}
                    onChange={handleNameChange}
                    onBlur={saveName}
                    placeholder="Nazwa zadania"
                    className="text-2xl font-semibold border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                />
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon" className="flex-shrink-0">
                        {task.assignee ? (
                            <Avatar className="h-7 w-7">
                                <AvatarFallback>{task.assignee.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        ) : (
                           <UserPlus className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Przypisz do osoby</DropdownMenuLabel>
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem onSelect={() => handleAssignUser(null)} disabled={!task.assignee_id}>
                        Anuluj przypisanie
                      </DropdownMenuItem>
                       {assignableUsers.map(user => (
                        <DropdownMenuItem key={user.id} onSelect={() => handleAssignUser(user.id)} disabled={task.assignee_id === user.id}>
                           {user.username}
                        </DropdownMenuItem>
                       ))}
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </SheetHeader>
        <Separator />
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
               <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("flex-1",
                       isOverdue && !task.done && "text-red-500 border-red-500/50 hover:text-red-600",
                       isDueToday && !task.done && "text-yellow-500 border-yellow-500/50 hover:text-yellow-600",
                    )}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {task.due_date ? format(new Date(task.due_date), dueDateHasTime ? 'PPP p' : 'PPP') : 'Ustaw termin'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                    />
                    <div className="p-2 border-t">
                       <Input 
                         type="time"
                         value={selectedTime}
                         onChange={(e) => setSelectedTime(e.target.value)}
                         className="w-full"
                       />
                    </div>
                    <div className="p-2 border-t flex gap-2">
                        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => handleDueDateChange(null)}>
                            Wyczyść
                        </Button>
                        <Button size="sm" className="w-full justify-center" onClick={handleSetDueDate}>
                            Ustaw
                        </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                       <Button variant="outline" size="sm" className="flex-1">
                          <FolderKanban className="mr-2 h-4 w-4" />
                          {currentList ? currentList.name : 'Skrzynka'}
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[250px]">
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
                        {showInbox && (
                           <DropdownMenuItem onSelect={() => handleMoveToList(null)} disabled={task.list_id === null}>
                              <Inbox className="mr-2 h-4 w-4" />
                              Skrzynka
                          </DropdownMenuItem>
                        )}
                      {filteredLists.map(list => (
                          <DropdownMenuItem key={list.id} onSelect={() => handleMoveToList(list.id)} disabled={task.list_id === list.id}>
                               <span className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: list.color || '#ccc' }} />
                                {list.name}
                          </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </div>
        
        <Separator />

        <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 w-full flex flex-col" onClick={() => !isEditingDescription && setIsEditingDescription(true)}>
                    {isEditingDescription ? (
                        isPreviewing ? (
                            <div className="w-full flex-1" onClick={() => setIsPreviewing(false)}>
                                <MarkdownDisplay 
                                content={description}
                                onCheckboxToggle={handleMarkdownCheckboxToggle}
                                />
                            </div>
                        ) : (
                            <Textarea
                            id="description"
                            placeholder="Dodaj opis zadania... (obsługuje Markdown)"
                            value={description}
                            onChange={handleDescriptionChange}
                            autoFocus
                            className="flex-1 w-full resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0"
                            />
                        )
                    ) : (
                        <div className="w-full h-full flex-1">
                            {description ? (
                                <MarkdownDisplay
                                content={description}
                                onCheckboxToggle={handleMarkdownCheckboxToggle}
                                />
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Brak opisu. Kliknij, aby edytować.</p>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="mt-auto pt-4">
                {isEditingDescription ? (
                    <>
                    <Separator className="mb-4" />
                    <div className="flex justify-between items-center w-full gap-2">
                        <Button variant="outline" onClick={handleCancelDescription} className="flex-1">Anuluj</Button>
                        <Button variant="outline" onClick={() => setIsPreviewing(!isPreviewing)} className="flex-1">
                            {isPreviewing ? 'Edycja' : 'Podgląd'}
                        </Button>
                        <Button onClick={handleFinalSaveDescription} className="flex-1">Zapisz</Button>
                    </div>
                    </>
                ) : (
                    <Button variant="outline" className="w-full" onClick={() => setIsEditingDescription(true)}>
                        <Edit className="mr-2 h-4 w-4"/>
                        Edytuj opis
                    </Button>
                )}
                </div>
            </div>
        </div>
         
        <Separator />
        <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Tagi</h3>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <TagIcon className="mr-2 h-4 w-4" />
                    Zarządzaj
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[250px]">
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
            </div>
            <div className="flex flex-wrap gap-2 min-h-[28px] items-center">
                {sortedTaskTags.length > 0 ? (
                    <CollapsibleBadgeList 
                    tags={sortedTaskTags}
                    allTags={allTags}
                    />
                ) : (
                <p className="text-sm text-muted-foreground">Brak tagów</p>
                )}
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
