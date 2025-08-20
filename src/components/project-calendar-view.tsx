
'use client';

import React, { useState, useMemo } from 'react';
import type { Project, ProjectTask, TaskPriority, TaskStatus } from '@/lib/mock-data';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { format, isSameDay, parseISO } from 'date-fns';
import { Flame, ThumbsUp, Activity, AlertTriangle, CheckCircle, Circle, Dot } from 'lucide-react';

interface ProjectCalendarViewProps {
    project: Project;
}

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ElementType, className: string }> = {
    urgent: { label: 'Urgent', icon: AlertTriangle, className: 'text-orange-500' },
    high: { label: 'High', icon: Flame, className: 'text-red-500' },
    medium: { label: 'Medium', icon: Activity, className: 'text-yellow-500' },
    low: { label: 'Low', icon: ThumbsUp, className: 'text-green-500' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType, color: string }> = {
    todo: { label: 'To Do', icon: Circle, color: 'text-slate-500' },
    inprogress: { label: 'In Progress', icon: Dot, color: 'text-blue-500' },
    done: { label: 'Done', icon: CheckCircle, color: 'text-green-500' },
};

export default function ProjectCalendarView({ project }: ProjectCalendarViewProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const tasksByDay = useMemo(() => {
        return project.tasks.reduce((acc, task) => {
            if (task.dueDate) {
                const dayKey = format(parseISO(task.dueDate), 'yyyy-MM-dd');
                if (!acc[dayKey]) {
                    acc[dayKey] = [];
                }
                acc[dayKey].push(task);
            }
            return acc;
        }, {} as Record<string, ProjectTask[]>);
    }, [project.tasks]);

    const selectedDayTasks = useMemo(() => {
        return date ? tasksByDay[format(date, 'yyyy-MM-dd')] || [] : [];
    }, [date, tasksByDay]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
                <Card>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="p-0"
                        classNames={{
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "h-24 text-center text-sm p-1 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-full w-full p-1.5 font-normal aria-selected:opacity-100 flex flex-col items-start justify-start hover:bg-accent rounded-md",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            day_today: "bg-accent text-accent-foreground",
                            day_outside: "text-muted-foreground opacity-50",
                        }}
                        components={{
                            Day: ({ date }) => {
                                const dayKey = format(date, 'yyyy-MM-dd');
                                const dayTasks = tasksByDay[dayKey] || [];
                                return (
                                    <div className='flex flex-col items-start w-full h-full'>
                                        <time dateTime={dayKey} className={cn(
                                            isSameDay(date, new Date()) && "bg-primary rounded-full h-6 w-6 flex items-center justify-center text-primary-foreground"
                                        )}>
                                            {format(date, 'd')}
                                        </time>
                                        <div className='flex flex-col items-start gap-1 mt-1 w-full overflow-hidden'>
                                            {dayTasks.slice(0,3).map(task => (
                                                <div key={task.id} className='flex items-center gap-1 w-full text-xs bg-background rounded-sm px-1'>
                                                    <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", statusConfig[task.status].color.replace('text-', 'bg-'))}/>
                                                    <p className='truncate'>{task.content}</p>
                                                </div>
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <div className='text-xs text-muted-foreground'>
                                                    + {dayTasks.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                        }}
                    />
                </Card>
            </div>
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {date ? format(date, 'MMMM d, yyyy') : 'Select a day'}
                        </CardTitle>
                         <CardDescription>
                            Tasks scheduled for this day.
                         </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 h-[60vh] overflow-y-auto">
                        {selectedDayTasks.length > 0 ? (
                            selectedDayTasks.map(task => {
                                const assignee = project.members.find(m => m.id === task.assigneeId);
                                const StatusIcon = statusConfig[task.status].icon;
                                const PriorityIcon = priorityConfig[task.priority].icon;

                                return (
                                <div key={task.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                    <p className="font-medium mb-2">{task.content}</p>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                             <StatusIcon className={cn("h-4 w-4", statusConfig[task.status].color)} />
                                            <PriorityIcon className={cn("h-4 w-4", priorityConfig[task.priority].className)} />
                                        </div>
                                        {assignee && (
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                                <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No tasks scheduled for this day.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
