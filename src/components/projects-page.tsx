
'use client';
import { useState } from 'react';
import type { Project } from '@/lib/mock-data';
import { mockProjects } from '@/lib/mock-data';
import ProjectHeader from './project-header';
import ProjectDashboard from './project-dashboard';
import ProjectTaskBoard from './project-task-board';
import ProjectTaskListView from './project-task-list-view';
import ProjectCalendarView from './project-calendar-view';
import ProjectTimelineView from './project-timeline-view';
import ProjectDocumentsView from './project-documents-view';
import ProjectWhiteboardView from './project-whiteboard-view';
import ProjectSettingsView from './project-settings-view';
import ProjectChatView from './project-chat-view';

export type ProjectView = 'dashboard' | 'board' | 'list' | 'calendar' | 'timeline' | 'documents' | 'whiteboard' | 'settings' | 'chat';

interface ProjectsPageProps {
  selectedProjectId: string;
  currentView: ProjectView;
  onViewChange: (view: View) => void;
}

export default function ProjectsPage({ selectedProjectId, currentView, onViewChange }: ProjectsPageProps) {
  const selectedProject = mockProjects.find(p => p.id === selectedProjectId);

  const renderContent = () => {
    if (!selectedProject) return null;
    
    switch (currentView) {
      case 'dashboard':
        return <ProjectDashboard project={selectedProject} />;
      case 'board':
        return <ProjectTaskBoard project={selectedProject} />;
      case 'list':
        return <ProjectTaskListView project={selectedProject} />;
      case 'calendar':
        return <ProjectCalendarView project={selectedProject} />;
      case 'timeline':
        return <ProjectTimelineView project={selectedProject} />;
      case 'documents':
        return <ProjectDocumentsView project={selectedProject} />;
      case 'whiteboard':
        return <ProjectWhiteboardView />;
      case 'settings':
        return <ProjectSettingsView />;
      case 'chat':
        return <ProjectChatView project={selectedProject} />;
      default:
        return null;
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Select a project to get started.</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
        <ProjectHeader 
            project={selectedProject}
            currentView={currentView}
            onViewChange={(view) => onViewChange({ type: 'projects', view })}
        />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
            {renderContent()}
        </main>
    </div>
  );
}
