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
import { addList } from '@/lib/actions';
import type { List, PrivacyType, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Lock, User as UserIcon, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordInput } from './ui/password-input';

const colorPalette = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#3b82f6', '#a855f7', '#ec4899', '#64748b'
];

interface AddListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onListAdded: (list: List) => void;
  userId: string | null | undefined;
}

export function AddListDialog({ open, onOpenChange, onListAdded, userId }: AddListDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(colorPalette[0]);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyType>('public');
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  const isPrivate = privacyLevel === 'private';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Nazwa jest wymagana' });
      return;
    }
    if (isPrivate && !password) {
        toast({ variant: 'destructive', title: 'Hasło jest wymagane dla list prywatnych' });
        return;
    }

    setSubmitting(true);
    try {
      const newList = await addList(name, color, privacyLevel, password, userId);
      onListAdded(newList);
      toast({ title: 'Lista utworzona!', description: `"${name}" została dodana.` });
      onOpenChange(false);
      // Reset form
      setName('');
      setColor(colorPalette[0]);
      setPrivacyLevel('public');
      setPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Błąd', description: `Nie udało się utworzyć listy: ${error.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrivacyChange = () => {
    const levels: PrivacyType[] = ['public', 'private', 'personal'];
    const currentIndex = levels.indexOf(privacyLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    const newLevel = levels[nextIndex];
    
    if (newLevel === 'personal' && !userId) {
        toast({ variant: 'destructive', title: 'Funkcja niedostępna', description: 'Musisz być zalogowany, aby tworzyć listy osobiste.'});
        return;
    }

    setPrivacyLevel(newLevel);
  };

  const privacyConfig = {
    public: { icon: Globe, label: 'Publiczna', description: 'Każdy może zobaczyć tę listę.' },
    private: { icon: Lock, label: 'Prywatna', description: 'Wymagane hasło do dostępu.' },
    personal: { icon: UserIcon, label: 'Osobista', description: 'Tylko Ty możesz zobaczyć tę listę.' },
  };
  const CurrentIcon = privacyConfig[privacyLevel].icon;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj nową listę</DialogTitle>
           <DialogDescription>
            Ustaw nazwę, kolor i poziom prywatności dla swojej nowej listy.
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
            {isPrivate && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Hasło</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  autoComplete="new-password"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Dodawanie...' : 'Dodaj listę'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
