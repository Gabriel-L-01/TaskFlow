'use client';

import { useState } from 'react';
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
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: 'list' | 'preset';
  isPrivate: boolean;
  onConfirm: (password?: string) => Promise<boolean>;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  isPrivate,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  const resetState = () => {
    setPassword('');
    setError('');
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    setSubmitting(true);
    try {
      const success = await onConfirm(isPrivate ? password : undefined);
      if (success) {
        onOpenChange(false);
      } else {
        if (isPrivate) {
            setError('Nieprawidłowe hasło. Spróbuj ponownie.');
        } else {
            setError(`Nie udało się usunąć ${itemType === 'list' ? 'listy' : 'presetu'}.`);
        }
      }
    } catch (error: any) {
      setError(`Wystąpił błąd: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if(!isOpen) {
        resetState();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
            <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" /> Usuń {itemType === 'list' ? 'listę' : 'preset'}
            </DialogTitle>
            <DialogDescription>
                Czy na pewno chcesz trwale usunąć "{itemName}"? Tej akcji nie można cofnąć.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                {isPrivate && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Hasło</Label>
                        <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="col-span-3"
                        autoComplete="current-password"
                        required
                        />
                    </div>
                )}
                {error && <p className="text-sm text-destructive col-span-4 text-center font-medium">{error}</p>}
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                    Anuluj
                </Button>
                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                    {isSubmitting ? 'Usuwanie...' : 'Usuń'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
