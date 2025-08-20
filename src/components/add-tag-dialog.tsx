
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
import { addTag } from '@/lib/actions';
import type { Tag } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const colorPalette = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#a855f7', '#ec4899', '#64748b'
];

interface AddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagAdded: (tag: Tag) => void;
}

export function AddTagDialog({ open, onOpenChange, onTagAdded }: AddTagDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(colorPalette[0]);
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nazwa jest wymagana' });
      return;
    }
    
    setSubmitting(true);
    try {
      const newTag = await addTag(name.trim(), color);
      onTagAdded(newTag);
      toast({ title: 'Tag utworzony!', description: `Tag "${name}" został dodany.` });
      onOpenChange(false);
      // Reset form
      setName('');
      setColor(colorPalette[0]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Błąd', description: `Nie udało się utworzyć tagu: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj nowy tag</DialogTitle>
          <DialogDescription>
            Tagi pomagają kategoryzować zadania.
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
                    className="h-6 w-6 rounded-full border-2 transition-transform transform hover:scale-110 flex-shrink-0"
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
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Dodawanie...' : 'Dodaj tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
