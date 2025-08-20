'use client';

import React from 'react';
import type { Project, ProjectDocument } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, FileImage, FileVideo, FileCode, FileArchive, Download, MoreHorizontal, File } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const fileTypeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileText,
  png: FileImage,
  jpg: FileImage,
  mp4: FileVideo,
  js: FileCode,
  zip: FileArchive,
  default: File,
};

interface ProjectDocumentsViewProps {
    project: Project;
}

export default function ProjectDocumentsView({ project }: ProjectDocumentsViewProps) {
    const documents = project.documents || [];

    const getIcon = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        return fileTypeIcons[extension] || fileTypeIcons.default;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>All files and documents related to the project.</CardDescription>
            </CardHeader>
            <CardContent>
                {documents.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Last Modified</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map(doc => {
                                const Icon = getIcon(doc.name);
                                return (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <Icon className="h-5 w-5 text-muted-foreground" />
                                        </TableCell>
                                        <TableCell className="font-medium">{doc.name}</TableCell>
                                        <TableCell>{doc.lastModified}</TableCell>
                                        <TableCell>{doc.size}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No documents have been added to this project yet.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}