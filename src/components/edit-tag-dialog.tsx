
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
import { updateTagColor } from '@/lib/actions';
import type { Tag } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const colorPalette = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#a855f7', '#ec4899', '#64748b'
];

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag;
  onTagUpdated: (tag: Tag) => void;
}

export function EditTagDialog({ open, onOpenChange, tag, onTagUpdated }: EditTagDialogProps) {
  const [color, setColor] = useState(tag.color || colorPalette[0]);
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setColor(tag.color || colorPalette[0]);
    }
  }, [tag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    try {
      const updatedTag = await updateTagColor(tag.name, color);
      onTagUpdated(updatedTag);
      toast({ title: 'Tag zaktualizowany!', description: `Tag "${tag.name}" został zaktualizowany.` });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Błąd', description: `Nie udało się zaktualizować tagu: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Edytuj tag "{tag.name}"</DialogTitle>
           <DialogDescription>
            Zmień kolor tagu. Nazwa tagu nie może być zmieniona.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
                        value={color ?? ''}
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
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
