
'use client';
import type { List, Preset, User, Settings, Tag, Note } from '@/lib/types';
import { Button } from './ui/button';
import {
  Inbox,
  LayoutList,
  Plus,
  Trash2,
  Edit,
  Info,
  Settings as SettingsIcon,
  Lock,
  Unlock,
  ChevronDown,
  GripVertical,
  LogOut,
  Tag as TagIcon,
  List as ListIcon,
  FolderKanban,
  Globe,
  User as UserIcon,
  Briefcase,
  MoreHorizontal,
  Star,
  UserPlus,
  Heart,
  Notebook,
  UserCheck,
  Calendar,
  Zap,
  CalendarDays,
  Clock,
  TimerOff,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { AddListDialog } from './add-list-dialog';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { deleteList, deletePreset, updateListsOrder, updatePresetsOrder, deleteTag, deleteNote, updateTagsOrder } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { EditListDialog } from './edit-list-dialog';
import { AddPresetDialog } from './add-preset-dialog';
import { EditPresetDialog } from './edit-preset-dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import { AddTagDialog } from './add-tag-dialog';
import { EditTagDialog } from './edit-tag-dialog';
import { mockProjects } from '@/lib/mock-data';
import type { Project } from '@/lib/mock-data';
import { AddProjectDialog } from './add-project-dialog';
import { AddNoteDialog } from './add-note-dialog';
import { EditNoteDialog } from './edit-note-dialog';


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './ui/dialog';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import type { View, ProjectView } from './app-shell';


interface AppSidebarProps {
  lists: List[];
  presets: Preset[];
  tags: Tag[];
  notes: Note[];
  currentView: View;
  onViewChange: (view: View) => void;
  onListsChange: (lists: List[]) => void;
  onPresetsChange: (presets: Preset[]) => void;
  onTagsChange: (tags: Tag[]) => void;
  onNotesChange: (notes: Note[]) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isMobile?: boolean;
  hideLocked: boolean;
  onHideLockedChange: (hide: boolean) => void;
  unlockedLists: Set<string>;
  unlockedPresets: Set<string>;
  user: User | null;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  selectedProjectId: string;
  onProjectSelect: (projectId: string) => void;
}

const SIDEBAR_SECTIONS_KEY = 'taskflow_sidebar_sections';
const DEFAULT_OPEN_SECTIONS = ['lists', 'notes', 'presets', 'tags'];

// Regex to detect emojis
const emojiRegex = /^\p{Emoji}/u;

const timeFilterCycle: View['type'][] = ['overdue', 'today', 'tomorrow', 'this_week'];

export function AppSidebar({
  lists,
  presets,
  tags,
  notes,
  currentView,
  onViewChange,
  onListsChange,
  onPresetsChange,
  onTagsChange,
  onNotesChange,
  onRefresh,
  isRefreshing,
  isMobile = false,
  hideLocked,
  onHideLockedChange,
  unlockedLists,
  unlockedPresets,
  user,
  settings,
  onSettingsChange,
  selectedProjectId,
  onProjectSelect,
}: AppSidebarProps) {
  const [isAddListOpen, setAddListOpen] = useState(false);
  const [isEditListOpen, setEditListOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<List | null>(null);
  
  const [isAddPresetOpen, setAddPresetOpen] = useState(false);
  const [isEditPresetOpen, setEditPresetOpen] = useState(false);
  const [presetToEdit, setPresetToEdit] = useState<Preset | null>(null);

  const [isAddTagOpen, setAddTagOpen] = useState(false);
  const [isEditTagOpen, setEditTagOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);

  const [isAddNoteOpen, setAddNoteOpen] = useState(false);
  const [isEditNoteOpen, setEditNoteOpen] = useState(false);
  const [noteToEdit, setNoteToEdit] = useState<Note | null>(null);

  const [isAddProjectOpen, setAddProjectOpen] = useState(false);
  
  const [projectsState, setProjectsState] = useState<Project[]>(mockProjects);

  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; isPrivate?: boolean; type: 'list' | 'preset' | 'tag' | 'note' } | null>(null);

  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [openSections, setOpenSections] = useState<string[]>(DEFAULT_OPEN_SECTIONS);
  const [lastTimeFilterType, setLastTimeFilterType] = useState<View['type']>('today');

  useEffect(() => {
    try {
      const savedSections = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
      if (savedSections) {
        setOpenSections(JSON.parse(savedSections));
      }
      const savedFilter = localStorage.getItem('checklist_last_time_filter');
      if (savedFilter && timeFilterCycle.includes(savedFilter as any)) {
          setLastTimeFilterType(savedFilter as View['type']);
      }
    } catch (e) {
      setOpenSections(DEFAULT_OPEN_SECTIONS);
    }
  }, []);

  const handleOpenSectionsChange = (value: string[]) => {
    setOpenSections(value);
    try {
      localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(value));
    } catch (e) {
      console.error("Failed to save sidebar state to localStorage");
    }
  };


  const lang = {
    pl: {
      allTasks: "Wszystkie zadania",
      inbox: "Skrzynka",
      assignedToMe: "Przypisane do mnie",
      today: "Dziś",
      tomorrow: "Jutro",
      thisWeek: "Ten tydzień",
      overdue: "Przedawnione",
      timeFilters: "Filtry czasowe",
      lists: "Listy",
      projects: "Projekty",
      presets: "Presety",
      tags: "Tagi",
      notes: "Notatki",
      users: "Użytkownicy",
      favorites: "Ulubione",
      listDeleted: "Lista usunięta",
      listDeletedDesc: "Lista i wszystkie jej zadania zostały usunięte.",
      presetDeleted: "Preset usunięty",
      presetDeletedDesc: "Preset został usunięty.",
      tagDeleted: "Tag usunięty",
      tagDeletedDesc: "Tag został usunięty ze wszystkich zadań.",
      noteDeleted: "Notatka usunięta",
      noteDeletedDesc: "Notatka została usunięta.",
      error: "Błąd",
      deleteListError: "Nie udało się usunąć listy:",
      deletePresetError: "Nie udało się usunąć presetu:",
      deleteTagError: "Nie udało się usunąć tagu:",
      deleteNoteError: "Nie udało się usunąć notatki:",
      areYouSure: "Jesteś pewien?",
      deleteListConfirm: "Ta akcja jest nieodwracalna. Spowoduje trwałe usunięcie listy i wszystkich powiązanych z nią zadań.",
      deletePresetConfirm: "Ta akcja jest nieodwracalna. Spowoduje trwałe usunięcie presetu.",
      deleteTagConfirm: "Ta akcja jest nieodwracalna. Spowoduje trwałe usunięcie tagu i odpięcie go od wszystkich zadań.",
      deleteNoteConfirm: "Ta akcja jest nieodwracalna. Spowoduje trwałe usunięcie notatki.",
      cancel: "Anuluj",
      continue: "Kontynuuj",
      infoTitle: "Witaj w TaskFlow!",
      infoDesc: "To Twoje centrum dowodzenia produktywnością. Stworzone, by pomóc Ci zorganizować zadania, zarządzać projektami i osiągać cele, wszystko w jednym, intuicyjnym miejscu. Korzystaj z kont użytkowników, prywatnych list i personalizacji, aby dostosować aplikację do swoich potrzeb.",
      features: "Kluczowe funkcje:",
      feature1: "Konta użytkowników i synchronizacja w chmurze.",
      feature2: "Prywatne, chronione hasłem listy i presety.",
      feature3: "Personalizacja motywów kolorystycznych i języka.",
      feature4: "Przeciągnij i upuść, aby łatwo zarządzać kolejnością zadań.",
      openSource: "Projekt Open Source",
      openSourceDesc: "TaskFlow jest projektem open-source. Kod źródłowy znajdziesz na GitHubie. Dołącz do nas i pomóż w rozwoju aplikacji!",
      version: "Wersja",
      close: "Zamknij",
      settings: "Ustawienia",
      info: "Informacje",
      logout: "Wyloguj się",
      addToFavorites: "Dodaj do ulubionych",
      removeFromFavorites: "Usuń z ulubionych",
      addPeople: "Dodaj osoby",
      projectSettings: "Ustawienia projektu",
      delete: "Usuń"
    },
    en: {
      allTasks: "All Tasks",
      inbox: "Inbox",
      assignedToMe: "Assigned to me",
      today: "Today",
      tomorrow: "Tomorrow",
      thisWeek: "This Week",
      overdue: "Overdue",
      timeFilters: "Time Filters",
      lists: "Lists",
      projects: "Projects",
      presets: "Presets",
      tags: "Tags",
      notes: "Notes",
      users: "Users",
      favorites: "Favorites",
      listDeleted: "List deleted",
      listDeletedDesc: "The list and all its tasks have been deleted.",
      presetDeleted: "Preset deleted",
      presetDeletedDesc: "The preset has been deleted.",
      tagDeleted: "Tag deleted",
      tagDeletedDesc: "The tag has been removed from all tasks.",
      noteDeleted: "Note deleted",
      noteDeletedDesc: "The note has been deleted.",
      error: "Error",
      deleteListError: "Failed to delete list:",
      deletePresetError: "Failed to delete preset:",
      deleteTagError: "Failed to delete tag:",
      deleteNoteError: "Failed to delete note:",
      areYouSure: "Are you sure?",
      deleteListConfirm: "This action is irreversible. It will permanently delete the list and all its associated tasks.",
      deletePresetConfirm: "This action is irreversible. It will permanently delete the preset.",
      deleteTagConfirm: "This action is irreversible. It will permanently delete the tag and unassign it from all tasks.",
      deleteNoteConfirm: "This action is irreversible. It will permanently delete the note.",
      cancel: "Cancel",
      continue: "Continue",
      infoTitle: "Welcome to TaskFlow!",
      infoDesc: "This is your productivity command center. Designed to help you organize tasks, manage projects, and achieve your goals, all in one intuitive place. Enjoy user accounts, private lists, and personalization to tailor the app to your needs.",
      features: "Key Features:",
      feature1: "User accounts and cloud synchronization.",
      feature2: "Private, password-protected lists and presets.",
      feature3: "Customizable color themes and language settings.",
      feature4: "Drag and drop to easily manage task order.",
      openSource: "Open Source Project",
      openSourceDesc: "TaskFlow is an open-source project. You can find the source code on GitHub. Join us and help develop the application!",
      version: "Version",
      close: "Close",
      settings: "Settings",
      info: "Information",
      logout: "Log out",
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
      addPeople: "Add people",
      projectSettings: "Project settings",
      delete: "Delete"
    }
  };
  const currentLang = settings.language === 'en' ? lang.en : lang.pl;

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    router.push('/');
  };

  const handleListAdded = (newList: List) => {
    onListsChange([...lists, newList]);
  };
  
  const handleListUpdated = (updatedList: List) => {
    onListsChange(lists.map(l => l.id === updatedList.id ? updatedList : l));
  }

  const handleDeleteConfirm = async (id: string, type: 'list' | 'preset' | 'tag' | 'note', password?: string) => {
    try {
      let result: { success: boolean; message?: string } | undefined;
      if (type === 'list') {
        result = await deleteList(id, password, user?.id);
        if (result.success) {
          onListsChange(lists.filter((l) => l.id !== id));
          toast({
            title: currentLang.listDeleted,
            description: currentLang.listDeletedDesc,
          });
          if (currentView.type === 'list' && currentView.id === id) {
            onViewChange({ type: 'all' });
          }
        }
      } else if (type === 'preset') {
        result = await deletePreset(id, password, user?.id);
        if (result.success) {
          onPresetsChange(presets.filter((p) => p.id !== id));
          toast({
            title: currentLang.presetDeleted,
            description: currentLang.presetDeletedDesc,
          });
          if (currentView.type === 'preset' && currentView.id === id) {
            onViewChange({ type: 'all' });
          }
        }
      } else if (type === 'tag') {
        result = await deleteTag(id);
        if (result.success) {
          onTagsChange(tags.filter((t) => t.name !== id));
          toast({
            title: currentLang.tagDeleted,
            description: currentLang.tagDeletedDesc,
          });
        }
      } else if (type === 'note') {
        result = await deleteNote(id, password, user?.id);
        if (result.success) {
            onNotesChange(notes.filter(n => n.id !== id));
            toast({ title: currentLang.noteDeleted, description: currentLang.noteDeletedDesc });
            if(currentView.type === 'note' && currentView.id === id) {
                onViewChange({ type: 'all' });
            }
        }
      }


      if (!result?.success) {
        toast({
          variant: 'destructive',
          title: currentLang.error,
          description: (result as any).message || (type === 'list' ? currentLang.deleteListError : type === 'preset' ? currentLang.deletePresetError : currentLang.deleteTagError),
        });
      }
      return result?.success ?? false;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: currentLang.error,
        description: `${type === 'list' ? currentLang.deleteListError : type === 'preset' ? currentLang.deletePresetError : currentLang.deleteTagError} ${error.message}`,
      });
      return false;
    }
  };
  
  const handleListEditClick = (list: List) => {
    setListToEdit(list);
    setEditListOpen(true);
  };

  const handlePresetAdded = (newPreset: Preset) => {
    onPresetsChange([...presets, newPreset]);
  };

  const handlePresetUpdated = (updatedPreset: Preset) => {
    onPresetsChange(presets.map(p => p.id === updatedPreset.id ? updatedPreset : p));
  };

  const handlePresetEditClick = (preset: Preset) => {
    setPresetToEdit(preset);
    setEditPresetOpen(true);
  };

  const handleTagAdded = (newTag: Tag) => {
    onTagsChange([...tags, newTag]);
  }

  const handleTagUpdated = (updatedTag: Tag) => {
    onTagsChange(tags.map(t => t.name === updatedTag.name ? updatedTag : t));
  }

  const handleTagEditClick = (tag: Tag) => {
    setTagToEdit(tag);
    setEditTagOpen(true);
  }

  const handleNoteAdded = (newNote: Note) => {
    onNotesChange([...notes, newNote]);
  }

  const handleNoteUpdated = (updatedNote: Note) => {
    onNotesChange(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
  }
  
  const handleNoteEditClick = (note: Note) => {
    setNoteToEdit(note);
    setEditNoteOpen(true);
  }
  
  const navClass = cn(
      "flex flex-col w-full p-4 text-foreground",
      isMobile ? "bg-transparent" : "w-64 border-r glass-panel"
  );
  
  const handleToggleFavorite = (projectId: string) => {
    setProjectsState(prevProjects => 
      prevProjects.map(p => 
        p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  };

  const favoriteProjects = useMemo(() => {
    return projectsState.filter(p => p.isFavorite);
  }, [projectsState]);

  const otherProjects = useMemo(() => {
    return projectsState.filter(p => !p.isFavorite);
  }, [projectsState]);
  
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, type, draggableId } = result;

    if (!destination) return;

    // Handle project drag and drop
    if (type === 'project') {
      const startListId = source.droppableId;
      const endListId = destination.droppableId;

      const newProjectsState = [...projectsState];
      const draggedProject = newProjectsState.find(p => p.id === draggableId);
      if (!draggedProject) return;
      
      // If dropped in the same list
      if (startListId === endListId) {
        const list = startListId === 'favorites' ? favoriteProjects : otherProjects;
        const [reorderedItem] = list.splice(source.index, 1);
        list.splice(destination.index, 0, reorderedItem);
        
        // This part is tricky as we need to update the main projectsState based on two separate sorted lists.
        // A simpler approach for now is to just update the isFavorite status if it changes.
        // Re-ordering persistence would require a more complex state update.
        setProjectsState([...favoriteProjects, ...otherProjects]);

      } else { // If moved between lists
        draggedProject.isFavorite = endListId === 'favorites';
      }

      setProjectsState(newProjectsState);
      return;
    }

    // Handle other types of D&D
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    if (type === 'list') {
      const originalLists = [...lists];
      const items = Array.from(lists);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const updatedListsWithOrder = items.map((list, index) => ({
        ...list,
        order_position: index
      }));

      onListsChange(updatedListsWithOrder);

      updateListsOrder(updatedListsWithOrder.map(l => ({ id: l.id, order_position: l.order_position })))
        .catch(() => {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to save new list order.' });
          onListsChange(originalLists);
        });
    }

    if (type === 'preset') {
      const originalPresets = [...presets];
      const items = Array.from(presets);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const updatedPresetsWithOrder = items.map((preset, index) => ({
        ...preset,
        order_position: index
      }));

      onPresetsChange(updatedPresetsWithOrder);

      updatePresetsOrder(updatedPresetsWithOrder.map(p => ({ id: p.id, order_position: p.order_position })))
        .catch(() => {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to save new preset order.' });
          onPresetsChange(originalPresets);
        });
    }

    if (type === 'tag') {
      const originalTags = [...tags];
      const items = Array.from(tags);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const updatedTagsWithOrder = items.map((tag, index) => ({
        ...tag,
        order_position: index
      }));

      onTagsChange(updatedTagsWithOrder);

      updateTagsOrder(updatedTagsWithOrder.map(t => ({ name: t.name, order_position: t.order_position })))
        .catch(() => {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to save new tag order.' });
          onTagsChange(originalTags);
        });
    }

     if (type === 'note') {
      const originalNotes = [...notes];
      const items = Array.from(notes);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      const updatedNotesWithOrder = items.map((note, index) => ({
        ...note,
        order_position: index,
      }));

      onNotesChange(updatedNotesWithOrder);

      // TODO: Implement backend update for notes order
    }
  };

  const renderItemIcon = (item: List | Preset | Note) => {
    const emojiMatch = item.name.match(emojiRegex);
    if (emojiMatch) {
        return (
            <span className="mr-2 h-4 w-4 flex items-center justify-center flex-shrink-0 text-xs">
                {emojiMatch[0]}
            </span>
        );
    }

    switch(item.type) {
      case 'private':
        return unlockedLists.has(item.id) || unlockedPresets.has(item.id) ? 
          <Unlock className="mr-2 h-3 w-3 flex-shrink-0" style={{color: item.color || '#ccc'}}/> :
          <Lock className="mr-2 h-3 w-3 flex-shrink-0" style={{color: item.has_access ? item.color || '#ccc' : '#64748b'}}/>
      case 'personal':
        return <UserIcon className="mr-2 h-3 w-3 flex-shrink-0" style={{color: item.color || '#ccc'}}/>
      case 'public':
      case null: // Default to public for notes for now
      default:
        return <Globe className="mr-2 h-3 w-3 flex-shrink-0" style={{color: item.color || '#ccc'}}/>
    }
  }

  const renderProjectItem = (project: Project, index: number) => {
    const ProjectIcon = project.icon;
    return (
      <Draggable key={project.id} draggableId={project.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="group relative flex items-center"
          >
              <span {...provided.dragHandleProps} className="p-1 cursor-grab">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            </span>
            <Button
              variant="ghost"
              onClick={() => {
                onProjectSelect(project.id);
              }}
              className={cn(
                'w-full justify-start flex-1 pr-8',
                currentView.type === 'projects' && selectedProjectId === project.id && 'bg-accent text-accent-foreground'
              )}
            >
              <ProjectIcon className="mr-2 h-4 w-4" />
              <span className="truncate">{project.name}</span>
            </Button>
            <div className="absolute right-1.5 flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleToggleFavorite(project.id)}>
                    <Star className={cn("mr-2 h-4 w-4", project.isFavorite && "fill-yellow-500 text-yellow-500")} />
                    {project.isFavorite ? currentLang.removeFromFavorites : currentLang.addToFavorites}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {currentLang.addPeople}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => {
                    onViewChange({type: 'projects', view: 'settings'})
                  }}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    {currentLang.projectSettings}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {currentLang.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  const timeFilters: { type: View['type']; label: string; icon: React.ElementType }[] = [
    { type: 'overdue', label: currentLang.overdue, icon: TimerOff },
    { type: 'today', label: currentLang.today, icon: Calendar },
    { type: 'tomorrow', label: currentLang.tomorrow, icon: Sunset },
    { type: 'this_week', label: currentLang.thisWeek, icon: CalendarDays },
  ];
  
  useEffect(() => {
    if (timeFilterCycle.includes(currentView.type as any)) {
      setLastTimeFilterType(currentView.type as View['type']);
    }
  }, [currentView.type]);

  const activeTimeFilter = useMemo(() => {
    const currentActive = timeFilters.find(f => f.type === currentView.type);
    if (currentActive) {
      return currentActive;
    }
    // If not in a time filter view, show the last selected one.
    return timeFilters.find(f => f.type === lastTimeFilterType) || timeFilters[1]; // Default to 'Today'
  }, [currentView.type, lastTimeFilterType, timeFilters]);

  const handleTimeFilterClick = () => {
    // When clicking the main button, go to the last selected filter.
    onViewChange({ type: lastTimeFilterType });
  }

  return (
    <>
      <div className={navClass}>
        <div className="flex items-center justify-center pt-2 pb-0">
            <h1 className="text-2xl font-black text-center text-white">
              TaskFlow
            </h1>
        </div>
        <div className="p-2 mb-4">
          <div className="bg-muted p-1 rounded-lg flex items-center">
            <Button 
                variant={settings.workMode === 'lists' ? 'default' : 'ghost'} 
                onClick={() => onSettingsChange({ workMode: 'lists' })}
                className={cn('flex-1', settings.workMode === 'lists' && 'bg-primary hover:bg-primary/90')}
                style={settings.workMode === 'lists' ? {backgroundColor: 'hsl(var(--primary))'} : {}}
            >
                <ListIcon className="mr-2 h-4 w-4" /> {currentLang.lists}
            </Button>
            <Button 
                variant={settings.workMode === 'projects' ? 'default' : 'ghost'} 
                onClick={() => {
                  if (settings.devMode) {
                    onSettingsChange({ workMode: 'projects' });
                    onViewChange({ type: 'projects', view: 'dashboard' });
                  }
                }}
                disabled={!settings.devMode}
                className={cn('flex-1', settings.workMode === 'projects' && 'bg-primary hover:bg-primary/90')}
                style={settings.workMode === 'projects' ? {backgroundColor: 'hsl(var(--primary))'} : {}}
            >
                <FolderKanban className="mr-2 h-4 w-4" /> {currentLang.projects}
            </Button>
          </div>
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {settings.workMode === 'lists' ? (
            <>
              <Button
                variant="ghost"
                onClick={() => onViewChange({ type: 'all' })}
                className={cn(
                  'w-full justify-start',
                  currentView.type === 'all' && 'bg-accent text-accent-foreground'
                )}
              >
                <LayoutList className="mr-2 h-4 w-4" /> {currentLang.allTasks}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onViewChange({ type: 'list', id: null })}
                className={cn(
                  'w-full justify-start',
                  currentView.type === 'list' &&
                    currentView.id === null &&
                    'bg-accent text-accent-foreground'
                )}
              >
                <Inbox className="mr-2 h-4 w-4" /> {currentLang.inbox}
              </Button>

                <div className="group relative flex items-center">
                    <Button
                        variant="ghost"
                        onClick={handleTimeFilterClick}
                        className={cn(
                            'w-full justify-start flex-1 pr-8',
                            timeFilterCycle.includes(currentView.type as any) && 'bg-accent text-accent-foreground'
                        )}
                    >
                        <activeTimeFilter.icon className="mr-2 h-4 w-4" />
                        <span>{activeTimeFilter.label}</span>
                    </Button>
                    <div className="absolute right-1.5 flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                            {timeFilters.map(filter => (
                                <DropdownMenuItem key={filter.type} onSelect={() => onViewChange({type: filter.type})}>
                                    <filter.icon className="mr-2 h-4 w-4" />
                                    <span>{filter.label}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </div>
              
                <Accordion 
                    type="multiple" 
                    defaultValue={DEFAULT_OPEN_SECTIONS}
                    value={openSections}
                    onValueChange={handleOpenSectionsChange}
                    className="w-full"
                >
                  <AccordionItem value="lists" className="border-b-0">
                    <div className="flex items-center w-full group pr-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setAddListOpen(true);}}>
                          <Plus className="h-4 w-4" />
                      </Button>
                      <AccordionTrigger className="hover:no-underline py-2 flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider justify-start gap-1">
                        <span>{currentLang.lists}</span>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="space-y-1 pt-2">
                      <Droppable droppableId="lists" type="list">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}>
                            {lists.map((list, index) => (
                              <Draggable key={list.id} draggableId={list.id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="group relative flex items-center"
                                    >
                                        <span {...provided.dragHandleProps} className="p-1 cursor-grab">
                                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                        </span>
                                        <Button
                                          variant="ghost"
                                          onClick={() => onViewChange({ type: 'list', id: list.id })}
                                          className={cn(
                                            'w-full justify-start pr-16',
                                            currentView.type === 'list' && currentView.id === list.id && 'bg-accent text-accent-foreground'
                                          )}
                                        >
                                          <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center">
                                              {renderItemIcon(list)}
                                              <span className="truncate">
                                                {list.name.replace(emojiRegex, '')}
                                              </span>
                                            </div>
                                          </div>
                                        </Button>
                                        <div className="absolute right-1.5 flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleListEditClick(list)}>
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setItemToDelete({id: list.id, name: list.name, isPrivate: list.type === 'private', type: 'list'})}>
                                            <Trash2 className="h-3 w-3 text-red-400" />
                                          </Button>
                                        </div>
                                    </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="notes" className="border-b-0">
                    <div className="flex items-center w-full group pr-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setAddNoteOpen(true);}}>
                          <Plus className="h-4 w-4" />
                      </Button>
                      <AccordionTrigger className="hover:no-underline py-2 flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider justify-start gap-1">
                        <span>{currentLang.notes}</span>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="space-y-1 pt-2">
                      <Droppable droppableId="notes" type="note">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}>
                            {notes.map((note, index) => (
                              <Draggable key={note.id} draggableId={note.id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="group relative flex items-center"
                                    >
                                        <span {...provided.dragHandleProps} className="p-1 cursor-grab">
                                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                        </span>
                                        <Button
                                          variant="ghost"
                                          onClick={() => onViewChange({ type: 'note', id: note.id })}
                                          className={cn(
                                            'w-full justify-start pr-16',
                                            currentView.type === 'note' && currentView.id === note.id && 'bg-accent text-accent-foreground'
                                          )}
                                        >
                                          <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center">
                                              {renderItemIcon(note)}
                                              <span className="truncate">
                                                {note.name.replace(emojiRegex, '')}
                                              </span>
                                            </div>
                                          </div>
                                        </Button>
                                        <div className="absolute right-1.5 flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleNoteEditClick(note)}>
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setItemToDelete({id: note.id, name: note.name, isPrivate: note.type === 'private', type: 'note'})}>
                                            <Trash2 className="h-3 w-3 text-red-400" />
                                          </Button>
                                        </div>
                                    </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="presets" className="border-b-0">
                    <div className="flex items-center w-full group pr-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setAddPresetOpen(true);}}>
                          <Plus className="h-4 w-4" />
                      </Button>
                      <AccordionTrigger className="hover:no-underline py-2 flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider justify-start gap-1">
                        <span>{currentLang.presets}</span>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="space-y-1 pt-2">
                      <Droppable droppableId="presets" type="preset">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}>
                            {presets.map((preset, index) => (
                              <Draggable key={preset.id} draggableId={preset.id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="group relative flex items-center"
                                    >
                                      <span {...provided.dragHandleProps} className="p-1 cursor-grab">
                                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                      </span>
                                      <Button
                                        variant="ghost"
                                        onClick={() => onViewChange({ type: 'preset', id: preset.id })}
                                        className={cn(
                                          'w-full justify-start pr-16',
                                          currentView.type === 'preset' && currentView.id === preset.id && 'bg-accent text-accent-foreground'
                                        )}
                                      >
                                        <div className="flex-1 overflow-hidden">
                                          <div className="flex items-center">
                                            {renderItemIcon(preset)}
                                            <span className="truncate">
                                              {preset.name.replace(emojiRegex, '')}
                                            </span>
                                          </div>
                                        </div>
                                      </Button>
                                      <div className="absolute right-1.5 flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePresetEditClick(preset)}>
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setItemToDelete({id: preset.id, name: preset.name, isPrivate: preset.type === 'private', type: 'preset'})}>
                                          <Trash2 className="h-3 w-3 text-red-400" />
                                        </Button>
                                      </div>
                                    </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="tags" className="border-b-0">
                    <div className="flex items-center w-full group pr-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setAddTagOpen(true);}}>
                          <Plus className="h-4 w-4" />
                      </Button>
                      <AccordionTrigger className="hover:no-underline py-2 flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider justify-start gap-1">
                        <span>{currentLang.tags}</span>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="space-y-1 pt-2">
                       <Droppable droppableId="tags" type="tag">
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}>
                            {tags.map((tag, index) => (
                              <Draggable key={tag.name} draggableId={tag.name} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="group relative flex items-center"
                                    >
                                        <span {...provided.dragHandleProps} className="p-1 cursor-grab">
                                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                                        </span>
                                        <Button
                                            variant="ghost"
                                            className={cn('w-full justify-start pr-16')}
                                        >
                                            <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center">
                                                <TagIcon className="mr-2 h-3 w-3 flex-shrink-0" style={{color: tag.color || '#ccc'}}/>
                                                <span className="truncate">
                                                {tag.name}
                                                </span>
                                            </div>
                                            </div>
                                        </Button>
                                        <div className="absolute right-1.5 flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleTagEditClick(tag)}>
                                            <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setItemToDelete({id: tag.name, name: tag.name, type: 'tag'})}>
                                            <Trash2 className="h-3 w-3 text-red-400" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              
            </>
          ) : settings.devMode ? (
            <Accordion type="multiple" defaultValue={['favorites', 'projects']} className="w-full">
              {favoriteProjects.length > 0 && (
                <AccordionItem value="favorites" className="border-b-0">
                   <AccordionTrigger className="hover:no-underline py-2 flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider justify-start gap-1 px-2">
                       <div className="flex items-center gap-2">
                          <Heart className="mr-1 h-4 w-4" />
                          <span>{currentLang.favorites}</span>
                       </div>
                    </AccordionTrigger>
                   <AccordionContent className="space-y-1 pt-2">
                    <Droppable droppableId="favorites" type="project">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                          {favoriteProjects.map((project, index) => renderProjectItem(project, index))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="projects" className="border-b-0">
                <div className="flex items-center w-full group pr-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAddProjectOpen(true)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    <AccordionTrigger className="hover:no-underline py-2 flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider justify-start gap-1">
                      <span>{currentLang.projects}</span>
                    </AccordionTrigger>
                  </div>
                 <AccordionContent className="space-y-1 pt-2">
                   <Droppable droppableId="projects" type="project">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {otherProjects.map((project, index) => renderProjectItem(project, index))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}
        </div>
         </DragDropContext>
         <div className="mt-auto pt-4 space-y-2 border-t">
            <Button
                variant="ghost"
                onClick={() => onViewChange({ type: 'settings' })}
                className={cn('w-full justify-start', (currentView.type === 'settings' || (settings.workMode === 'projects' && currentView.type === 'projects' && currentView.view === 'settings')) && 'bg-accent text-accent-foreground')}
            >
                <SettingsIcon className="mr-2 h-4 w-4" /> {currentLang.settings}
            </Button>
            <Button
                variant="ghost"
                onClick={() => onViewChange({ type: 'info' })}
                className={cn('w-full justify-start', currentView.type === 'info' && 'bg-accent text-accent-foreground')}
            >
                <Info className="mr-2 h-4 w-4" /> {currentLang.info}
            </Button>
             {user && (
                 <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{currentLang.logout}</span>
                </Button>
            )}
        </div>
      </div>
      <AddListDialog open={isAddListOpen} onOpenChange={setAddListOpen} onListAdded={handleListAdded} userId={user?.id} />
      {listToEdit && (
        <EditListDialog 
          open={isEditListOpen} 
          onOpenChange={setEditListOpen} 
          list={listToEdit} 
          onListUpdated={handleListUpdated}
          userId={user?.id} 
        />
      )}
      <AddPresetDialog open={isAddPresetOpen} onOpenChange={setAddPresetOpen} onPresetAdded={handlePresetAdded} userId={user?.id} />
      {presetToEdit && (
          <EditPresetDialog 
            open={isEditPresetOpen} 
            onOpenChange={setEditPresetOpen} 
            preset={presetToEdit} 
            onPresetUpdated={handlePresetUpdated}
            userId={user?.id}
          />
      )}
       <AddTagDialog open={isAddTagOpen} onOpenChange={setAddTagOpen} onTagAdded={handleTagAdded} />
       {tagToEdit && (
        <EditTagDialog 
          open={isEditTagOpen} 
          onOpenChange={setEditTagOpen} 
          tag={tagToEdit} 
          onTagUpdated={handleTagUpdated}
        />
      )}
      <AddNoteDialog open={isAddNoteOpen} onOpenChange={setAddNoteOpen} onNoteAdded={handleNoteAdded} userId={user?.id} />
      {noteToEdit && (
        <EditNoteDialog 
          open={isEditNoteOpen} 
          onOpenChange={setEditNoteOpen} 
          note={noteToEdit} 
          onNoteUpdated={handleNoteUpdated}
          userId={user?.id} 
          allTags={tags}
          onTagAdded={handleTagAdded}
        />
      )}
       <AddProjectDialog open={isAddProjectOpen} onOpenChange={setAddProjectOpen} />
      {itemToDelete && (
        <DeleteConfirmationDialog
          open={!!itemToDelete}
          onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}
          itemName={itemToDelete.name}
          isPrivate={itemToDelete.isPrivate ?? false}
          itemType={itemToDelete.type as any} // Cast because 'note' is not in the original type
          onConfirm={(password) => handleDeleteConfirm(itemToDelete.id, itemToDelete.type as any, password)}
        />
      )}
    </>
  );
}
