
'use client';

import React, { useState } from 'react';
import type { Project, ChatThread } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Send, PlusCircle } from 'lucide-react';

interface ProjectChatViewProps {
    project: Project;
}

export default function ProjectChatView({ project }: ProjectChatViewProps) {
    const [threads, setThreads] = useState<ChatThread[]>(project.chat || []);
    const [selectedThread, setSelectedThread] = useState<ChatThread | null>(threads[0] || null);

    const handleSelectThread = (thread: ChatThread) => {
        setSelectedThread(thread);
    }

    return (
        <Card className="h-full flex flex-col md:flex-row">
            <aside className="w-full md:w-1/3 lg:w-1/4 border-b md:border-r md:border-b-0">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Wątki</h2>
                </div>
                <ScrollArea className="h-[200px] md:h-full">
                    <div className="p-2">
                        {threads.map(thread => (
                            <button 
                                key={thread.id} 
                                onClick={() => handleSelectThread(thread)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg flex flex-col gap-1 transition-colors min-w-0",
                                    selectedThread?.id === thread.id ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                                )}
                            >
                                <p className="font-semibold block truncate">{thread.title}</p>
                                <p className="text-xs text-muted-foreground block truncate">
                                    {thread.messages[thread.messages.length - 1].content}
                                </p>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
                 <div className="p-2 border-t mt-auto">
                    <Button variant="ghost" className="w-full justify-start">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nowy wątek
                    </Button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col">
                {selectedThread ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3">
                             <Avatar>
                                <AvatarImage src={project.members.find(m => m.id === selectedThread.messages[0].senderId)?.avatarUrl} />
                                <AvatarFallback>{selectedThread.title.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-xl font-bold">{selectedThread.title}</h2>
                                <p className="text-sm text-muted-foreground">
                                    Uczestnicy: {project.members.map(m => m.name).join(', ')}
                                </p>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-6">
                                {selectedThread.messages.map(message => {
                                    const sender = project.members.find(m => m.id === message.senderId);
                                    const isMe = sender?.id === 'mem-1'; // Assuming 'mem-1' is the current user for demo

                                    return (
                                        <div key={message.id} className={cn("flex items-end gap-3", isMe && "flex-row-reverse")}>
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={sender?.avatarUrl} />
                                                <AvatarFallback>{sender?.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                "max-w-xs lg:max-w-md p-3 rounded-lg",
                                                isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                                            )}>
                                                <p className="text-sm">{message.content}</p>
                                                <p className={cn(
                                                    "text-xs mt-1",
                                                    isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}>{message.timestamp}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                         <div className="p-4 border-t bg-background">
                            <div className="relative">
                                <Input placeholder="Napisz wiadomość..." className="pr-12" />
                                <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <p className="text-lg font-semibold">Wybierz wątek</p>
                            <p className="text-muted-foreground">Wybierz konwersację z listy po lewej, aby ją wyświetlić.</p>
                        </div>
                    </div>
                )}
            </main>
        </Card>
    );
}
