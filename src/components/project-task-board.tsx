
'use client';
import type { Project, ProjectTask, TaskStatus, TaskPriority } from '@/lib/mock-data';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { Flame, ThumbsUp, Activity, AlertTriangle, MoreHorizontal, X, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Input } from './ui/input';

const initialStatusConfig: Record<TaskStatus, { label: string, color: string }> = {
    todo: { label: 'To Do', color: 'bg-slate-500' },
    inprogress: { label: 'In Progress', color: 'bg-blue-500' },
    done: { label: 'Done', color: 'bg-green-500' },
};

const priorityConfig: Record<TaskPriority, { label: string; icon: React.ElementType, className: string }> = {
    urgent: { label: 'Urgent', icon: AlertTriangle, className: 'text-orange-500' },
    high: { label: 'High', icon: Flame, className: 'text-red-500' },
    medium: { label: 'Medium', icon: Activity, className: 'text-yellow-500' },
    low: { label: 'Low', icon: ThumbsUp, className: 'text-green-500' },
};

const colorPalette = [
  '#64748b', '#3b82f6', '#22c55e', '#eab308', 
  '#f97316', '#ef4444', '#a855f7', '#ec4899'
];

interface TaskCardProps {
    task: ProjectTask;
    assignee?: { name: string, avatarUrl: string };
}

