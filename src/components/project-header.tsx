
'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/mock-data';
import type { ProjectView } from './projects-page';
import { LayoutDashboard, KanbanSquare, ListTodo, CalendarDays, GanttChartSquare, FileText, Settings, Link, Github, Figma, Presentation, Blocks, Plus, MessageSquare } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddShortcutDialog } from './add-shortcut-dialog';

interface ProjectHeaderProps {
    project: Project;
    currentView: ProjectView;
    onViewChange: (view: ProjectView) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'board', label: 'Tablica', icon: KanbanSquare },
    { id: 'list', label: 'Lista', icon: ListTodo },
    { id: 'calendar', label: 'Kalendarz', icon: CalendarDays },
    { id: 'timeline', label: 'Oś czasu', icon: GanttChartSquare },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'documents', label: 'Dokumenty', icon: FileText },
    { id: 'whiteboard', label: 'Whiteboard', icon: Blocks },
] as const;

const shortcutItems = [
    { label: 'Repozytorium GitHub', icon: Github, href: '#' },
    { label: 'Projekt Figma', icon: Figma, href: '#' },
    { label: 'Prezentacja', icon: Presentation, href: '#' },
];

export default function ProjectHeader({ project, currentView, onViewChange }: ProjectHeaderProps) {
  const ProjectIcon = project.icon;
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  });
  const [isAddShortcutOpen, setAddShortcutOpen] = useState(false);

  return (
    <>
    <header className="shrink-0 border-b">
        <div className="px-6 py-4">
            <div className="flex items-center gap-3">
                <ProjectIcon className="h-7 w-7 text-muted-foreground" />
                <h1 className="text-2xl font-bold">{project.name}</h1>
            </div>
        </div>
        <div className="px-6">
             <div className="flex items-center gap-2">
                <div className="overflow-hidden flex-grow scrollbar-hide" ref={emblaRef}>
                    <div className="flex items-center -ml-4 whitespace-nowrap">
                        {navItems.map((item) => (
                            <div key={item.id} className="pl-4 flex-shrink-0">
                                <Button
                                    variant="ghost"
                                    onClick={() => onViewChange(item.id)}
                                    className={cn(
                                        'h-9 px-3 rounded-none border-b-2 border-transparent hover:bg-transparent hover:border-primary whitespace-nowrap',
                                        currentView === item.id ? 'border-primary' : ''
                                    )}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
                 <div className="flex-shrink-0" />

                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 px-3">
                             <Link className="mr-2 h-4 w-4" />
                             Skróty
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Linki projektowe</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {shortcutItems.map(item => (
                            <DropdownMenuItem key={item.label} asChild>
                                <a href={item.href} target="_blank" rel="noopener noreferrer">
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </a>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setAddShortcutOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Dodaj skrót
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
            </div>
        </div>
    </header>
    <AddShortcutDialog open={isAddShortcutOpen} onOpenChange={setAddShortcutOpen} />
    </>
  );
}
