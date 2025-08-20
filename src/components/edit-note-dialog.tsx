
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { updateNote, revokeAllAccessForNote, updateNoteTags, addTagAndAssignToNote } from '@/lib/actions';
import type { Note, PrivacyType, Tag } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Lock, KeyRound, ShieldOff, User, Globe, Tag as TagIcon, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { PasswordInput } from './ui/password-input';
import { CollapsibleBadgeList } from './ui/collapsible-badge-list';

const colorPalette = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#a855f7', '#ec4899', '#64748b'
];

interface EditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note;
  onNoteUpdated: (note: Note) => void;
  userId: string | null | undefined;
  allTags: Tag[];
  onTagAdded: (tag: Tag) => void;
}

export function EditNoteDialog({ open, onOpenChange, note, onNoteUpdated, userId, allTags, onTagAdded }: EditNoteDialogProps) {
  const [localNote, setLocalNote] = useState<Note>(note);
  const [name, setName] = useState(note.name);
  const [color, setColor] = useState(note.color || colorPalette[0]);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyType>(note.type ?? 'public');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [isTagMenuOpen, setTagMenuOpen] = useState(false);
  const { toast } = useToast();
  
  const isPrivate = privacyLevel === 'private';

  useEffect(() => {
    if (open) {
      setLocalNote(note);
      setName(note.name);
      setColor(note.color || colorPalette[0]);
      setPrivacyLevel(note.type ?? 'public');
      setCurrentPassword('');
      setNewPassword('');
    }
  }, [note, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nazwa jest wymagana' });
      return;
    }
     if (isPrivate && note.type !== 'private' && !newPassword) {
        toast({ variant: 'destructive', title: 'Nowe hasło jest wymagane, aby uczynić notatkę prywatną.' });
        return;
    }
    
    setSubmitting(true);
    
     try {
      const result = await updateNote(note.id, { name, color, type: privacyLevel }, currentPassword, newPassword, userId);
      
      if (result.success && result.note) {
        // Pass the locally updated note, which includes tag changes, back up
        onNoteUpdated({ ...result.note, tags: localNote.tags });
        toast({ title: 'Notatka zaktualizowana!', description: `Notatka "${name}" została zaktualizowana.` });
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Błąd', description: result.message || 'Nie udało się zaktualizować notatki.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Błąd', description: `Nie udało się zaktualizować notatki: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAccess = async () => {
    try {
        const result = await revokeAllAccessForNote(note.id, userId ?? null);
        if (result.success) {
            toast({ title: "Sukces", description: "Odwołano dostęp dla wszystkich użytkowników." });
        } else {
            toast({ variant: "destructive", title: "Błąd", description: result.message || "Nie udało się odwołać dostępu." });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Błąd", description: error.message });
    }
  };


  const handlePrivacyChange = () => {
    const levels: PrivacyType[] = ['public', 'private', 'personal'];
    const currentIndex = levels.indexOf(privacyLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    setPrivacyLevel(levels[nextIndex]);
  };

  const handleTagToggle = (tagName: string, isChecked: boolean) => {
    const currentTags = localNote.tags ?? [];
    const newTags = isChecked 
      ? [...currentTags, tagName]
      : currentTags.filter(t => t !== tagName);
    
    const updatedNote = { ...localNote, tags: newTags };
    setLocalNote(updatedNote); // Update local state for instant UI feedback
    
    updateNoteTags(note.id, newTags).catch(() => {
        toast({ variant: "destructive", title: "Błąd", description: "Nie udało się zaktualizować tagów."});
        setLocalNote(note); // Revert on error
    });
  };
  
  const handleTagAdd = (tagName: string) => {
    const newTagName = tagName.trim();
    if (!newTagName) return;

    if (allTags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
        if (!localNote.tags?.includes(newTagName)) {
            handleTagToggle(newTagName, true);
        }
        setTagSearch('');
        return;
    }

    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    addTagAndAssignToNote(note.id, newTagName, randomColor).then(result => {
        if (result.newTag) onTagAdded(result.newTag);
        setLocalNote(result.updatedNote);
        setTagSearch('');
        // Re-open the menu after adding to allow for more selections
        requestAnimationFrame(() => setTagMenuOpen(true));
    }).catch(e => toast({ variant: "destructive", title: "Failed to add tag", description: e.message }));
  };

  const filteredTags = useMemo(() => {
    if (!tagSearch) return allTags;
    const lowercasedSearch = tagSearch.toLowerCase();
    return allTags.filter(tag => tag.name.toLowerCase().includes(lowercasedSearch));
  }, [allTags, tagSearch]);

  const showAddTagOption = useMemo(() => {
    if (!tagSearch.trim()) return false;
    return !allTags.some(tag => tag.name.toLowerCase() === tagSearch.trim().toLowerCase());
  }, [allTags, tagSearch]);

  const privacyConfig = {
    public: { icon: Globe, label: 'Publiczna', description: 'Każdy może zobaczyć tę notatkę.' },
    private: { icon: Lock, label: 'Prywatna', description: 'Wymagane hasło do dostępu.' },
    personal: { icon: User, label: 'Osobista', description: 'Tylko Ty możesz zobaczyć tę notatkę.' },
  };
  const CurrentIcon = privacyConfig[privacyLevel].icon;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Edytuj notatkę</DialogTitle>
          <DialogDescription>
            Możesz tutaj zmienić szczegóły notatki.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-edit-note" className="text-right">Tytuł</Label>
              <Input
                id="name-edit-note"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                autoComplete='off'
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color-edit-note" className="text-right">Kolor</Label>
              <div className="col-span-3 flex items-center gap-2 flex-wrap">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="h-6 w-6 rounded-full border-2 transition-transform transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: c === color ? 'hsl(var(--primary))' : 'transparent' }}
                    onClick={() => setColor(c)}
                  />
                ))}
                 <div className="relative h-6 w-6 rounded-full border-2 transition-transform transform hover:scale-110 flex-shrink-0" style={{ borderColor: !colorPalette.includes(color ?? '') ? 'hsl(var(--primary))' : 'transparent' }}>
                    <div className="h-full w-full rounded-full" style={{
                        backgroundColor: !colorPalette.includes(color ?? '') ? color : 'transparent',
                        backgroundImage: colorPalette.includes(color ?? '') ? 'conic-gradient(from 180deg at 50% 50%, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899, #ef4444)' : 'none',
                    }}></div>
                    <Input
                        type="color"
                        value={color ?? ''}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        title="Custom Color"
                    />
                </div>
              </div>
            </div>
             <div className="grid grid-cols-4 items-start gap-4 pt-2">
              <Label htmlFor="privacy-level" className="text-right pt-2">Prywatność</Label>
              <div className="col-span-3 flex flex-col items-start gap-2">
                 <Button type="button" variant="outline" onClick={handlePrivacyChange} className="w-[120px] justify-start">
                    <CurrentIcon className="mr-2 h-4 w-4" />
                    {privacyConfig[privacyLevel].label}
                 </Button>
                 <p className="text-xs text-muted-foreground">{privacyConfig[privacyLevel].description}</p>
              </div>
            </div>
            
            {(note.type === 'private' || isPrivate) && (
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-password-note" className="text-right flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Aktualne
                </Label>
                <PasswordInput
                  id="current-password-note"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="col-span-3"
                  autoComplete="current-password"
                  placeholder="Wprowadź aktualne hasło"
                />
              </div>
            )}
            
            {isPrivate && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password-note" className="text-right flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Nowe
                </Label>
                <PasswordInput
                  id="new-password-note"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="col-span-3"
                  autoComplete="new-password"
                  placeholder="Opcjonalnie: Wprowadź nowe hasło"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4 pt-2">
                <Label className="text-right pt-2">Tagi</Label>
                <div className="col-span-3 space-y-2">
                     <DropdownMenu open={isTagMenuOpen} onOpenChange={setTagMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                                <TagIcon className="mr-2 h-4 w-4" />
                                Zarządzaj tagami
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[250px]">
                            <DropdownMenuLabel>Zarządzaj tagami</DropdownMenuLabel>
                            <div className="px-2 py-1">
                                <Input 
                                    placeholder="Szukaj lub dodaj tag..."
                                    value={tagSearch}
                                    onChange={(e) => setTagSearch(e.target.value)}
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
                                        checked={localNote.tags?.includes(tag.name)}
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
                    <CollapsibleBadgeList tags={localNote.tags || []} allTags={allTags} />
                </div>
            </div>
          </div>
           <DialogFooter className="sm:justify-between">
            {note.type === 'private' ? (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button">
                            <ShieldOff className="mr-2 h-4 w-4" /> Odwołaj dostęp
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Jesteś pewien?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Ta akcja odwoła dostęp dla wszystkich użytkowników. Będą musieli ponownie wprowadzić hasło, aby uzyskać dostęp do tej notatki.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Anuluj</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRevokeAccess}>Kontynuuj</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : <div />}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
