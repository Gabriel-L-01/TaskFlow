
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, Users, Layout, ListTodo } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

type SettingsTab = 'general' | 'team' | 'display' | 'tasks';

const settingsTabs = [
    { id: 'general', label: 'Ogólne', icon: Settings },
    { id: 'team', label: 'Zespół', icon: Users },
    { id: 'display', label: 'Wyświetlanie', icon: Layout },
    { id: 'tasks', label: 'Zadania', icon: ListTodo },
] as const;


const GeneralSettings = () => (
    <div>
        <h3 className="text-2xl font-bold mb-1">Ustawienia ogólne</h3>
        <p className="text-muted-foreground mb-6">Zarządzaj podstawowymi informacjami o projekcie, takimi jak nazwa, ikona i opis.</p>
         <div className="border rounded-lg p-6">
            <p className="text-muted-foreground">Formularz edycji ogólnych ustawień projektu pojawi się tutaj.</p>
        </div>
    </div>
);

const TeamSettings = () => (
    <div>
        <h3 className="text-2xl font-bold mb-1">Zarządzaj zespołem</h3>
        <p className="text-muted-foreground mb-6">Zapraszaj nowych członków i zarządzaj uprawnieniami istniejących.</p>
        <div className="border rounded-lg p-6">
            <p className="text-muted-foreground">Lista członków zespołu i opcje zarządzania pojawią się tutaj.</p>
        </div>
    </div>
);

const DisplaySettings = () => (
     <div>
        <h3 className="text-2xl font-bold mb-1">Ustawienia wyświetlania</h3>
        <p className="text-muted-foreground mb-6">Dostosuj, które widoki są dostępne i jak się prezentują.</p>
        <div className="border rounded-lg p-6">
            <p className="text-muted-foreground">Opcje konfiguracji widoków (tablica, lista, kalendarz) pojawią się tutaj.</p>
        </div>
    </div>
);

const TaskSettings = () => (
    <div>
        <h3 className="text-2xl font-bold mb-1">Ustawienia zadań</h3>
        <p className="text-muted-foreground mb-6">Konfiguruj niestandardowe statusy, priorytety i inne opcje związane z zadaniami.</p>
        <div className="border rounded-lg p-6">
            <p className="text-muted-foreground">Opcje konfiguracji zadań pojawią się tutaj.</p>
        </div>
    </div>
);


const renderContent = (activeTab: SettingsTab) => {
    switch (activeTab) {
        case 'general':
            return <GeneralSettings />;
        case 'team':
            return <TeamSettings />;
        case 'display':
            return <DisplaySettings />;
        case 'tasks':
            return <TaskSettings />;
        default:
            return null;
    }
}


export default function ProjectSettingsView() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    return (
        <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr] gap-6 items-start">
            <nav className="flex flex-col gap-1 text-sm text-muted-foreground">
                {settingsTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <Button 
                            key={tab.id}
                            variant="ghost"
                            className={cn(
                                'justify-start gap-2',
                                activeTab === tab.id && 'bg-accent text-accent-foreground'
                            )}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </Button>
                    )
                })}
            </nav>
            <div className="grid gap-6">
                 {renderContent(activeTab)}
            </div>
        </div>
    );
}
