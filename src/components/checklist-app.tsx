
'use client';
import { getLists, getTasks, getPresets, loginUser, getTags, getNotes, getUsers, updateUserSettings } from '@/lib/actions';
import AppShell, { type View } from './app-shell';
import type { List, Task, Preset, User, Settings, Tag, Note } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const defaultSettings: Settings = {
  theme: 'system',
  language: 'pl',
  hideLocked: false,
  colorTheme: 'default',
  groupByList: false,
  showCompleted: true,
  showTags: true,
  workMode: 'lists',
  devMode: false,
};

const defaultView: View = { type: 'today' };
const TIME_FILTER_TYPES: View['type'][] = ['today', 'tomorrow', 'this_week', 'overdue'];

export default function ChecklistApp() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [initialView, setInitialView] = useState<View>(defaultView);
  const router = useRouter();
  
  useEffect(() => {
    const body = document.body;
    body.classList.forEach(className => {
        if (className.startsWith('theme-')) {
            body.classList.remove(className);
        }
    });
    if (settings.colorTheme && settings.colorTheme !== 'default') {
        body.classList.add(`theme-${settings.colorTheme}`);
    }
  }, [settings.colorTheme]);

  useEffect(() => {
    // Restore last view from localStorage
    try {
      let savedView = null;
      const savedViewJSON = localStorage.getItem('checklist_last_view');
      if (savedViewJSON) {
        savedView = JSON.parse(savedViewJSON);
      }
      
      // If the saved view is a time filter, ensure it's a valid one, otherwise default
      if (savedView && TIME_FILTER_TYPES.includes(savedView.type)) {
        const lastTimeFilter = localStorage.getItem('checklist_last_time_filter');
        if (lastTimeFilter && TIME_FILTER_TYPES.includes(lastTimeFilter as any)) {
            savedView.type = lastTimeFilter;
        }
      }
      setInitialView(savedView || defaultView);

    } catch (error) {
      console.error("Could not parse last view from localStorage", error);
      setInitialView(defaultView);
    }

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      const userSettings = { ...defaultSettings, ...parsedUser.settings };
      setSettings(userSettings);
      // Apply theme from loaded settings
      const body = document.body;
      body.className = body.className.replace(/theme-[\w-]+/g, '');
      if (userSettings.colorTheme && userSettings.colorTheme !== 'default') {
          body.classList.add(`theme-${userSettings.colorTheme}`);
      }
      fetchData(parsedUser.id, userSettings.hideLocked);
    } else {
      router.push('/');
    }
  }, [router]);

  const fetchData = async (userId: string | null, hideLocked: boolean) => {
    setIsLoading(true);
    try {
      const [fetchedLists, fetchedTasks, fetchedPresets, fetchedTags, fetchedNotes, fetchedUsers] = await Promise.all([
        getLists(userId, hideLocked),
        getTasks(userId),
        getPresets(userId, hideLocked),
        getTags(),
        getNotes(userId, hideLocked),
        getUsers(),
      ]);
      setLists(fetchedLists);
      setTasks(fetchedTasks);
      setPresets(fetchedPresets);
      setTags(fetchedTags);
      setNotes(fetchedNotes);
      setAllUsers(fetchedUsers);
    } catch (error) {
        console.error("Failed to fetch initial data", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      if (user) {
          const updatedUser = { ...user, settings: updatedSettings };
          setUser(updatedUser);
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          if (newSettings.hideLocked !== undefined) {
            fetchData(user.id, newSettings.hideLocked);
          }
          if (newSettings.devMode !== undefined) {
             updateUserSettings(user.id, { devMode: newSettings.devMode });
          }
      }
  }

  if (isLoading || !user) {
      return <div className="flex h-screen w-full items-center justify-center">Loading...</div>
  }

  return (
    <AppShell 
      initialLists={lists} 
      initialTasks={tasks} 
      initialPresets={presets}
      initialTags={tags}
      initialNotes={notes}
      allUsers={allUsers}
      user={user} 
      settings={settings}
      onSettingsChange={handleSettingsChange}
      initialView={initialView}
      />
    );
}
