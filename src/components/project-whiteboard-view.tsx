
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Blocks } from 'lucide-react';

export default function ProjectWhiteboardView() {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Whiteboard</CardTitle>
                <CardDescription>A collaborative space for your team's ideas.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center text-center bg-muted/30 rounded-b-lg">
                <Blocks className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold">Whiteboard Feature</h3>
                <p className="text-muted-foreground mt-2">This is where your collaborative whiteboard will be.</p>
            </CardContent>
        </Card>
    );
}
