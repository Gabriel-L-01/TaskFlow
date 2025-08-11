'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from './ui/button';
import { ListFilter, Menu, Rows, RefreshCcw } from 'lucide-react';
import type { SortOption, Settings } from '../lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTheme } from "next-themes";

interface AppHeaderProps {
  listName: string;
  onSortChange: (sortOption: SortOption) => void;
  onGroupByListChange: (enabled: boolean) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  groupByList: boolean;
  showGroupingOption: boolean;
  showSortOption: boolean;
  onMenuClick: () => void;
  settings: Settings;
}

export function AppHeader({ 
  listName, 
  onSortChange, 
  onGroupByListChange, 
  onRefresh,
  isRefreshing,
  groupByList, 
  showGroupingOption,
  showSortOption,
  onMenuClick,
  settings
}: AppHeaderProps) {
  const { resolvedTheme } = useTheme();
  
  const lang = {
    pl: {
      sortTasks: "Sortuj zadania",
      defaultSort: "Domyślnie",
      alphabetical: "Alfabetycznie",
      dateAdded: "Data dodania",
      groupByList: "Grupuj wg listy",
      refreshList: "Odśwież listę"
    },
    en: {
      sortTasks: "Sort tasks",
      defaultSort: "Default",
      alphabetical: "Alphabetically",
      dateAdded: "Date added",
      groupByList: "Group by list",
      refreshList: "Refresh list"
    }
  }
  const currentLang = settings.language === 'en' ? lang.en : lang.pl;


  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
         <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex flex-col md:flex-row md:items-baseline md:gap-4">
           <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-3xl font-black hidden md:block gradient-text">
              TaskFlow
            </h1>
          </div>
          <span className="text-sm md:text-lg font-semibold text-muted-foreground">{listName}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showGroupingOption && (
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onGroupByListChange(!groupByList)}
                className={cn(groupByList && "bg-accent text-accent-foreground")}
                aria-label={currentLang.groupByList}
                title={currentLang.groupByList}
            >
              <Rows className="h-5 w-5" />
            </Button>
        )}
        {showSortOption && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ListFilter className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{currentLang.sortTasks}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSortChange('order_position')}>{currentLang.defaultSort}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('name')}>{currentLang.alphabetical}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('created_at')}>{currentLang.dateAdded}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRefresh}
            aria-label={currentLang.refreshList}
            title={currentLang.refreshList}
            disabled={isRefreshing}
        >
          <RefreshCcw className={cn("h-5 w-5 transition-transform", isRefreshing && "animate-spin-reverse")} />
        </Button>
      </div>
    </header>
  );
}
