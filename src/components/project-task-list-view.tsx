
'use client';

import type { Project, ProjectTask, TaskStatus, TaskPriority } from '@/lib/mock-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Flame, ThumbsUp, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'To Do', color: 'bg-slate-400' },
  inprogress: { label: 'In Progress', color: 'bg-blue-500' },
  done: { label: 'Done', color: 'bg-green-500' },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ElementType; className: string }> = {
  urgent: { label: 'Urgent', icon: AlertTriangle, className: 'text-orange-500' },
  high: { label: 'High', icon: Flame, className: 'text-red-500' },
  medium: { label: 'Medium', icon: Activity, className: 'text-yellow-500' },
  low: { label: 'Low', icon: ThumbsUp, className: 'text-green-500' },
};

interface ProjectTaskListViewProps {
    project: Project;
}

export default function ProjectTaskListView({ project }: ProjectTaskListViewProps) {
    const { tasks, members } = project;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Task List</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Status</TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead className="w-[150px]">Priority</TableHead>
                            <TableHead className="w-[180px]">Assignee</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasks.map(task => {
                            const assignee = members.find(m => m.id === task.assigneeId);
                            const PriorityIcon = priorityConfig[task.priority].icon;
                            
                            return (
                                <TableRow key={task.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={cn("h-2.5 w-2.5 rounded-full", statusConfig[task.status].color)} />
                                            <span>{statusConfig[task.status].label}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{task.content}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <PriorityIcon className={cn("h-4 w-4", priorityConfig[task.priority].className)} />
                                            <span>{priorityConfig[task.priority].label}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {assignee ? (
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                                                    <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{assignee.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Unassigned</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
