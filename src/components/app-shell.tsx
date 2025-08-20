
'use client';

import type { List, Task, Preset, SortOption, User, Settings, PresetTask, Tag, Note } from '@/lib/types';
import { useState, useEffect, useMemo, useTransition } from 'react';
import { AppSidebar } from './app-sidebar';
import { TaskList } from './task-list';
import { AppHeader } from './app-header';
import { getLists, getTasks, getPresets, getPresetTasks, getListTasks, verifyListPassword, verifyPresetPassword, updateUserSettings, getTags, getNotes, deleteNote, updateNote, verifyNotePassword, getUsers } from '@/lib/actions';
import { Skeleton } from './ui/skeleton';
import { PresetTaskList } from './preset-task-list';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { UnlockListDialog } from './unlock-list-dialog';
import { cn } from '@/lib/utils';
import SettingsPage from './settings-page';
import InfoPage from './info-page';
import ProjectsPage, { type ProjectView } from './projects-page';
import { mockProjects } from '@/lib/mock-data';
import NoteView from './note-view';
import { isToday, isTomorrow, isThisWeek, parseISO, isPast } from 'date-fns';


export type View =
  | { type: 'list'; id: string | null }
  | { type: 'all' }
  | { type: 'preset'; id: string }
  | { type: 'note'; id: string }
  | { type: 'settings' }
  | { type: 'info' }
  | { type: 'projects'; view?: ProjectView }
  | { type: 'assigned_to_me' }
  | { type: 'today' }
  | { type: 'tomorrow' }
  | { type: 'this_week' }
  | { type: 'overdue' };

const TIME_FILTER_TYPES: View['type'][] = ['today', 'tomorrow', 'this_week', 'overdue'];


