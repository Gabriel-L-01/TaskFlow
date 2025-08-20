
'use client';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'pl' | 'en';
  hideLocked: boolean;
  colorTheme: string;
  groupByList: boolean;
  showCompleted: boolean;
  showTags: boolean;
  workMode: 'lists' | 'projects';
  devMode: boolean;
}

export interface User {
  id: string;
  username: string;
  settings?: Settings;
}

export type PrivacyType = 'public' | 'private' | 'personal';

export interface List {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  has_access: boolean; 
  order_position: number;
  type: PrivacyType | null;
}

export interface Note {
  id: string;
  name: string;
  content: string;
  color: string | null;
  created_at: string;
  has_access: boolean;
  order_position: number;
  type: PrivacyType | null;
  tags: string[] | null;
}

export interface Tag {
  name: string;
  color: string | null;
  order_position: number;
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  done: boolean;
  list_id: string | null;
  order_position: number;
  created_at: string;
  tags: string[] | null;
  assignee_id: string | null;
  due_date: string | null;
  assignee?: { id: string, username: string } | null;
}

export interface Preset {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  has_access: boolean;
  order_position: number;
  type: PrivacyType | null;
}

export interface PresetTask {
  id: string;
  preset_id: string;
  task_name: string;
  description: string | null;
  done: boolean;
  order_position: number;
  created_at: string;
  // allow dynamic keys for updates
  [key: string]: any;
}

export type SortOption = 'order_position' | 'name' | 'created_at';

export type View =
  | { type: 'list'; id: string | null }
  | { type: 'all' }
  | { type: 'preset'; id: string }
  | { type: 'note'; id: string }
  | { type: 'settings' }
  | { type: 'info' }
  | { type: 'projects'; view?: any } // Replace 'any' with specific project view types if needed
  | { type: 'today' }
  | { type: 'tomorrow' }
  | { type: 'this_week' }
  | { type: 'overdue' };
