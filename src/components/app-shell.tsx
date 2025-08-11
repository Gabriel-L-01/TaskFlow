'use client';

import type { List, Task, Preset, SortOption, User, Settings, PresetTask } from '@/lib/types';
import { useState, useEffect, useMemo, useTransition } from 'react';
import { AppSidebar } from './app-sidebar';
import { TaskList } from './task-list';
import { AppHeader } from './app-header';
import { getLists, getTasks, getPresets, getPresetTasks, getListTasks, verifyListPassword, verifyPresetPassword, updateUserSettings } from '@/lib/actions';
import { Skeleton } from './ui/skeleton';
import { PresetTaskList } from './preset-task-list';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { UnlockListDialog } from './unlock-list-dialog';
import { cn } from '@/lib/utils';


type View =
  | { type: 'list'; id: string | null }
  | { type: 'all' }
  | { type: 'preset'; id: string };

export default function AppShell({
  initialLists,
  initialTasks,
  initialPresets,
  user,
  settings,
  onSettingsChange
}: {
  initialLists: List[];
  initialTasks: Task[];
  initialPresets: Preset[];
  user: User | null;
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
}) {
  const [lists, setLists] = useState<List[]>(initialLists);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [presets, setPresets] = useState<Preset[]>(initialPresets);
  const [presetTasks, setPresetTasks] = useState<PresetTask[]>([]);
  const [view, setView] = useState<View>({ type: 'all' });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setInitialLoad] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [sortOption, setSortOption] = useState<SortOption>('order_position');
  const [groupByList, setGroupByList] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  const [itemToUnlock, setItemToUnlock] = useState<{ type: 'list' | 'preset'; item: List | Preset } | null>(null);
  const [unlockedLists, setUnlockedLists] = useState<Set<string>>(new Set());
  const [unlockedPresets, setUnlockedPresets] = useState<Set<string>>(new Set());
  
   useEffect(() => {
    setLists(initialLists);
    setTasks(initialTasks);
    setPresets(initialPresets);
    
    const initialUnlockedLists = new Set(initialLists.filter(l => l.has_access && l.is_private).map(l => l.id));
    setUnlockedLists(initialUnlockedLists);
    
    const initialUnlockedPresets = new Set(initialPresets.filter(p => p.has_access && p.is_private).map(p => p.id));
    setUnlockedPresets(initialUnlockedPresets);
    
  }, [initialLists, initialTasks, initialPresets]);


  const handleHideLockedChange = (hide: boolean) => {
    onSettingsChange({ hideLocked: hide });
    if (user) {
        updateUserSettings(user.id, { hideLocked: hide });
    }
  };

  async function fetchData() {
    setIsLoading(true);
    const [fetchedLists, fetchedTasks, fetchedPresets] = await Promise.all([
      getLists(user?.id, settings.hideLocked), 
      getTasks(user?.id),
      getPresets(user?.id, settings.hideLocked)
    ]);
    setLists(fetchedLists);
    setTasks(fetchedTasks);
    setPresets(fetchedPresets);
    setIsLoading(false);
    setInitialLoad(false);
  }

  useEffect(() => {
    startTransition(() => {
      fetchData();
    });
  }, [settings.hideLocked, user]);
  
  useEffect(() => {
    const fetchContent = async () => {
      if (view.type === 'preset') {
        const preset = presets.find(p => p.id === view.id);
        if (preset?.is_private && !unlockedPresets.has(preset.id)) {
          setItemToUnlock({ type: 'preset', item: preset });
        } else {
          setIsLoading(true);
          const fetchedPresetTasks = await getPresetTasks(view.id);
          setPresetTasks(fetchedPresetTasks);
          setIsLoading(false);
        }
      } else if (view.type === 'list' && view.id) {
        const list = lists.find(l => l.id === view.id);
        if (list?.is_private && !unlockedLists.has(list.id)) {
           setItemToUnlock({ type: 'list', item: list });
        } else {
          setIsLoading(true);
          const listTasks = await getListTasks(view.id);
          setTasks(prev => [...prev.filter(t => t.list_id !== view.id), ...listTasks]);
          setIsLoading(false);
        }
      }
    };

    startTransition(fetchContent);
  }, [view, lists, presets, unlockedLists, unlockedPresets]);


  const handleRefresh = () => {
    startTransition(async () => {
      setIsLoading(true);
      await fetchData();
       setIsLoading(false);
    });
  }


  const currentListName = useMemo(() => {
    const lang = settings.language === 'en' ? 
      { allTasks: 'All Tasks', inbox: 'Inbox', list: 'List', preset: 'Preset', focus: 'Focus Mode' } : 
      { allTasks: 'Wszystkie zadania', inbox: 'Skrzynka', list: 'Lista', preset: 'Preset', focus: 'Tryb skupienia' };

    if (view.type === 'all') return lang.allTasks;
    if (view.type === 'list' && view.id === null) return lang.inbox;
    if (view.type === 'list') {
      return lists.find((l) => l.id === view.id)?.name || lang.list;
    }
    if (view.type === 'preset') {
      return presets.find((p) => p.id === view.id)?.name || lang.preset;
    }
    return lang.focus;
  }, [view, lists, presets, settings.language]);
  
  const handleViewChange = (newView: View) => {
    if (newView.type === 'list' && newView.id) {
        const list = lists.find(l => l.id === newView.id);
        if (list?.is_private && !unlockedLists.has(list.id)) {
            setItemToUnlock({ type: 'list', item: list });
            return; 
        }
    }
    if (newView.type === 'preset') {
        const preset = presets.find(p => p.id === newView.id);
        if (preset?.is_private && !unlockedPresets.has(preset.id)) {
            setItemToUnlock({ type: 'preset', item: preset });
            return;
        }
    }
    setView(newView);
    setSidebarOpen(false); // Close mobile sidebar on navigation
  };

  const filteredTasks = useMemo(() => {
    if (view.type === 'preset') return []; // Handled by PresetTaskList
    
    if (view.type === 'all') {
        return tasks.filter(task => {
            if (!task.list_id) return true; // Inbox tasks are always visible
            const list = lists.find(l => l.id === task.list_id);
            return list && (!list.is_private || unlockedLists.has(list.id));
        });
    }

    if (view.type === 'list') {
      return tasks.filter((task) => task.list_id === view.id);
    }
    
    return [];
  }, [view, tasks, lists, unlockedLists]);
  
  
  const handleTaskAdded = (newTask: Task) => {
      setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleUnlockSuccess = (type: 'list' | 'preset', id: string) => {
    if (type === 'list') {
        setUnlockedLists(prev => new Set(prev).add(id));
        setLists(prev => prev.map(l => l.id === id ? { ...l, has_access: true } : l));
    } else {
        setUnlockedPresets(prev => new Set(prev).add(id));
        setPresets(prev => prev.map(p => p.id === id ? { ...p, has_access: true } : l));
    }
    setItemToUnlock(null);
    if ((view.type !== type) || view.id !== id) {
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
            currentView={view}
            onViewChange={handleViewChange}
            onListsChange={setLists}
            onPresetsChange={setPresets}
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
          />
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex">
         <AppSidebar
            lists={lists}
            presets={presets}
            currentView={view}
            onViewChange={handleViewChange}
            onListsChange={setLists}
            onPresetsChange={setPresets}
            onRefresh={handleRefresh}
            isRefreshing={isLoading || isPending}
            hideLocked={settings.hideLocked}
            onHideLockedChange={handleHideLockedChange}
            unlockedLists={unlockedLists}
            unlockedPresets={unlockedPresets}
            user={user}
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
      </div>

      <main className="flex flex-1 flex-col overflow-hidden">
        <AppHeader 
          listName={currentListName} 
          onSortChange={setSortOption}
          onGroupByListChange={setGroupByList}
          groupByList={groupByList}
          showGroupingOption={view.type === 'all'}
          showSortOption={view.type !== 'preset'}
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={handleRefresh}
          isRefreshing={isLoading || isPending}
          settings={settings}
          />
        {view.type === 'preset' ? (
          <PresetTaskList
            key={`preset-${view.id}`}
            presetId={view.id}
            initialTasks={presetTasks}
            onTasksChange={setPresetTasks}
            isLoading={isLoading || isPending}
            isLocked={presets.find(p => p.id === view.id)?.is_private && !unlockedPresets.has(view.id)}
          />
        ) : (
          <TaskList
              key={view.type === 'list' ? view.id || 'inbox' : view.type}
              tasks={filteredTasks}
              onTasksChange={setTasks}
              onTaskAdded={handleTaskAdded}
              allLists={lists}
              listId={view.type === 'list' ? view.id : 'all'}
              sortOption={sortOption}
              groupByList={view.type === 'all' && groupByList}
              isLoading={isLoading}
              isLocked={view.type === 'list' && view.id ? lists.find(l => l.id === view.id)?.is_private && !unlockedLists.has(view.id) : false}
          />
        )}
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
          } else {
             result = await verifyPresetPassword(itemToUnlock.item.id, password, user?.id ?? null);
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
