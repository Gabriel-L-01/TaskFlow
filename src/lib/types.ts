export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'pl' | 'en';
  hideLocked: boolean;
  colorTheme: string;
}

export interface User {
  id: string;
  username: string;
  settings?: Settings;
}

export interface List {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  is_private: boolean;
  has_access: boolean; 
}

export interface Task {
  id: string;
  name: string;
  done: boolean;
  list_id: string | null;
  order_position: number;
  created_at: string;
}

export interface Preset {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
  is_private: boolean;
  has_access: boolean;
}

export interface PresetTask {
  id: string;
  preset_id: string;
  task_name: string;
  done: boolean;
  order_position: number;
  created_at: string;
  // allow dynamic keys for updates
  [key: string]: any;
}

export type SortOption = 'order_position' | 'name' | 'created_at';
