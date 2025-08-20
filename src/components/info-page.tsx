
'use client';

import { Button } from './ui/button';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Settings } from '@/lib/types';

interface InfoPageProps {
    language: 'pl' | 'en';
    onSettingsChange: (newSettings: Partial<Settings>) => void;
}

export default function InfoPage({ language, onSettingsChange }: InfoPageProps) {
  const { resolvedTheme } = useTheme();
  const [clickCount, setClickCount] = useState(0);
  const { toast } = useToast();

  const lang = {
    pl: {
      infoTitle: "Witaj w TaskFlow!",
      infoDesc: "To Twoje centrum dowodzenia produktywnością. Stworzone, by pomóc Ci zorganizować zadania, zarządzać projektami i osiągać cele, wszystko w jednym, intuicyjnym miejscu. Korzystaj z kont użytkowników, prywatnych list i personalizacji, aby dostosować aplikację do swoich potrzeb.",
      features: "Kluczowe funkcje:",
      feature1: "Konta użytkowników i synchronizacja w chmurze.",
      feature2: "Prywatne, chronione hasłem listy i presety.",
      feature3: "Personalizacja motywów kolorystycznych i języka.",
      feature4: "Przeciągnij i upuść, aby łatwo zarządzać kolejnością zadań.",
      openSource: "Projekt Open Source",
      openSourceDesc: "TaskFlow jest projektem open-source. Kod źródłowy znajdziesz na GitHubie. Dołącz do nas i pomóż w rozwoju aplikacji!",
      version: "Wersja",
      devModeActivated: "Tryb deweloperski aktywowany!",
    },
    en: {
      infoTitle: "Welcome to TaskFlow!",
      infoDesc: "This is your productivity command center. Designed to help you organize tasks, manage projects, and achieve your goals, all in one intuitive place. Enjoy user accounts, private lists, and personalization to tailor the app to your needs.",
      features: "Key Features:",
      feature1: "User accounts and cloud synchronization.",
      feature2: "Private, password-protected lists and presets.",
      feature3: "Customizable color themes and language settings.",
      feature4: "Drag and drop to easily manage task order.",
      openSource: "Open Source Project",
      openSourceDesc: "TaskFlow is an open-source project. You can find the source code on GitHub. Join us and help develop the application!",
      version: "Version",
      devModeActivated: "Developer mode activated!",
    }
  };
  const currentLang = language === 'en' ? lang.en : lang.pl;

  const handleVersionClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 5) {
      onSettingsChange({ devMode: true });
      toast({ title: currentLang.devModeActivated });
      setClickCount(0); // Reset counter
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center">
            <Image 
                src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'} 
                alt="TaskFlow Logo" 
                width={250} 
                height={250} 
            />
            <h2 className="text-2xl font-bold mt-4">{currentLang.infoTitle}</h2>
            <p className="text-muted-foreground mt-2">
              {currentLang.infoDesc}
            </p>
        </div>
        <div className="py-6 space-y-4 text-sm">
            <h3 className="font-semibold text-center">{currentLang.features}</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>{currentLang.feature1}</li>
              <li>{currentLang.feature2}</li>
              <li>{currentLang.feature3}</li>
              <li>{currentLang.feature4}</li>
            </ul>
            <h3 className="font-semibold text-center pt-4">{currentLang.openSource}</h3>
            <p className="text-muted-foreground text-center">
                {currentLang.openSourceDesc}
            </p>
        </div>
        <div className="text-center text-xs text-muted-foreground" onClick={handleVersionClick}>
            {currentLang.version} 1.0
        </div>
      </div>
    </div>
  );
}
