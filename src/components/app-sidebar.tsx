'use client';
import type { List, Preset, User, Settings } from '@/lib/types';
import { Button } from './ui/button';
import {
  Inbox,
  LayoutList,
  Plus,
  Trash2,
  Edit,
  Info,
  RefreshCcw,
  Settings as SettingsIcon,
  Lock,
  Unlock,
  Rocket,
  ChevronDown
} from 'lucide-react';
import { AddListDialog } from './add-list-dialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { deleteList, deletePreset } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { EditListDialog } from './edit-list-dialog';
import { AddPresetDialog } from './add-preset-dialog';
import { EditPresetDialog } from './edit-preset-dialog';
import { SettingsDialog } from './settings-dialog';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import Image from 'next/image';
import { useTheme } from 'next-themes';


import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

type View =
  | { type: 'list'; id: string | null }
  | { type: 'all' }
  | { type: 'preset'; id: string };

interface AppSidebarProps {
  lists: List[];
  presets: Preset[];
  currentView: View;
  onViewChange: (view: View) => void;
  onListsChange: (lists: List[]) => void;
  onPresetsChange: (presets: Preset[]) => void;
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
}

export function AppSidebar({
  lists,
  presets,
  currentView,
  onViewChange,
  onListsChange,
  onPresetsChange,
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
}: AppSidebarProps) {
  const [isAddListOpen, setAddListOpen] = useState(false);
  const [isEditListOpen, setEditListOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<List | null>(null);
  
  const [isAddPresetOpen, setAddPresetOpen] = useState(false);
  const [isEditPresetOpen, setEditPresetOpen] = useState(false);
  const [presetToEdit, setPresetToEdit] = useState<Preset | null>(null);

  const [isInfoOpen, setInfoOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; isPrivate: boolean; type: 'list' | 'preset' } | null>(null);

  const { toast } = useToast();
  const { resolvedTheme } = useTheme();


  const lang = {
    pl: {
      allTasks: "Wszystkie zadania",
      inbox: "Skrzynka",
      lists: "Listy",
      presets: "Presety",
      listDeleted: "Lista usunięta",
      listDeletedDesc: "Lista i wszystkie jej zadania zostały usunięte.",
      error: "Błąd",
      deleteListError: "Nie udało się usunąć listy:",
      presetDeleted: "Preset usunięty",
      presetDeletedDesc: "Preset został usunięty.",
      deletePresetError: "Nie udało się usunąć presetu:",
      areYouSure: "Jesteś pewien?",
      deleteListConfirm: "Ta akcja jest nieodwracalna. Spowoduje trwałe usunięcie listy i wszystkich powiązanych z nią zadań.",
      deletePresetConfirm: "Ta akcja jest nieodwracalna. Spowoduje trwałe usunięcie presetu.",
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
    },
    en: {
      allTasks: "All Tasks",
      inbox: "Inbox",
      lists: "Lists",
      presets: "Presets",
      listDeleted: "List deleted",
      listDeletedDesc: "The list and all its tasks have been deleted.",
      error: "Error",
      deleteListError: "Failed to delete list:",
      presetDeleted: "Preset deleted",
      presetDeletedDesc: "The preset has been deleted.",
      deletePresetError: "Failed to delete preset:",
      areYouSure: "Are you sure?",
      deleteListConfirm: "This action is irreversible. It will permanently delete the list and all its associated tasks.",
      deletePresetConfirm: "This action is irreversible. It will permanently delete the preset.",
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
    }
  };
  const currentLang = settings.language === 'en' ? lang.en : lang.pl;

  const handleListAdded = (newList: List) => {
    onListsChange([...lists, newList]);
  };
  
  const handleListUpdated = (updatedList: List) => {
    onListsChange(lists.map(l => l.id === updatedList.id ? updatedList : l));
  }

  const handleDeleteConfirm = async (id: string, type: 'list' | 'preset', password?: string) => {
    try {
      let result;
      if (type === 'list') {
        result = await deleteList(id, password);
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
      } else {
        result = await deletePreset(id, password);
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
      }

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: currentLang.error,
          description: result.message || (type === 'list' ? currentLang.deleteListError : currentLang.deletePresetError),
        });
      }
      return result.success;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: currentLang.error,
        description: `${type === 'list' ? currentLang.deleteListError : currentLang.deletePresetError} ${error.message}`,
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
  
  const navClass = cn(
      "flex flex-col w-full p-4 text-foreground",
      isMobile ? "bg-transparent" : "w-64 border-r glass-panel"
  );


  return (
    <>
      <nav className={navClass}>
        <div className="p-2 mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">TaskFlow</h1>
           <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setInfoOpen(true)}>
              <Info className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
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
          
          <Accordion type="multiple" defaultValue={['lists', 'presets']} className="w-full">
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
                {lists.map((list) => (
                  <div key={list.id} className="group relative flex items-center">
                    <Button
                      variant="ghost"
                      onClick={() => onViewChange({ type: 'list', id: list.id })}
                      className={cn(
                        'w-full justify-start',
                        currentView.type === 'list' && currentView.id === list.id && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center">
                           {list.is_private ? (
                              unlockedLists.has(list.id) ? 
                              <Unlock className="mr-2 h-3 w-3 flex-shrink-0" style={{color: list.color || '#ccc'}}/> :
                              <Lock className="mr-2 h-3 w-3 flex-shrink-0" style={{color: list.has_access ? list.color || '#ccc' : '#64748b'}}/>
                          ) : (
                              <span
                                className="mr-2 h-3 w-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: list.color || '#ccc' }}
                              ></span>
                          )}
                          <span className="truncate">
                            {list.name}
                          </span>
                        </div>
                      </div>
                    </Button>
                    <div className="absolute right-1.5 flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleListEditClick(list)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setItemToDelete({id: list.id, name: list.name, isPrivate: list.is_private, type: 'list'})}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                {presets.map((preset) => (
                  <div key={preset.id} className="group relative flex items-center">
                    <Button
                      variant="ghost"
                      onClick={() => onViewChange({ type: 'preset', id: preset.id })}
                      className={cn(
                        'w-full justify-start',
                        currentView.type === 'preset' && currentView.id === preset.id && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center">
                           {preset.is_private ? (
                                unlockedPresets.has(preset.id) ? 
                                <Unlock className="mr-2 h-3 w-3 flex-shrink-0" style={{color: preset.color || '#ccc'}}/> :
                                <Lock className="mr-2 h-3 w-3 flex-shrink-0" style={{color: preset.has_access ? preset.color || '#ccc' : '#64748b'}}/>
                            ) : (
                                <span
                                  className="mr-2 h-3 w-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: preset.color || '#ccc' }}
                                ></span>
                            )}
                            <span className="truncate">
                              {preset.name}
                            </span>
                        </div>
                      </div>
                    </Button>
                     <div className="absolute right-1.5 flex items-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handlePresetEditClick(preset)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                       <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setItemToDelete({id: preset.id, name: preset.name, isPrivate: preset.is_private, type: 'preset'})}>
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </nav>
      <AddListDialog open={isAddListOpen} onOpenChange={setAddListOpen} onListAdded={handleListAdded} />
      {listToEdit && (
        <EditListDialog 
          open={isEditListOpen} 
          onOpenChange={setEditListOpen} 
          list={listToEdit} 
          onListUpdated={handleListUpdated}
          userId={user?.id} 
        />
      )}
      <AddPresetDialog open={isAddPresetOpen} onOpenChange={setAddPresetOpen} onPresetAdded={handlePresetAdded} />
      {presetToEdit && (
          <EditPresetDialog 
            open={isEditPresetOpen} 
            onOpenChange={setEditPresetOpen} 
            preset={presetToEdit} 
            onPresetUpdated={handlePresetUpdated}
            userId={user?.id}
          />
      )}
      {itemToDelete && (
        <DeleteConfirmationDialog
          open={!!itemToDelete}
          onOpenChange={(isOpen) => !isOpen && setItemToDelete(null)}
          itemName={itemToDelete.name}
          isPrivate={itemToDelete.isPrivate}
          itemType={itemToDelete.type}
          onConfirm={(password) => handleDeleteConfirm(itemToDelete.id, itemToDelete.type, password)}
        />
      )}
      <Dialog open={isInfoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader className="items-center text-center">
                <Image 
                    src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'} 
                    alt="TaskFlow Logo" 
                    width={250} 
                    height={250} 
                />
                <DialogTitle>{currentLang.infoTitle}</DialogTitle>
                <DialogDescription>
                {currentLang.infoDesc}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <h3 className="font-semibold">{currentLang.features}</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>{currentLang.feature1}</li>
                <li>{currentLang.feature2}</li>
                <li>{currentLang.feature3}</li>
                <li>{currentLang.feature4}</li>
                </ul>
                <h3 className="font-semibold">{currentLang.openSource}</h3>
                <p className="text-sm text-muted-foreground">
                    {currentLang.openSourceDesc}
                </p>
            </div>
            <DialogFooter className="sm:justify-between items-center">
                <div className="text-xs text-muted-foreground">
                    {currentLang.version} 1.0
                </div>
                <Button onClick={() => setInfoOpen(false)}>{currentLang.close}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <SettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={onSettingsChange}
        user={user}
      />
    </>
  );
}
