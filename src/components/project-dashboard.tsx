
'use client';

import type { Project, TaskPriority, TaskStatus } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { CheckCircle2, Flame, ThumbsUp, Activity, StickyNote, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';

interface ProjectDashboardProps {
    project: Project;
}

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ElementType, color: string }> = {
    urgent: { label: 'Urgent', icon: AlertTriangle, color: 'text-orange-500' },
    high: { label: 'High', icon: Flame, color: 'text-red-500' },
    medium: { label: 'Medium', icon: Activity, color: 'text-yellow-500' },
    low: { label: 'Low', icon: ThumbsUp, color: 'text-green-500' },
};

const statusConfig: Record<TaskStatus, { label: string, color: string }> = {
    todo: { label: 'To Do', color: 'hsl(var(--chart-1))' },
    inprogress: { label: 'In Progress', color: 'hsl(var(--chart-2))' },
    done: { label: 'Done', color: 'hsl(var(--chart-3))' },
};


export default function ProjectDashboard({ project }: ProjectDashboardProps) {
    const { tasks, members, activity, notes } = project;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const statusChartData = useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return (Object.keys(statusConfig) as TaskStatus[]).map(status => ({
            name: statusConfig[status].label,
            value: counts[status] || 0,
            fill: statusConfig[status].color,
        }));
    }, [tasks]);

    const priorityData = useMemo(() => {
        const counts = tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {} as Record<TaskPriority, number>);
        
        return (Object.keys(priorityConfig) as TaskPriority[]).sort((a, b) => {
            const order: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
            return order.indexOf(a) - order.indexOf(b);
        }).map(priority => ({
            name: priorityConfig[priority].label,
            icon: priorityConfig[priority].icon,
            color: priorityConfig[priority].color,
            count: counts[priority] || 0,
            percentage: totalTasks > 0 ? (((counts[priority] || 0) / totalTasks) * 100) : 0,
        }));
    }, [tasks, totalTasks]);

    const memberTaskCounts = useMemo(() => {
        return members.slice(0, 5).map(member => {
            const count = tasks.filter(t => t.assigneeId === member.id).length;
            return { 
                ...member, 
                taskCount: count, 
                progress: totalTasks > 0 ? (count / totalTasks) * 100 : 0 
            };
        })
    }, [members, tasks, totalTasks]);


    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Tasks by Status</CardTitle>
                         <CardDescription>Overview of tasks in different stages.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="grid grid-cols-2 gap-4 items-center">
                            <ResponsiveContainer width="100%" height={150}>
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={70}
                                        innerRadius={50}
                                        paddingAngle={0}
                                        stroke="none"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-2 text-sm">
                                {statusChartData.map(entry => (
                                    <div key={entry.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                                            <span>{entry.name}</span>
                                        </div>
                                        <span className="font-bold">{entry.value} ({totalTasks > 0 ? ((entry.value/totalTasks)*100).toFixed(0) : 0}%)</span>
                                    </div>
                                ))}
                            </div>
                       </div>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Tasks by Priority</CardTitle>
                        <CardDescription>Distribution of tasks based on priority.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center space-y-4">
                        {priorityData.map(p => (
                            <div key={p.name}>
                                <div className="flex items-center justify-between mb-1 text-sm">
                                    <div className="flex items-center gap-2 font-medium">
                                        <p.icon className={cn("h-4 w-4", p.color)} />
                                        <p>{p.name}</p>
                                    </div>
                                    <p className="font-bold">{p.count} tasks ({p.percentage.toFixed(0)}%)</p>
                                </div>
                                <Progress value={p.percentage} className="h-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-3 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Task distribution across the team.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {memberTaskCounts.map(member => (
                                <div key={member.id}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={member.avatarUrl} alt={member.name} />
                                                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <p className="text-sm font-medium leading-none">{member.name}</p>
                                        </div>
                                        <p className="text-sm font-bold">{member.taskCount} tasks ({member.progress.toFixed(0)}%)</p>
                                    </div>
                                    <Progress value={member.progress} className="h-2" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                 <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activity.map(item => (
                                <div key={item.id} className="flex items-start">
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 mr-4 mt-1 flex-shrink-0">
                                        <CheckCircle2 className="h-3 w-3 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">{item.description}</p>
                                        <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Project Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-start gap-4">
                         <StickyNote className="h-6 w-6 text-muted-foreground mt-1 flex-shrink-0" />
                         <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notes}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
