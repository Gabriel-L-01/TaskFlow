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
import { Label } from './ui/label';
import { LockKeyhole } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PasswordInput } from './ui/password-input';

interface UnlockListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  onUnlock: (password: string) => Promise<boolean>;
}

export function UnlockListDialog({ open, onOpenChange, itemName, onUnlock }: UnlockListDialogProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Password is required.');
      return;
    }
    
    setSubmitting(true);
    try {
      const success = await onUnlock(password);
      if (success) {
        toast({ title: 'Item unlocked!', description: `You now have access to "${itemName}".` });
        onOpenChange(false);
        setPassword('');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (error: any) {
      setError(`An error occurred: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if(!isOpen) {
        setPassword('');
        setError('');
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole className="h-5 w-5" /> Unlock Item
          </DialogTitle>
           <DialogDescription>
            The item "{itemName}" is private. Please enter the password to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive col-span-4 text-center font-medium">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Unlocking...' : 'Unlock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
