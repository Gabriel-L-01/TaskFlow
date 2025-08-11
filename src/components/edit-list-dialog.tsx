'use client';

import { useState, useEffect } from 'react';
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
import { updateList, revokeAllAccessForList } from '@/lib/actions';
import type { List } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Switch } from './ui/switch';
import { Lock, KeyRound, ShieldOff } from 'lucide-react';
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

const colorPalette = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#a855f7', '#ec4899', '#64748b'
];

interface EditListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: List;
  onListUpdated: (list: List) => void;
  userId: string | null | undefined;
}

export function EditListDialog({ open, onOpenChange, list, onListUpdated, userId }: EditListDialogProps) {
  const [name, setName] = useState(list.name);
  const [color, setColor] = useState(list.color || colorPalette[0]);
  const [isPrivate, setIsPrivate] = useState(list.is_private);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(list.name);
      setColor(list.color || colorPalette[0]);
      setIsPrivate(list.is_private);
      setCurrentPassword('');
      setNewPassword('');
    }
  }, [list, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nazwa jest wymagana' });
      return;
    }
    if (isPrivate && !list.is_private && !newPassword) {
        toast({ variant: 'destructive', title: 'Nowe hasło jest wymagane, aby uczynić listę prywatną.' });
        return;
    }
    
    setSubmitting(true);
    try {
      const result = await updateList(list.id, name, color, isPrivate, currentPassword, newPassword, userId);
      
      if (result.success && result.list) {
        onListUpdated(result.list);
        toast({ title: 'Lista zaktualizowana!', description: `Lista "${name}" została zaktualizowana.` });
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Błąd', description: result.message || 'Nie udało się zaktualizować listy.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Błąd', description: `Nie udało się zaktualizować listy: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeAccess = async () => {
    try {
        const result = await revokeAllAccessForList(list.id, userId ?? null);
        if (result.success) {
            toast({ title: "Sukces", description: "Odwołano dostęp dla wszystkich użytkowników." });
        } else {
            toast({ variant: "destructive", title: "Błąd", description: result.message || "Nie udało się odwołać dostępu." });
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Błąd", description: error.message });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Edytuj listę</DialogTitle>
          <DialogDescription>
            Możesz tutaj zmienić szczegóły listy. Modyfikacja prywatnej listy wymaga aktualnego hasła.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nazwa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                autoComplete='off'
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Kolor</Label>
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
                 <div className="relative h-6 w-6 rounded-full border-2 transition-transform transform hover:scale-110 flex-shrink-0" style={{ borderColor: !colorPalette.includes(color) ? 'hsl(var(--primary))' : 'transparent' }}>
                    <div className="h-full w-full rounded-full" style={{
                        backgroundColor: !colorPalette.includes(color) ? color : 'transparent',
                        backgroundImage: colorPalette.includes(color) ? 'conic-gradient(from 180deg at 50% 50%, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899, #ef4444)' : 'none',
                    }}></div>
                    <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        title="Custom Color"
                    />
                </div>
              </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is-private" className="text-right">Prywatna</Label>
              <div className="col-span-3 flex items-center gap-2">
                 <Switch id="is-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
                 <Lock className={`h-4 w-4 transition-colors ${isPrivate ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            </div>
            
            {list.is_private && (
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-password" className="text-right flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Aktualne
                </Label>
                <Input
                  id="current-password"
                  type="password"
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
                <Label htmlFor="new-password" className="text-right flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Nowe
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="col-span-3"
                  autoComplete="new-password"
                  placeholder={list.is_private ? "Opcjonalnie: Wprowadź nowe hasło" : "Wprowadź nowe hasło"}
                />
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            {list.is_private ? (
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
                                Ta akcja odwoła dostęp dla wszystkich użytkowników. Będą musieli ponownie wprowadzić hasło, aby uzyskać dostęp do tej listy.
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
