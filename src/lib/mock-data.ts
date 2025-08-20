
'use client';

import { Briefcase, Component, Construction, type LucideIcon, AlertTriangle, TrendingUp, BookCopy, Users } from "lucide-react";
import { addDays, format, startOfMonth } from 'date-fns';
import type { Note } from './types';

const today = new Date();
const startOfCurrentMonth = startOfMonth(today);

export type TaskStatus = 'todo' | 'inprogress' | 'done';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface ProjectTask {
    id: string;
    content: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    startDate?: string;
    dueDate?: string;
}

export interface ProjectActivity {
    id:string;
    description: string;
    timestamp: string;
}

export interface TeamMember {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface ProjectDocument {
    id: string;
    name: string;
    lastModified: string;
    size: string;
    url: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    content: string;
    timestamp: string;
}

export interface ChatThread {
    id: string;
    title: string;
    messages: ChatMessage[];
}

export interface Project {
    id: string;
    name: string;
    icon: LucideIcon;
    tasks: ProjectTask[];
    activity: ProjectActivity[];
    members: TeamMember[];
    notes: string;
    isFavorite?: boolean;
    documents?: ProjectDocument[];
    chat?: ChatThread[];
}

export const mockProjects: Project[] = [
    {
        id: 'proj-1',
        name: 'Website Redesign',
        icon: Briefcase,
        isFavorite: true,
        notes: "Initial discovery session highlighted the need for a mobile-first approach. User personas are attached in the shared drive. The main goal is to increase user engagement by 20% in Q3.",
        tasks: [
            { id: 'task-1', content: 'Design new homepage', status: 'done', priority: 'high', assigneeId: 'mem-1', startDate: format(addDays(startOfCurrentMonth, 0), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 2), 'yyyy-MM-dd') },
            { id: 'task-2', content: 'Develop front-end components', status: 'inprogress', priority: 'high', assigneeId: 'mem-2', startDate: format(addDays(startOfCurrentMonth, 3), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 8), 'yyyy-MM-dd') },
            { id: 'task-3', content: 'Set up CMS integration', status: 'inprogress', priority: 'medium', assigneeId: 'mem-2', startDate: format(addDays(startOfCurrentMonth, 9), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 12), 'yyyy-MM-dd') },
            { id: 'task-4', content: 'User testing and feedback', status: 'todo', priority: 'medium', startDate: format(addDays(startOfCurrentMonth, 13), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 18), 'yyyy-MM-dd') },
            { id: 'task-5', content: 'Deploy to production', status: 'todo', priority: 'urgent', startDate: format(addDays(startOfCurrentMonth, 22), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 25), 'yyyy-MM-dd') },
            { id: 'task-6', content: 'Create style guide', status: 'done', priority: 'low', assigneeId: 'mem-3', startDate: format(addDays(startOfCurrentMonth, 1), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 4), 'yyyy-MM-dd') },
        ],
        activity: [
            { id: 'act-1', description: "Jane moved 'Design new homepage' to Done", timestamp: "2 hours ago" },
            { id: 'act-2', description: "Tom started working on 'Develop front-end components'", timestamp: "6 hours ago" },
            { id: 'act-3', description: "Jane added task 'Create style guide'", timestamp: "1 day ago" },
        ],
        members: [
            { id: 'mem-1', name: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
            { id: 'mem-2', name: 'Tom Clark', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
            { id: 'mem-3', name: 'Peter Pan', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
        ],
        documents: [
            { id: 'doc-1', name: 'user_personas.pdf', lastModified: '2024-05-10', size: '2.3 MB', url: '#' },
            { id: 'doc-2', name: 'brand_guidelines.docx', lastModified: '2024-05-12', size: '5.1 MB', url: '#' },
            { id: 'doc-3', name: 'homepage_mockup_v2.png', lastModified: '2024-05-15', size: '1.8 MB', url: '#' },
        ],
        chat: [
            {
                id: 'thread-1',
                title: 'Homepage Design Feedback',
                messages: [
                    { id: 'msg-1', senderId: 'mem-1', content: 'Hey team, what do you think of the latest homepage mockup?', timestamp: 'Yesterday' },
                    { id: 'msg-2', senderId: 'mem-2', content: 'Looks great, Jane! The CTA button is much more prominent now.', timestamp: 'Yesterday' },
                    { id: 'msg-3', senderId: 'mem-3', content: 'I agree. Maybe we can try a different shade of blue for the button?', timestamp: 'Today' },
                ]
            },
            {
                id: 'thread-2',
                title: 'Deployment Strategy',
                messages: [
                    { id: 'msg-4', senderId: 'mem-2', content: 'We need to finalize the deployment plan for next week.', timestamp: '3 days ago' },
                ]
            }
        ]
    },
    {
        id: 'proj-2',
        name: 'Mobile App',
        icon: Component,
        isFavorite: false,
        notes: "The login bug is critical and needs to be addressed in the next sprint. Push notifications are planned for the Q4 release.",
        tasks: [
            { id: 'task-7', content: 'Plan features for v2', status: 'inprogress', priority: 'high', assigneeId: 'mem-1', startDate: format(addDays(startOfCurrentMonth, 5), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 10), 'yyyy-MM-dd') },
            { id: 'task-8', content: 'Fix login bug', status: 'done', priority: 'urgent', assigneeId: 'mem-1', startDate: format(addDays(startOfCurrentMonth, 0), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 1), 'yyyy-MM-dd') },
            { id: 'task-9', content: 'Implement push notifications', status: 'todo', priority: 'medium', startDate: format(addDays(startOfCurrentMonth, 15), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 20), 'yyyy-MM-dd') },
        ],
        activity: [
             { id: 'act-4', description: "Admin moved 'Fix login bug' to Done", timestamp: "4 hours ago" },
        ],
        members: [
            { id: 'mem-1', name: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
        ],
        documents: [],
        chat: []
    },
    {
        id: 'proj-3',
        name: 'API Development',
        icon: Construction,
        isFavorite: false,
        notes: "Integration tests are the current bottleneck. We need to allocate more resources to unblock the pipeline.",
        tasks: [
            { id: 'task-10', content: 'Define API endpoints', status: 'done', priority: 'high', assigneeId: 'mem-2' },
            { id: 'task-11', content: 'Set up database schema', status: 'done', priority: 'high', assigneeId: 'mem-3' },
            { id: 'task-12', content: 'Implement authentication', status: 'done', priority: 'medium', assigneeId: 'mem-2' },
            { id: 'task-13', content: 'Write integration tests', status: 'inprogress', priority: 'urgent', assigneeId: 'mem-3', startDate: format(addDays(startOfCurrentMonth, 2), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 6), 'yyyy-MM-dd') },
        ],
        activity: [
            { id: 'act-5', description: "System marked 'Set up database schema' as Done", timestamp: "2 days ago" },
        ],
        members: [
            { id: 'mem-2', name: 'Tom Clark', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
            { id: 'mem-3', name: 'Peter Pan', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
        ],
        documents: [
             { id: 'doc-4', name: 'api_specification_v1.pdf', lastModified: '2024-05-01', size: '800 KB', url: '#' },
        ],
        chat: [
             {
                id: 'thread-3',
                title: 'Auth Endpoint Discussion',
                messages: [
                    { id: 'msg-5', senderId: 'mem-2', content: 'Is JWT the best approach for our use case?', timestamp: '4 days ago' },
                    { id: 'msg-6', senderId: 'mem-3', content: 'Yes, it should be fine. I\'ve used it on previous projects and it\'s solid.', timestamp: '4 days ago' },
                ]
            },
        ]
    },
    {
        id: 'proj-4',
        name: 'Marketing Campaign',
        icon: TrendingUp,
        isFavorite: false,
        notes: 'Focus on social media engagement for the new product launch. Key demographic is 18-25 year olds. Drafts for ad copy are in the documents tab.',
        tasks: [
          { id: 'task-14', content: 'Create social media calendar', status: 'done', priority: 'medium', assigneeId: 'mem-4' },
          { id: 'task-15', content: 'Launch Instagram ads', status: 'inprogress', priority: 'high', assigneeId: 'mem-4', startDate: format(addDays(startOfCurrentMonth, 11), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 14), 'yyyy-MM-dd') },
          { id: 'task-16', content: 'Analyze campaign performance', status: 'todo', priority: 'high', startDate: format(addDays(startOfCurrentMonth, 25), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 28), 'yyyy-MM-dd') },
          { id: 'task-17', content: 'Write blog post about launch', status: 'todo', priority: 'low', assigneeId: 'mem-1' },
        ],
        activity: [
          { id: 'act-6', description: "Sarah completed 'Create social media calendar'", timestamp: 'Yesterday' },
          { id: 'act-7', description: 'New budget approved for ad spend', timestamp: '3 days ago' },
        ],
        members: [
          { id: 'mem-1', name: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
          { id: 'mem-4', name: 'Sarah Lee', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026707d' },
        ],
        documents: [
            { id: 'doc-5', name: 'ad_copy_drafts.docx', lastModified: '2024-05-18', size: '150 KB', url: '#' },
        ],
        chat: []
      },
      {
        id: 'proj-5',
        name: 'Q4 Financial Report',
        icon: BookCopy,
        isFavorite: true,
        notes: 'Deadline is firm for end of month. All department heads need to submit their expense reports by the 15th. Double check all calculations before submitting to the board.',
        tasks: [
          { id: 'task-18', content: 'Gather expense reports', status: 'inprogress', priority: 'urgent', assigneeId: 'mem-5', startDate: format(addDays(startOfCurrentMonth, 1), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 15), 'yyyy-MM-dd') },
          { id: 'task-19', content: 'Consolidate financial data', status: 'todo', priority: 'urgent', assigneeId: 'mem-5', startDate: format(addDays(startOfCurrentMonth, 16), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 22), 'yyyy-MM-dd') },
          { id: 'task-20', content: 'Draft preliminary report', status: 'todo', priority: 'high' },
          { id: 'task-21', content: 'Review with finance committee', status: 'todo', priority: 'high', assigneeId: 'mem-6', startDate: format(addDays(startOfCurrentMonth, 26), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 29), 'yyyy-MM-dd') },
        ],
        activity: [
          { id: 'act-8', description: 'Mike requested expense reports from all departments', timestamp: '1 day ago' },
        ],
        members: [
          { id: 'mem-5', name: 'Mike Chen', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026708d' },
          { id: 'mem-6', name: 'Linda Kim', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026709d' },
        ],
        documents: [],
        chat: []
      },
      {
        id: 'proj-6',
        name: 'Hiring Sprint',
        icon: Users,
        isFavorite: false,
        notes: 'We need to fill 3 open positions for Senior Software Engineer. Screening candidates from the new job board is a priority. Interviews should be scheduled for next week.',
        tasks: [
          { id: 'task-22', content: 'Screen new applicants', status: 'inprogress', priority: 'high', assigneeId: 'mem-1' },
          { id: 'task-23', content: 'Schedule first-round interviews', status: 'todo', priority: 'medium', assigneeId: 'mem-3', startDate: format(addDays(startOfCurrentMonth, 5), 'yyyy-MM-dd'), dueDate: format(addDays(startOfCurrentMonth, 8), 'yyyy-MM-dd') },
          { id: 'task-24', content: 'Prepare technical assessment', status: 'done', priority: 'medium', assigneeId: 'mem-2' },
          { id: 'task-25', content: 'Finalize offer for candidate X', status: 'todo', priority: 'urgent' },
        ],
        activity: [
          { id: 'act-9', description: "Tom finished 'Prepare technical assessment'", timestamp: '1 hour ago' },
          { id: 'act-10', description: 'Received 5 new applications', timestamp: '5 hours ago' },
        ],
        members: [
          { id: 'mem-1', name: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
          { id: 'mem-2', name: 'Tom Clark', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
          { id: 'mem-3', name: 'Peter Pan', avatarUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
        ],
        documents: [],
        chat: []
      },
];

    
