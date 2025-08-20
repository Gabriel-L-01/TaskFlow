
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
import { ScrollArea } from './ui/scroll-area';
import { type LucideIcon, Link, Github, Figma, Presentation, Plus, FileText, BarChart3, MessageSquare, Smile as SmileIcon, Home, Settings, DollarSign, Award, Cloud, BookOpen, Palette, Film, Mic, Music, Plane, Coffee, Gift, Headphones, Monitor, Smartphone, Tablet, Server, Database, Keyboard, Folder, Image, Video, File, Code, Terminal, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

// A large selection of icons for shortcuts
const shortcutIcons: LucideIcon[] = [
    Link, Github, Figma, Presentation, FileText, BarChart3, MessageSquare, Plus, Folder, Image, Video, File, Code, Terminal, Bot,
    Home, Settings, DollarSign, Award, Cloud, BookOpen, Palette, Film, Mic, Music,
    Plane, Coffee, Gift, SmileIcon, Headphones, Monitor, Smartphone, Tablet, Server,
    Database, Keyboard
];


interface AddShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onShortcutAdded: (shortcut: any) => void; // Placeholder for future implementation
}

export function AddShortcutDialog({ open, onOpenChange }: AddShortcutDialogProps) {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<LucideIcon | null>(Link);
  const [customIcon, setCustomIcon] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const resetState = () => {
    setName('');
    setLink('');
    setSelectedIcon(Link);
    setCustomIcon('');
    setIconSearch('');
    setSubmitting(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !link.trim()) {
      toast({ variant: 'destructive', title: 'Nazwa i link są wymagane' });
      return;
    }
    if (!selectedIcon && !customIcon.trim()) {
      toast({ variant: 'destructive', title: 'Wybierz ikonę lub wprowadź znak' });
      return;
    }

    setSubmitting(true);
    // TODO: Implement actual shortcut creation logic
    console.log({ name, link, icon: selectedIcon ? selectedIcon.displayName : customIcon });

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    toast({ title: 'Skrót dodany!', description: `Skrót "${name}" został pomyślnie dodany.` });
    setSubmitting(false);
    onOpenChange(false);
    resetState();
  };

  const handleIconSelect = (Icon: LucideIcon) => {
    setSelectedIcon(Icon);
    setCustomIcon('');
  }
  
  const handleCustomIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limit to a single character (including emoji)
    if (value.length <= 2) { // Allow for emoji + variation selector
        setCustomIcon(value);
        if (value) {
            setSelectedIcon(null);
        }
    }
  }

  const renderSelectedIcon = () => {
    if (customIcon) {
        return <span className="text-xl">{customIcon}</span>
    }
    if (selectedIcon) {
        const Icon = selectedIcon;
        return <Icon className="h-5 w-5" />
    }
    return <SmileIcon className="h-5 w-5 text-muted-foreground" />;
  }

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return shortcutIcons;
    return shortcutIcons.filter(icon => 
        (icon.displayName || '').toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj nowy skrót</DialogTitle>
          <DialogDescription>
            Szybki dostęp do ważnych linków bezpośrednio z panelu projektu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nazwa skrótu</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="np. Dokumentacja API"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div className="space-y-2">
                <Label>Ikona</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            {renderSelectedIcon()}
                            <span>Wybierz ikonę</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom-icon">Użyj emoji/znaku</Label>
                                <Input
                                    id="custom-icon"
                                    value={customIcon}
                                    onChange={handleCustomIconChange}
                                    placeholder="np. ✨"
                                    className="w-24 text-center text-lg"
                                    maxLength={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Lub wybierz z listy</Label>
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
                                                onClick={() => handleIconSelect(Icon)}
                                                className="aspect-square"
                                                title={Icon.displayName}
                                            >
                                            <Icon className="h-5 w-5" />
                                            </Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Dodawanie...' : 'Dodaj skrót'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
