
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
import { ListFilter, Menu, Rows, RefreshCcw, Tag as TagIcon, Check, Globe, Lock, User as UserIcon, UserCheck, Users } from 'lucide-react';
import type { SortOption, Settings, List, Preset, Note, User } from '../lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useTheme } from "next-themes";
import type { View } from "./app-shell";

interface AppHeaderProps {
  listName: string;
  currentItem: List | Preset | Note | null;
  onSortChange: (sortOption: SortOption) => void;
  sortOption: SortOption;
  onGroupByListChange: (enabled: boolean) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  groupByList: boolean;
  showGroupingOption: boolean;
  onMenuClick: () => void;
  settings: Settings;
  currentView: View;
  showTags: boolean;
  onShowTagsChange: (show: boolean) => void;
  onAssignedToMeToggle: () => void;
  isAssignedToMeActive: boolean;
}

export function AppHeader({ 
  listName, 
  currentItem,
  onSortChange, 
  sortOption,
  onGroupByListChange, 
  onRefresh,
  isRefreshing,
  groupByList, 
  showGroupingOption,
  onMenuClick,
  settings,
  currentView,
  showTags,
  onShowTagsChange,
  onAssignedToMeToggle,
  isAssignedToMeActive,
}: AppHeaderProps) {
  const { resolvedTheme } = useTheme();
  
  const lang = {
    pl: {
      sortTasks: "Sortuj zadania",
      defaultSort: "Domyślnie",
      alphabetical: "Alfabetycznie",
      dateAdded: "Data dodania",
      groupByList: "Grupuj wg listy",
      refreshList: "Odśwież listę",
      showTags: "Pokaż tagi",
      hideTags: "Ukryj tagi",
      assignedToMe: "Przypisane do mnie",
    },
    en: {
      sortTasks: "Sort tasks",
      defaultSort: "Default",
      alphabetical: "Alphabetically",
      dateAdded: "Date added",
      groupByList: "Group by list",
      refreshList: "Refresh list",
      showTags: "Show tags",
      hideTags: "Hide tags",
      assignedToMe: "Assigned to me",
    }
  }
  const currentLang = settings.language === 'en' ? lang.en : lang.pl;

  const showControls = currentView.type !== 'settings' && currentView.type !== 'info' && currentView.type !== 'note';

  const renderItemIcon = () => {
    if (!currentItem) return null;

    let Icon;
    switch (currentItem.type) {
        case 'public':
            Icon = Globe;
            break;
        case 'private':
            Icon = Lock;
            break;
        case 'personal':
            Icon = UserIcon;
            break;
        default:
            return null;
    }
    return <Icon className="h-5 w-5 text-muted-foreground mr-2" style={{color: currentItem.color || undefined }} />;
  };

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
          <div className="flex items-center">
            {renderItemIcon()}
            <span className="text-sm md:text-lg font-semibold text-muted-foreground">{listName}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {showControls && showGroupingOption && (
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

        {showControls && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ListFilter className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{currentLang.sortTasks}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSortChange('order_position')}>
                {sortOption === 'order_position' && <Check className="mr-2 h-4 w-4" />}
                {currentLang.defaultSort}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('name')}>
                {sortOption === 'name' && <Check className="mr-2 h-4 w-4" />}
                {currentLang.alphabetical}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('created_at')}>
                {sortOption === 'created_at' && <Check className="mr-2 h-4 w-4" />}
                {currentLang.dateAdded}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {showControls && (
          <Button 
              variant="ghost" 
              size="icon" 
              onClick={onAssignedToMeToggle}
              className={cn(isAssignedToMeActive && "bg-accent text-accent-foreground")}
              aria-label={currentLang.assignedToMe}
              title={currentLang.assignedToMe}
          >
            <UserCheck className="h-5 w-5" />
          </Button>
        )}
        
        {showControls && currentView.type !== 'preset' && currentView.type !== 'note' && (
          <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onShowTagsChange(!showTags)}
              className={cn(showTags && "bg-accent text-accent-foreground")}
              aria-label={showTags ? currentLang.hideTags : currentLang.showTags}
              title={showTags ? currentLang.hideTags : currentLang.showTags}
          >
            <TagIcon className="h-5 w-5" />
          </Button>
        )}

        {showControls && (
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
        )}
      </div>
    </header>
  );
}
