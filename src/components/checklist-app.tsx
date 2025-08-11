'use client';
import { getLists, getTasks, getPresets, loginUser } from '@/lib/actions';
import AppShell from './app-shell';
import type { List, Task, Preset, User, Settings } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const defaultSettings: Settings = {
  theme: 'system',
  language: 'pl',
  hideLocked: false,
  colorTheme: 'default',
};

export default function ChecklistApp() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
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
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser: User = JSON.parse(storedUser);
      setUser(parsedUser);
      const userSettings = parsedUser.settings || defaultSettings;
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
      const [fetchedLists, fetchedTasks, fetchedPresets] = await Promise.all([
        getLists(userId, hideLocked),
        getTasks(userId),
        getPresets(userId, hideLocked),
      ]);
      setLists(fetchedLists);
      setTasks(fetchedTasks);
      setPresets(fetchedPresets);
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
          if(newSettings.hideLocked !== undefined) {
            fetchData(user.id, newSettings.hideLocked);
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
      user={user} 
      settings={settings}
      onSettingsChange={handleSettingsChange}
      />
    );
}
