
'use client';

import React, { useState, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Component, Construction, TrendingUp, BookCopy, Users, ChevronLeft, ChevronRight, type LucideIcon, Target, Rocket, ShoppingBag, BarChart3, FlaskConical, Heart, Star, Home, Settings, DollarSign, Award, Cloud, BookOpen, Palette, Film, Mic, Music, Plane, Coffee, Gift, Smile, Headphones, Monitor, Smartphone, Tablet, Server, Database, Keyboard, SmileIcon } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Switch } from './ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const icons: LucideIcon[] = [
    Briefcase, Component, Construction, TrendingUp, BookCopy, Users, Target, Rocket, ShoppingBag, BarChart3,
    FlaskConical, Heart, Star, Home, Settings, DollarSign, Award, Cloud, BookOpen, Palette, Film, Mic, Music,
    Plane, Coffee, Gift, Smile, Headphones, Monitor, Smartphone, Tablet, Server, Database, Keyboard
];

const STEPS = [
    { step: 1, title: 'Szczegóły' },
    { step: 2, title: 'Zaproszenia' },
    { step: 3, title: 'Podsumowanie' },
];

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onProjectAdded: (project: any) => void; // TODO: Implement project type
}

export function AddProjectDialog({ open, onOpenChange }: AddProjectDialogProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<LucideIcon>(Briefcase);
  const [iconSearch, setIconSearch] = useState('');
  const [invites, setInvites] = useState<string[]>([]);
  const [currentInvite, setCurrentInvite] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setStep(1);
    setName('');
    setDescription('');
    setSelectedIcon(Briefcase);
    setIconSearch('');
    setInvites([]);
    setCurrentInvite('');
    setIsFavorite(false);
    setSubmitting(false);
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  }

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
        toast({ variant: 'destructive', title: 'Nazwa projektu jest wymagana' });
        return;
    }
    setStep(prev => prev + 1);
  }

  const handleBack = () => {
    setStep(prev => prev - 1);
  }
  
  const handleAddInvite = () => {
    if (currentInvite && /\S+@\S+\.\S+/.test(currentInvite) && !invites.includes(currentInvite)) {
        setInvites([...invites, currentInvite]);
        setCurrentInvite('');
    } else {
        toast({ variant: 'destructive', title: 'Nieprawidłowy lub zduplikowany email'});
    }
  }

  const handleRemoveInvite = (emailToRemove: string) => {
    setInvites(invites.filter(email => email !== emailToRemove));
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    // TODO: Implement actual project creation logic
    console.log({ name, description, icon: selectedIcon.displayName, invites, isFavorite });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({ title: 'Projekt utworzony!', description: `Projekt "${name}" został pomyślnie utworzony.` });
    setSubmitting(false);
    onOpenChange(false);
    resetState();
  };

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return icons;
    return icons.filter(icon =>
      (icon.displayName || '').toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);
  
  const renderStep = () => {
    const CurrentSelectedIcon = selectedIcon;
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <DialogDescription>
              Zacznij od podstawowych informacji o swoim nowym projekcie.
            </DialogDescription>
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa projektu</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Redesign strony internetowej"
              />
            </div>
            <div className="space-y-2">
                <Label>Ikona projektu</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <CurrentSelectedIcon className="h-5 w-5" />
                            <span>Wybierz ikonę</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-2">
                        <div className="space-y-2">
                            <Input
                                placeholder="Szukaj ikony..."
                                value={iconSearch}
                                onChange={(e) => setIconSearch(e.target.value)}
                            />
                            <ScrollArea className="h-40">
                                <div className="grid grid-cols-6 gap-2 py-2">
                                    {filteredIcons.map((Icon, index) => (
                                        <Button 
                                            key={index}
                                            type="button"
                                            variant={selectedIcon === Icon ? 'default' : 'outline'}
                                            size="icon"
                                            onClick={() => setSelectedIcon(Icon)}
                                            className="aspect-square"
                                            title={Icon.displayName}
                                        >
                                        <Icon className="h-5 w-5" />
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis (opcjonalnie)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opisz krótko cel tego projektu."
                rows={3}
              />
            </div>
          </div>
        );
    case 2:
        return (
            <div className="space-y-4">
                 <DialogDescription>
                    Zaproś członków zespołu, wpisując ich adresy e-mail.
                </DialogDescription>
                <div className="flex gap-2">
                    <Input
                        value={currentInvite}
                        onChange={(e) => setCurrentInvite(e.target.value)}
                        placeholder="email@example.com"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddInvite();
                            }
                        }}
                    />
                    <Button type="button" onClick={handleAddInvite}>Zaproś</Button>
                </div>
                <div className="space-y-2 rounded-lg bg-muted p-2 min-h-[80px]">
                    <Label>Zaproszeni członkowie</Label>
                     <div className="flex flex-wrap gap-2">
                        {invites.length === 0 && <p className="text-xs text-muted-foreground p-2">Brak zaproszonych osób.</p>}
                        {invites.map(email => (
                            <Badge key={email} variant="secondary">
                                {email}
                                <button onClick={() => handleRemoveInvite(email)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                    <span className="sr-only">Remove {email}</span>
                                    &times;
                                </button>
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        )
    case 3:
        const Icon = selectedIcon;
        return (
            <div className="space-y-4">
                 <DialogDescription>
                    Sprawdź, czy wszystko się zgadza, a następnie utwórz projekt.
                </DialogDescription>
                <div className="space-y-3 rounded-lg border p-4">
                     <div className="flex items-center gap-3">
                         <Icon className="h-6 w-6 text-muted-foreground" />
                        <h3 className="font-bold text-lg">{name}</h3>
                     </div>
                     {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    <div className="pt-2">
                        <h4 className="font-semibold text-sm mb-2">Członkowie</h4>
                        <div className="flex flex-wrap gap-2">
                            {invites.length > 0 ? invites.map(email => (
                                <Badge key={email} variant="outline">{email}</Badge>
                            )) : <p className="text-xs text-muted-foreground">Brak zaproszonych członków.</p>}
                        </div>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-3 mt-2">
                        <Label htmlFor="favorite-switch" className="flex flex-col gap-1">
                            <span>Dodaj do ulubionych</span>
                            <span className="text-xs font-normal text-muted-foreground">Szybki dostęp z panelu bocznego.</span>
                        </Label>
                        <Switch
                            id="favorite-switch"
                            checked={isFavorite}
                            onCheckedChange={setIsFavorite}
                        />
                    </div>
                </div>
            </div>
        )
      default:
        return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nowy projekt</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center w-full px-2 py-4">
            {STEPS.map((s, index) => (
                <React.Fragment key={s.step}>
                    <div className="flex flex-col items-center">
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center font-bold transition-colors",
                            step > s.step ? "bg-primary text-primary-foreground" :
                            step === s.step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                            {step > s.step ? '✔' : s.step}
                        </div>
                        <p className={cn(
                            "text-xs mt-2 transition-colors",
                             step >= s.step ? "text-primary" : "text-muted-foreground"
                        )}>{s.title}</p>
                    </div>
                    {index < STEPS.length - 1 && (
                        <div className={cn(
                            "flex-1 h-1 transition-colors",
                            step > s.step ? 'bg-primary' : 'bg-muted'
                        )}/>
                    )}
                </React.Fragment>
            ))}
        </div>

        <div className="py-4 min-h-[350px]">
            {renderStep()}
        </div>

        <DialogFooter className="justify-between">
            <div>
              {step > 1 && <Button variant="ghost" onClick={handleBack}><ChevronLeft className="mr-2 h-4 w-4" /> Wstecz</Button>}
            </div>
            <div>
              {step < 3 && <Button onClick={handleNext}>Dalej <ChevronRight className="ml-2 h-4 w-4" /></Button>}
              {step === 3 && <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? 'Tworzenie...' : 'Utwórz projekt'}</Button>}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