export default function AppShell({
  initialLists,
  initialTasks,
  initialPresets,
  initialTags,
  initialNotes,
  allUsers,
  user,
  settings,
  onSettingsChange,
  initialView,
}: {
  initialLists: List[];
  initialTasks: Task[];
  initialPresets: Preset[];
  initialTags: Tag[];
  initialNotes: Note[];
  allUsers: User[];
  user: User | null;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  initialView: View;
}) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [presets, setPresets] = useState<Preset[]>(initialPresets);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [users, setUsers] = useState<User[]>(allUsers);
  const [presetTasks, setPresetTasks] = useState<PresetTask[]>([]);
  const [view, setView] = useState<View>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setInitialLoad] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [sortOption, setSortOption] = useState<SortOption>('order_position');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [itemToUnlock, setItemToUnlock] = useState<{ type: 'list' | 'preset' | 'note'; item: List | Preset | Note } | null>(null);
  
  const [unlockedLists, setUnlockedLists] = useState<Set<string>>(() => 
    new Set(initialLists.filter(l => l.type === 'private' && l.has_access).map(l => l.id))
  );
  const [unlockedPresets, setUnlockedPresets] = useState<Set<string>>(() => 
    new Set(initialPresets.filter(p => p.type === 'private' && p.has_access).map(p => p.id))
  );
   const [unlockedNotes, setUnlockedNotes] = useState<Set<string>>(() => 
    new Set(initialNotes.filter(n => n.type === 'private' && n.has_access).map(n => n.id))
  );
  
  const [projectView, setProjectView] = useState<ProjectView>('dashboard');

  const [isAssignedToMeFilterActive, setAssignedToMeFilterActive] = useState(false);
  const [lastViewBeforeFilter, setLastViewBeforeFilter] = useState<View>(initialView);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    try {
        const savedProjectId = localStorage.getItem('checklist_last_project_id');
        return savedProjectId ? JSON.parse(savedProjectId) : mockProjects[0].id;
    } catch {
        return mockProjects[0].id;
    }
  });

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    localStorage.setItem('checklist_last_project_id', JSON.stringify(projectId));
    // When project changes, always go to dashboard
    setView({ type: 'projects', view: 'dashboard' });
  }
  
   useEffect(() => {
    setLists(initialLists);
    setTasks(initialTasks);
    setPresets(initialPresets);
    setTags(initialTags);
    setNotes(initialNotes);
    setUsers(allUsers);
    
    const initialUnlockedLists = new Set(initialLists.filter(l => l.has_access && l.type === 'private').map(l => l.id));
    setUnlockedLists(initialUnlockedLists);
    
    const initialUnlockedPresets = new Set(initialPresets.filter(p => p.has_access && p.type === 'private').map(p => p.id));
    setUnlockedPresets(initialUnlockedPresets);
    
    const initialUnlockedNotes = new Set(initialNotes.filter(n => n.has_access && n.type === 'private').map(n => n.id));
    setUnlockedNotes(initialUnlockedNotes);

  }, [initialLists, initialTasks, initialPresets, initialTags, initialNotes, allUsers]);


  const handleHideLockedChange = (hide: boolean) => {
    onSettingsChange({ hideLocked: hide });
    if (user) {
        updateUserSettings(user.id, { hideLocked: hide });
    }
  };

  const handleGroupByListChange = (group: boolean) => {
    onSettingsChange({ groupByList: group });
    if (user) {
        updateUserSettings(user.id, { groupByList: group });
    }
  };
  
  const handleShowCompletedChange = (show: boolean) => {
    onSettingsChange({ showCompleted: show });
    if (user) {
        updateUserSettings(user.id, { showCompleted: show });
    }
  };

  const handleShowTagsChange = (show: boolean) => {
    onSettingsChange({ showTags: show });
    if (user) {
        updateUserSettings(user.id, { showTags: show });
    }
  };

  async function fetchData() {
    setIsLoading(true);
    const [fetchedLists, fetchedTasks, fetchedPresets, fetchedTags, fetchedNotes, fetchedUsers] = await Promise.all([
      getLists(user?.id, settings.hideLocked), 
      getTasks(user?.id),
      getPresets(user?.id, settings.hideLocked),
      getTags(),
      getNotes(user?.id, settings.hideLocked),
      getUsers(),
    ]);
    setLists(fetchedLists);
    setTasks(fetchedTasks);
    setPresets(fetchedPresets);
    setTags(fetchedTags);
    setNotes(fetchedNotes);
    setUsers(fetchedUsers);
    setIsLoading(false);
    setInitialLoad(false);
  }

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, [settings.hideLocked, user]);
  
   useEffect(() => {
    // Save current view to localStorage whenever it changes
    try {
      localStorage.setItem('checklist_last_view', JSON.stringify(view));
      if (TIME_FILTER_TYPES.includes(view.type)) {
        localStorage.setItem('checklist_last_time_filter', view.type);
      }
    } catch (error) {
      console.error("Could not save view to localStorage", error);
    }
    
    if (view.type === 'projects' && view.view) {
        setProjectView(view.view);
    }

    const fetchContent = async () => {
      if (settings.workMode === 'lists') {
        setIsLoading(true);
        if (view.type === 'all' || view.type === 'assigned_to_me' || TIME_FILTER_TYPES.includes(view.type)) {
            const allTasks = await getTasks(user?.id);
            setTasks(allTasks);
        } else if (view.type === 'preset') {
          const preset = presets.find(p => p.id === view.id);
          if (preset?.type === 'private' && !unlockedPresets.has(preset.id)) {
            setItemToUnlock({ type: 'preset', item: preset });
          } else {
            const fetchedPresetTasks = await getPresetTasks(view.id);
            setPresetTasks(fetchedPresetTasks);
          }
        } else if (view.type === 'list' && view.id) {
          const list = lists.find(l => l.id === view.id);
          if (list?.type === 'private' && !unlockedLists.has(list.id)) {
            setItemToUnlock({ type: 'list', item: list });
          } else {
            const listTasks = await getListTasks(view.id);
            setTasks(prev => [...prev.filter(t => t.list_id !== view.id), ...listTasks]);
          }
        }
        setIsLoading(false);
      }
    };

    startTransition(fetchContent);
    
  }, [view, lists, presets, unlockedLists, unlockedPresets, user, settings.workMode]);


  const handleRefresh = () => {
    startTransition(async () => {
      setIsLoading(true);
      await fetchData();
       setIsLoading(false);
    });
  }

  const currentItem = useMemo(() => {
    if (view.type === 'list' && view.id) {
      return lists.find(l => l.id === view.id) || null;
    }
    if (view.type === 'preset' && view.id) {
      return presets.find(p => p.id === view.id) || null;
    }
    if (view.type === 'note' && view.id) {
      return notes.find(n => n.id === view.id) || null;
    }
    return null;
  }, [view, lists, presets, notes]);

  const currentListName = useMemo(() => {
    const lang = settings.language === 'en' ? 
      { allTasks: 'All Tasks', inbox: 'Inbox', list: 'List', preset: 'Preset', focus: 'Focus Mode', settings: 'Settings', info: 'Information', projects: 'Projects', note: 'Note', assignedToMe: 'Assigned to me', today: 'Today', tomorrow: 'Tomorrow', thisWeek: 'This Week', overdue: 'Overdue' } : 
      { allTasks: 'Wszystkie zadania', inbox: 'Skrzynka', list: 'Lista', preset: 'Preset', focus: 'Tryb skupienia', settings: 'Ustawienia', info: 'Informacje', projects: 'Projekty', note: 'Notatka', assignedToMe: 'Przypisane do mnie', today: 'Dziś', tomorrow: 'Jutro', thisWeek: 'Ten tydzień', overdue: 'Przedawnione' };
    
    if (view.type === 'settings') return lang.settings;
    if (view.type === 'info') return lang.info;

    if (settings.workMode === 'projects' && settings.devMode) {
      return mockProjects.find(p => p.id === selectedProjectId)?.name || lang.projects;
    }

    if (view.type === 'all') return lang.allTasks;
    if (view.type === 'today') return lang.today;
    if (view.type === 'tomorrow') return lang.tomorrow;
    if (view.type === 'this_week') return lang.thisWeek;
    if (view.type === 'overdue') return lang.overdue;
    if (view.type === 'list' && view.id === null) return lang.inbox;
    if (view.type === 'list') {
      return lists.find((l) => l.id === view.id)?.name || lang.list;
    }
    if (view.type === 'preset') {
      return presets.find((p) => p.id === view.id)?.name || lang.preset;
    }
     if (view.type === 'note') {
      return notes.find((n) => n.id === view.id)?.name || lang.note;
    }
    
    return lang.focus;
  }, [view, lists, presets, notes, users, settings.language, settings.workMode, selectedProjectId, user, settings.devMode]);
  
  const handleAssignedToMeToggle = () => {
    const isActivating = !isAssignedToMeFilterActive;
    setAssignedToMeFilterActive(isActivating);
  };

  const handleViewChange = (newView: View) => {
    if (settings.workMode === 'projects' && view.type === 'projects' && newView.type === 'projects') {
      setView(newView);
      return;
    }
    
    setAssignedToMeFilterActive(false);

    if (newView.type === 'list' && newView.id) {
        const list = lists.find(l => l.id === newView.id);
        if (list?.type === 'private' && !unlockedLists.has(list.id)) {
            setItemToUnlock({ type: 'list', item: list });
            return; 
        }
    }
    if (newView.type === 'preset') {
        const preset = presets.find(p => p.id === newView.id);
        if (preset?.type === 'private' && !unlockedPresets.has(preset.id)) {
            setItemToUnlock({ type: 'preset', item: preset });
            return;
        }
    }
    if (newView.type === 'note') {
        const note = notes.find(n => n.id === view.id);
        if (note?.type === 'private' && !unlockedNotes.has(note.id)) {
            setItemToUnlock({ type: 'note', item: note });
            return;
        }
    }
    setView(newView);
    setSidebarOpen(false); // Close mobile sidebar on navigation
  };

  const filteredTasks = useMemo(() => {
    let tempTasks: Task[];
    const viewToFilter = view;

    // Primary view filter (list, today, all, etc.)
    switch (viewToFilter.type) {
      case 'all':
        tempTasks = tasks.filter(task => {
          if (!task.list_id) return true;
          const list = lists.find(l => l.id === task.list_id);
          return list && (list.type !== 'private' || unlockedLists.has(list.id));
        });
        break;
      case 'list':
        tempTasks = tasks.filter((task) => task.list_id === viewToFilter.id);
        break;
      case 'today':
        tempTasks = tasks.filter(task => task.due_date && isToday(parseISO(task.due_date)));
        break;
      case 'tomorrow':
        tempTasks = tasks.filter(task => task.due_date && isTomorrow(parseISO(task.due_date)));
        break;
      case 'this_week':
        tempTasks = tasks.filter(task => task.due_date && isThisWeek(parseISO(task.due_date), { weekStartsOn: 1 }));
        break;
      case 'overdue':
        tempTasks = tasks.filter(task => task.due_date && isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date)) && !task.done);
        break;
      default:
        tempTasks = [];
        break;
    }
    
    if (isAssignedToMeFilterActive) {
      return tempTasks.filter(task => task.assignee_id === user?.id);
    }
    
    return tempTasks;
  }, [view, lastViewBeforeFilter, isAssignedToMeFilterActive, tasks, lists, unlockedLists, user]);
  
  
  const handleTaskAdded = (newTask: Task) => {
      setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleTagAdded = (newTag: Tag) => {
      setTags(prevTags => [...prevTags, newTag]);
  };
  
  const handleNoteAdded = (newNote: Note) => {
    setNotes(prev => [...prev, newNote]);
  }
  
  const handleNoteUpdated = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
     startTransition(async () => {
        await updateNote(updatedNote.id, {
            name: updatedNote.name,
            content: updatedNote.content,
            color: updatedNote.color,
            type: updatedNote.type
        });
     });
  }

  const handleUnlockSuccess = (type: 'list' | 'preset' | 'note', id: string) => {
    if (type === 'list') {
        setUnlockedLists(prev => new Set(prev).add(id));
        setLists(prev => prev.map(l => l.id === id ? { ...l, has_access: true } : l));
    } else if (type === 'preset') {
        setUnlockedPresets(prev => new Set(prev).add(id));
        setPresets(prev => prev.map(p => p.id === id ? { ...p, has_access: true } : p));
    } else {
        setUnlockedNotes(prev => new Set(prev).add(id));
        setNotes(prev => prev.map(n => n.id === id ? { ...n, has_access: true } : n));
    }
    setItemToUnlock(null);
    if ((view.type !== type) || (view.type === type && view.id !== id)) {
       setView({ type: type, id: id });
    }
  };

  useEffect(() => {
      if (user) {
        setInitialLoad(false);
      } else {
          setTimeout(() => setInitialLoad(false), 500);
      }
  }, [user]);

  const renderContent = () => {
    if (view.type === 'settings') {
      return <SettingsPage settings={settings} onSettingsChange={onSettingsChange} user={user} />;
    }
    if (view.type === 'info') {
      return <InfoPage language={settings.language} onSettingsChange={onSettingsChange} />;
    }
    
    if (settings.workMode === 'projects' && settings.devMode) {
      return <ProjectsPage selectedProjectId={selectedProjectId} currentView={projectView} onViewChange={handleViewChange} />;
    }
    
    switch (view.type) {
      case 'preset':
        return (
          <PresetTaskList
            key={`preset-${view.id}`}
            presetId={view.id}
            initialTasks={presetTasks}
            onTasksChange={setPresetTasks}
            isLoading={isLoading || isPending}
            isLocked={presets.find(p => p.id === view.id)?.type === 'private' && !unlockedPresets.has(view.id)}
          />
        );
      case 'note': {
        const note = notes.find(n => n.id === view.id);
        const isLocked = note?.type === 'private' && !unlockedNotes.has(note.id);
        if (!note) return null; // or a not found component
        return (
            <NoteView 
              note={note} 
              allTags={tags}
              onNoteUpdate={handleNoteUpdated}
              isLocked={isLocked}
            />
        )
      }
      case 'list':
      case 'all':
      case 'today':
      case 'tomorrow':
      case 'this_week':
      case 'overdue':
        const isGroupingEnabled = settings.groupByList && (
            TIME_FILTER_TYPES.includes(view.type) || 
            view.type === 'all' || 
            (isAssignedToMeFilterActive && view.type === 'all')
        );

        return (
          <TaskList
            key={view.type === 'list' ? view.id || 'inbox' : view.type}
            tasks={filteredTasks}
            onTasksChange={setTasks}
            onTaskAdded={handleTaskAdded}
            allLists={lists}
            allTags={tags}
            onTagAdded={handleTagAdded}
            listId={view.type === 'list' ? view.id : 'all'} // 'all' is a placeholder for non-list views
            sortOption={sortOption}
            groupByList={isGroupingEnabled}
            isLoading={isLoading}
            isLocked={view.type === 'list' && view.id ? lists.find(l => l.id === view.id)?.type === 'private' && !unlockedLists.has(view.id) : false}
            showCompleted={settings.showCompleted}
            onShowCompletedChange={handleShowCompletedChange}
            showTags={settings.showTags}
            onShowTagsChange={handleShowTagsChange}
          />
        );
      default:
        return null;
    }
  };
      
    if (isInitialLoad) {
        return (
            <div className="flex h-screen w-full items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                    </div>
                </div>
            </div>
        )
    }

  return (
    <>
    <div className="flex h-screen w-full bg-transparent">
       <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-r-0 glass-panel">
          <AppSidebar
            lists={lists}
            presets={presets}
            tags={tags}
            notes={notes}
            currentView={view}
            onViewChange={handleViewChange}
            onListsChange={setLists}
            onPresetsChange={setPresets}
            onTagsChange={setTags}
            onNotesChange={setNotes}
            onRefresh={handleRefresh}
            isRefreshing={isLoading || isPending}
            isMobile={true}
            hideLocked={settings.hideLocked}
            onHideLockedChange={handleHideLockedChange}
            unlockedLists={unlockedLists}
            unlockedPresets={unlockedPresets}
            user={user}
            settings={settings}
            onSettingsChange={onSettingsChange}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
          />
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex">
         <AppSidebar
            lists={lists}
            presets={presets}
            tags={tags}
            notes={notes}
            currentView={view}
            onViewChange={handleViewChange}
            onListsChange={setLists}
            onPresetsChange={setPresets}
            onTagsChange={setTags}
            onNotesChange={setNotes}
            onRefresh={handleRefresh}
            isRefreshing={isLoading || isPending}
            hideLocked={settings.hideLocked}
            onHideLockedChange={handleHideLockedChange}
            unlockedLists={unlockedLists}
            unlockedPresets={unlockedPresets}
            user={user}
            settings={settings}
            onSettingsChange={onSettingsChange}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
          />
      </div>

      <main className="flex flex-1 flex-col overflow-hidden">
        {settings.workMode !== 'projects' && (
          <AppHeader
            listName={currentListName}
            currentItem={currentItem}
            onSortChange={setSortOption}
            sortOption={sortOption}
            onGroupByListChange={handleGroupByListChange}
            groupByList={settings.groupByList}
            showGroupingOption={(TIME_FILTER_TYPES.includes(view.type) || view.type === 'all' || (isAssignedToMeFilterActive && view.type === 'all'))}
            onMenuClick={() => setSidebarOpen(true)}
            onRefresh={handleRefresh}
            isRefreshing={isLoading || isPending}
            settings={settings}
            currentView={view}
            showTags={settings.showTags}
            onShowTagsChange={handleShowTagsChange}
            onAssignedToMeToggle={handleAssignedToMeToggle}
            isAssignedToMeActive={isAssignedToMeFilterActive}
          />
        )}
        {renderContent()}
      </main>
    </div>
    {itemToUnlock && (
      <UnlockListDialog
        open={!!itemToUnlock}
        onOpenChange={(isOpen) => !isOpen && setItemToUnlock(null)}
        itemName={itemToUnlock.item.name}
        onUnlock={async (password) => {
          let result;
          if (itemToUnlock.type === 'list') {
            result = await verifyListPassword(itemToUnlock.item.id, password, user?.id ?? null);
          } else if (itemToUnlock.type === 'preset'){
             result = await verifyPresetPassword(itemToUnlock.item.id, password, user?.id ?? null);
          } else {
             result = await verifyNotePassword(itemToUnlock.item.id, password, user?.id ?? null);
          }
          if (result.success) {
            handleUnlockSuccess(itemToUnlock.type, itemToUnlock.item.id);
            return true;
          }
          return false;
        }}
      />
    )}
    </>
  );
}
