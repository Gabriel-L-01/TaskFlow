'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Textarea } from './ui/textarea';
import type { PresetTask } from '@/lib/types';
import { updatePresetTask } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { MarkdownDisplay } from './ui/markdown-display';
import { Button } from './ui/button';
import { Edit } from 'lucide-react';

interface PresetTaskDetailsProps {
  task: PresetTask;
  onTaskUpdate: (taskId: string, updates: Partial<PresetTask>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
}

export function PresetTaskDetails({
  task,
  onTaskUpdate,
  open,
  onOpenChange,
  isEditing
}: PresetTaskDetailsProps) {
  const [name, setName] = useState(task.task_name);
  const [description, setDescription] = useState(task.description || '');
  const [originalDescription, setOriginalDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setName(task.task_name);
      const currentDesc = task.description || '';
      setDescription(currentDesc);
      setOriginalDescription(currentDesc);
      setIsEditingDescription(false);
      setIsPreviewing(false);
      isClosingRef.current = false;
    } else {
        if (!isClosingRef.current) {
            handlePanelClose();
        }
    }
  }, [task, open]);
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const saveName = async () => {
    if (name === task.task_name || !name.trim()) {
      setName(task.task_name);
      return;
    }
    
    const originalTaskName = task.task_name;
    onTaskUpdate(task.id, { task_name: name }); // Optimistic update

    startTransition(async () => {
      try {
        await updatePresetTask(task.id, { taskName: name });
      } catch (error) {
        onTaskUpdate(task.id, { task_name: originalTaskName }); // Revert on error
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować nazwy zadania.' });
      }
    });
  };
  
  const saveDescription = async (newDescription: string) => {
    if (newDescription === originalDescription) {
      setIsEditingDescription(false);
      return;
    }
    
    onTaskUpdate(task.id, { description: newDescription }); // Optimistic update
    
    startTransition(async () => {
      try {
        await updatePresetTask(task.id, { description: newDescription });
         setOriginalDescription(newDescription); // Update original description on successful save
      } catch (error) {
        onTaskUpdate(task.id, { description: originalDescription }); // Revert on error
        toast({ variant: 'destructive', title: 'Błąd', description: 'Nie udało się zaktualizować opisu zadania.' });
      } finally {
        setIsEditingDescription(false);
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
    const originalDoneState = task.done;
    onTaskUpdate(task.id, { done: !!checked });

    startTransition(async () => {
       try {
        await updatePresetTask(task.id, { done: !!checked });
      } catch (e: any) {
        onTaskUpdate(task.id, { done: originalDoneState });
        toast({ variant: "destructive", title: "Failed to update task", description: e.message });
      }
    });
  };

   const handleMarkdownCheckboxToggle = (lineIndex: number) => {
    const lines = description.split('\n');
    const line = lines[lineIndex];
    if (!line) return;

    let updatedLine;
    if (line.includes('[ ]')) {
      updatedLine = line.replace('[ ]', '[x]');
    } else if (line.includes('[x]')) {
      updatedLine = line.replace('[x]', '[ ]');
    } else {
      return;
    }
    
    lines[lineIndex] = updatedLine;
    const newDescription = lines.join('\n');
    setDescription(newDescription);
    saveDescription(newDescription);
  };
  
  const handlePanelClose = () => {
    isClosingRef.current = true;
    if (isEditing) {
        saveName();
    }
    if(isEditingDescription) {
        handleFinalSaveDescription();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
        handlePanelClose();
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0">
         <SheetHeader className="p-6 pb-4">
          <SheetTitle className="sr-only">Szczegóły zadania presetu</SheetTitle>
           <div className="flex items-center gap-4">
             <Checkbox
                id={`details-check-preset-${task.id}`}
                checked={task.done}
                onCheckedChange={handleCheckboxChange}
                className="h-6 w-6"
                disabled={!isEditing}
              />
              <Input 
                    value={name}
                    onChange={handleNameChange}
                    onBlur={saveName}
                    placeholder="Nazwa zadania"
                    className="text-2xl font-semibold border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    readOnly={!isEditing}
              />
          </div>
        </SheetHeader>
        <Separator />
        
        <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto min-h-0">
             <div className="w-full flex-1 flex flex-col">
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
                        readOnly={!isEditing}
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
                           <p className="text-sm text-muted-foreground italic">Brak opisu.</p>
                        )}
                    </div>
                )}
           </div>
            <div className="mt-auto pt-4">
                {isEditing ? (
                  isEditingDescription ? (
                    <>
                      <Separator className="mb-4" />
                      <div className="flex justify-between items-center gap-2">
                        <Button variant="outline" onClick={handleCancelDescription} className="flex-1">Anuluj</Button>
                        <Button variant="outline" onClick={() => setIsPreviewing(!isPreviewing)} className="flex-1">
                            {isPreviewing ? 'Edycja' : 'Podgląd'}
                        </Button>
                        <Button onClick={handleFinalSaveDescription} className="flex-1">Zapisz</Button>
                      </div>
                    </>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => setIsEditingDescription(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edytuj opis
                    </Button>
                  )
                ) : null}
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
