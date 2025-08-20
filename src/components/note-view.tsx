
'use client';

import { useState, useEffect } from 'react';
import type { Note, Tag } from '@/lib/types';
import { MarkdownDisplay } from './ui/markdown-display';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Edit, Save, Lock } from 'lucide-react';

interface NoteViewProps {
  note: Note;
  allTags: Tag[];
  onNoteUpdate: (updatedNote: Note) => void;
  isLocked?: boolean;
}

export default function NoteView({ note, allTags, onNoteUpdate, isLocked = false }: NoteViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);

  useEffect(() => {
    setContent(note.content);
    setIsEditing(false);
  }, [note]);

  const handleSave = () => {
    onNoteUpdate({ ...note, content });
    setIsEditing(false);
  };
  
  const handleMarkdownCheckboxToggle = (lineIndex: number) => {
    const lines = content.split('\n');
    const line = lines[lineIndex];
    if (!line) return;

    let updatedLine;
    if (line.trim().startsWith('- [ ]')) {
      updatedLine = line.replace('[ ]', '[x]');
    } else if (line.trim().startsWith('- [x]')) {
      updatedLine = line.replace('[x]', '[ ]');
    } else {
      return;
    }
    
    lines[lineIndex] = updatedLine;
    const newContent = lines.join('\n');
    setContent(newContent);
    onNoteUpdate({ ...note, content: newContent });
  };
  
  const renderLockedState = () => (
    <div className="text-center py-16">
      <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Notatka jest zablokowana</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Kliknij na notatkę w panelu bocznym, aby ją odblokować.
      </p>
    </div>
  );


  return (
    <div className="flex-1 flex flex-col p-6 bg-transparent">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{note.name}</h1>
          <div className="flex flex-wrap gap-2">
            {(note.tags ?? []).map(tagName => {
              const tagInfo = allTags.find(t => t.name === tagName);
              return (
                <Badge 
                  key={tagName} 
                  variant="outline" 
                  style={{ 
                    borderColor: tagInfo?.color ?? undefined,
                    color: tagInfo?.color ?? undefined,
                  }}
                >
                  {tagName}
                </Badge>
              )
            })}
          </div>
        </div>
        {!isLocked && (
            <div>
            {isEditing ? (
                <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Zapisz
                </Button>
            ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edytuj
                </Button>
            )}
            </div>
        )}
      </div>
      <div className="flex-1 rounded-lg border bg-card p-4 overflow-y-auto">
        {isLocked ? (
            renderLockedState()
        ) : isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0"
            placeholder="Zacznij pisać swoją notatkę tutaj..."
          />
        ) : content.trim() ? (
          <MarkdownDisplay
            content={content}
            onCheckboxToggle={handleMarkdownCheckboxToggle}
          />
        ) : (
            <div className="flex items-center justify-center h-full text-center">
                <p className="text-muted-foreground">
                    Ta notatka jest pusta. <br /> Kliknij "Edytuj", aby dodać treść.
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
