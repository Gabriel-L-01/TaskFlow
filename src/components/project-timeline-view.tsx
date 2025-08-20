
'use client';

import React, { useMemo } from 'react';
import type { Project } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  differenceInDays,
  parseISO,
  isToday
} from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const statusConfig = {
    todo: 'bg-slate-400',
    inprogress: 'bg-blue-500',
    done: 'bg-green-500',
};

export default function ProjectTimelineView({ project }: ProjectTimelineViewProps) {
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start, end });

  const tasksWithDates = useMemo(() => {
    return project.tasks.filter(task => task.startDate && task.dueDate);
  }, [project.tasks]);

  const getTaskStyle = (task: typeof tasksWithDates[0]) => {
    const startDate = parseISO(task.startDate!);
    const endDate = parseISO(task.dueDate!);
    
    const startDay = startDate.getDate();
    const duration = differenceInDays(endDate, startDate) + 1;

    const gridColumnStart = differenceInDays(startDate, start) + 1;
    if (gridColumnStart < 1) return {};

    return {
      gridColumn: `${gridColumnStart} / span ${duration}`,
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>{format(today, 'MMMM yyyy')}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <div
            className="grid text-sm"
            style={{
              gridTemplateColumns: `150px repeat(${daysInMonth.length}, 1fr)`,
            }}
          >
            {/* Header */}
            <div className="sticky left-0 z-10 p-2 font-semibold bg-card border-b border-r">Task</div>
            {daysInMonth.map(day => (
              <div key={day.toString()} className={cn("p-2 text-center border-b text-xs", isToday(day) && "bg-primary/20")}>
                <p className="font-semibold">{format(day, 'E')}</p>
                <p>{format(day, 'd')}</p>
              </div>
            ))}

            {/* Task Rows */}
            {tasksWithDates.map((task, index) => {
              const assignee = project.members.find(m => m.id === task.assigneeId);
              return (
                <React.Fragment key={task.id}>
                  <div className="sticky left-0 z-10 flex items-center p-2 text-sm border-b border-r bg-card truncate">
                     <p className="truncate font-medium">{task.content}</p>
                  </div>
                  <div
                    className="col-span-full border-b relative"
                    style={{
                      gridRow: index + 2,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${daysInMonth.length}, 1fr)`,
                    }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            style={getTaskStyle(task)}
                            className={cn(
                                "h-8 my-1 rounded-lg flex items-center justify-between px-2 cursor-pointer", 
                                statusConfig[task.status]
                            )}
                          >
                             <p className="text-white text-xs font-semibold truncate">{task.content}</p>
                             {assignee && (
                                <Avatar className="h-6 w-6 border-2 border-white/50">
                                    <AvatarImage src={assignee.avatarUrl} />
                                    <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                             )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-bold">{task.content}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(task.startDate!), 'MMM d')} - {format(parseISO(task.dueDate!), 'MMM d')}
                          </p>
                          {assignee && <p className="text-sm">Assigned to: {assignee.name}</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectTimelineViewProps {
  project: Project;
}