function TaskCard({ task, assignee }: TaskCardProps) {
    const PriorityIcon = priorityConfig[task.priority].icon;

    return (
        <Card className="mb-2 bg-card hover:bg-card/90 cursor-pointer">
            <CardContent className="p-3">
                <p className="font-medium mb-2">{task.content}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <PriorityIcon className={cn("h-4 w-4", priorityConfig[task.priority].className)} />
                    </div>
                    {assignee && (
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                            <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

interface Column {
    id: string;
    label: string;
    color: string;
    tasks: ProjectTask[];
}

interface ProjectTaskBoardProps {
    project: Project;
}

export default function ProjectTaskBoard({ project }: ProjectTaskBoardProps) {
    const [tasks, setTasks] = useState(project.tasks);
    const [columns, setColumns] = useState<Column[]>(() => {
         const existingStatuses = Array.from(new Set(tasks.map(t => t.status)));
         return (Object.keys(initialStatusConfig) as TaskStatus[])
            .filter(status => existingStatuses.includes(status))
            .map(status => ({
                id: status,
                label: initialStatusConfig[status].label,
                color: initialStatusConfig[status].color.replace('bg-', ''), // Store hex/name
                tasks: tasks.filter(t => t.status === status)
            }));
    });

    const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
    const [editingColumnName, setEditingColumnName] = useState('');
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListName, setNewListName] = useState('');

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) return;

        const sourceColId = source.droppableId;
        const destColId = destination.droppableId;
        
        const newTasks = Array.from(tasks);
        const movedTask = newTasks.find(t => t.id === result.draggableId);

        if (!movedTask) return;

        if(sourceColId === destColId) {
            // Reordering within the same column - this is visual only for now
             const columnTasks = tasks.filter(t => t.status === sourceColId);
             const [reorderedItem] = columnTasks.splice(source.index, 1);
             columnTasks.splice(destination.index, 0, reorderedItem);

             const otherTasks = tasks.filter(t => t.status !== sourceColId);
             setTasks([...otherTasks, ...columnTasks]);
        } else {
            // Moving to a different column
            const updatedTask = { ...movedTask, status: destColId as TaskStatus };
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        }

    };

    const handleRenameColumn = (columnId: string) => {
        const column = columns.find(c => c.id === columnId);
        if (column) {
            setEditingColumnId(columnId);
            setEditingColumnName(column.label);
        }
    };
    
    const handleSaveColumnName = () => {
        if (!editingColumnId || !editingColumnName.trim()) {
            setEditingColumnId(null);
            return;
        };
        setColumns(columns.map(c => c.id === editingColumnId ? { ...c, label: editingColumnName } : c));
        setEditingColumnId(null);
    };
    
    const handleChangeColor = (columnId: string, color: string) => {
        setColumns(columns.map(c => c.id === columnId ? { ...c, color } : c));
    };
    
    const handleAddList = () => {
        if (!newListName.trim()) {
            setIsAddingList(false);
            return;
        }
        const newColumn: Column = {
            id: newListName.toLowerCase().replace(/\s+/g, '-'),
            label: newListName,
            color: '64748b', // Default color for new columns (slate-500)
            tasks: [],
        };
        setColumns([...columns, newColumn]);
        setNewListName('');
        setIsAddingList(false);
    };

    const columnsToRender = columns.map(column => ({
        ...column,
        tasks: tasks.filter(t => t.status === column.id)
    }))

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 items-start overflow-x-auto pb-4">
                {columnsToRender.map(column => (
                    <Droppable key={column.id} droppableId={column.id}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={cn(
                                    "bg-muted/50 rounded-lg p-2 w-[300px] flex-shrink-0 flex flex-col",
                                    snapshot.isDraggingOver && 'bg-muted'
                                )}
                            >
                                <div className="flex items-center gap-2 mb-4 p-2">
                                     <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.color.startsWith('#') ? column.color : `#${column.color}`}} />
                                     {editingColumnId === column.id ? (
                                        <Input
                                            value={editingColumnName}
                                            onChange={(e) => setEditingColumnName(e.target.value)}
                                            onBlur={handleSaveColumnName}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveColumnName()}
                                            autoFocus
                                            className="h-auto flex-grow bg-transparent border-0 shadow-none p-0 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
                                        />
                                     ) : (
                                        <h2 className="font-semibold text-lg flex-grow">{column.label}</h2>
                                     )}
                                     <Badge variant="secondary">{column.tasks.length}</Badge>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleRenameColumn(column.id)}>
                                                Zmień nazwę
                                            </DropdownMenuItem>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Zmień kolor</DropdownMenuSubTrigger>
                                                <DropdownMenuSubContent className="p-2">
                                                     <div className="flex items-center gap-2 flex-wrap">
                                                        {colorPalette.map((c) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            className="h-6 w-6 rounded-full border-2 transition-transform transform hover:scale-110 flex-shrink-0"
                                                            style={{ backgroundColor: c, borderColor: c === `#${column.color}` ? 'hsl(var(--primary))' : 'transparent' }}
                                                            onClick={() => handleChangeColor(column.id, c.replace('#', ''))}
                                                        />
                                                        ))}
                                                        <div className="relative h-6 w-6 rounded-full border-2 transition-transform transform hover:scale-110 flex-shrink-0" style={{ borderColor: !colorPalette.includes(`#${column.color}`) ? 'hsl(var(--primary))' : 'transparent' }}>
                                                            <div className="h-full w-full rounded-full" style={{
                                                            backgroundColor: !colorPalette.includes(`#${column.color}`) ? `#${column.color}` : 'transparent',
                                                            backgroundImage: colorPalette.includes(`#${column.color}`) ? 'conic-gradient(from 180deg at 50% 50%, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #ec4899, #ef4444)' : 'none',
                                                            }}></div>
                                                            <Input
                                                                type="color"
                                                                value={`#${column.color}`}
                                                                onChange={(e) => handleChangeColor(column.id, e.target.value.replace('#', ''))}
                                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                                                title="Custom Color"
                                                            />
                                                        </div>
                                                    </div>
                                                </DropdownMenuSubContent>
                                            </DropdownMenuSub>
                                            <DropdownMenuItem className="text-red-500">
                                                Usuń kolumnę
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="min-h-[200px] flex-grow overflow-y-auto px-2">
                                    {column.tasks.map((task, index) => {
                                        const assignee = project.members.find(m => m.id === task.assigneeId);
                                        return (
                                             <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(snapshot.isDragging && 'opacity-80 shadow-lg')}
                                                    >
                                                        <TaskCard task={task} assignee={assignee} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        )
                                    })}
                                    {provided.placeholder}
                                </div>
                            </div>
                        )}
                    </Droppable>
                ))}
                 <div className="w-[300px] flex-shrink-0">
                    {isAddingList ? (
                         <div className="bg-muted/50 rounded-lg p-2">
                            <Input 
                                placeholder="Wprowadź nazwę statusu..."
                                value={newListName}
                                onChange={e => setNewListName(e.target.value)}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleAddList()}
                                onBlur={() => setIsAddingList(false)}
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <Button onClick={handleAddList}>Dodaj status</Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsAddingList(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="ghost" className="w-auto justify-start" onClick={() => setIsAddingList(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Dodaj status
                        </Button>
                    )}
                </div>
            </div>
        </DragDropContext>
    );
}
