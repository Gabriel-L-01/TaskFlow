'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { registerUser, loginUser } from '@/lib/actions';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PasswordInput } from './ui/password-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from './ui/dialog';
import { QrCode, LogIn, LogOut, Loader2 } from 'lucide-react';
import QRCode from "react-qr-code";
import type { User } from '@/lib/types';


export default function AuthPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading'>('idle');
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [language, setLanguage] = useState('pl');
  const [currentUrl, setCurrentUrl] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUrl(window.location.href);
    const storedLang = localStorage.getItem('checklist_lang') || 'pl';
    setLanguage(storedLang);

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        setLoggedInUser(JSON.parse(storedUser));
      } catch (e) {
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('checklist_lang', lang);
  }

  const lang = {
    pl: {
      login: "Logowanie",
      register: "Rejestracja",
      welcomeBack: "Witaj ponownie!",
      loginPrompt: "Zaloguj się, aby kontynuować pracę ze swoimi listami.",
      emailOrUser: "Email lub nazwa użytkownika",
      emailOrUserPlaceholder: "email@example.com lub nazwa",
      password: "Hasło",
      loginButton: "Zaloguj się",
      loggingIn: "Logowanie...",
      createAccount: "Stwórz konto",
      registerPrompt: "Wpisz swoje dane, aby rozpocząć przygodę z TaskFlow.",
      username: "Nazwa użytkownika",
      usernamePlaceholder: "twoja_nazwa",
      email: "Email",
      emailPlaceholder: "email@example.com",
      registerButton: "Zarejestruj się",
      registering: "Rejestrowanie...",
      loginSuccess: "Logowanie udane!",
      loginSuccessDesc: "Zaraz zostaniesz przekierowany.",
      loginError: "Błąd logowania",
      registerSuccess: "Rejestracja pomyślna!",
      registerSuccessDesc: "Możesz się teraz zalogować.",
      registerError: "Błąd rejestracji",
      shareUrlQr: "Udostępnij URL przez QR",
      shareUrlQrDesc: "Zeskanuj ten kod, aby otworzyć ten sam adres URL na innym urządzeniu.",
      alreadyLoggedIn: "Jesteś już zalogowany jako",
      goToApp: "Przejdź do aplikacji",
      logout: "Wyloguj się",
    },
    en: {
      login: "Login",
      register: "Register",
      welcomeBack: "Welcome back!",
      loginPrompt: "Log in to continue working with your lists.",
      emailOrUser: "Email or username",
      emailOrUserPlaceholder: "email@example.com or username",
      password: "Password",
      loginButton: "Log in",
      loggingIn: "Logging in...",
      createAccount: "Create account",
      registerPrompt: "Enter your details to start your adventure with TaskFlow.",
      username: "Username",
      usernamePlaceholder: "your_username",
      email: "Email",
      emailPlaceholder: "email@example.com",
      registerButton: "Register",
      registering: "Registering...",
      loginSuccess: "Login successful!",
      loginSuccessDesc: "You will be redirected shortly.",
      loginError: "Login error",
      registerSuccess: "Registration successful!",
      registerSuccessDesc: "You can now log in.",
      registerError: "Registration error",
      shareUrlQr: "Share URL via QR",
      shareUrlQrDesc: "Scan this code to open the same URL on another device.",
      alreadyLoggedIn: "You are already logged in as",
      goToApp: "Go to app",
      logout: "Log out",
    }
  };
  const currentLang = language === 'en' ? lang.en : lang.pl;


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginStatus('loading');
    const formData = new FormData(e.currentTarget);
    const result = await loginUser(formData);

    if (result.success && result.user) {
      toast({
        title: currentLang.loginSuccess,
        description: currentLang.loginSuccessDesc,
      });
      sessionStorage.setItem('user', JSON.stringify(result.user));
      if (result.user.settings?.language) {
          localStorage.setItem('checklist_lang', result.user.settings.language);
      }
      router.push('/app');
    } else {
      setLoginStatus('idle');
      toast({
        variant: 'destructive',
        title: currentLang.loginError,
        description: result.message,
      });
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result.success) {
      toast({
        title: currentLang.registerSuccess,
        description: currentLang.registerSuccessDesc,
      });
      setTimeout(() => setActiveTab('login'), 500);
    } else {
      toast({
        variant: 'destructive',
        title: currentLang.registerError,
        description: result.message,
      });
    }
    setIsLoading(false);
  };
  
  const handleLogout = () => {
    sessionStorage.removeItem('user');
    setLoggedInUser(null);
  };

  const renderLoggedInState = () => {
    if (!loggedInUser) return null;
    
    return (
        <Card className={cn('w-full max-w-[400px]', 'bg-card', theme === 'light' && 'glass-panel')}>
            <CardHeader className="text-center">
                <CardTitle>{currentLang.welcomeBack}</CardTitle>
                <CardDescription>
                    {currentLang.alreadyLoggedIn} <strong>{loggedInUser.username}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                 <Button onClick={() => router.push('/app')}>
                    <LogIn className="mr-2 h-4 w-4" />
                    {currentLang.goToApp}
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {currentLang.logout}
                </Button>
            </CardContent>
        </Card>
    );
  };
  
  const renderAuthContent = () => {
    if (loginStatus === 'loading') {
        return (
            <Card className={cn('w-full max-w-[400px]', 'bg-card', theme === 'light' && 'glass-panel')}>
                <CardContent className="flex flex-col items-center justify-center p-12 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-lg font-semibold text-muted-foreground">{currentLang.loggingIn}</p>
                </CardContent>
            </Card>
        );
    }

     return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{currentLang.login}</TabsTrigger>
                <TabsTrigger value="register">{currentLang.register}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <form onSubmit={handleLogin}>
                <Card className={cn('bg-card', theme === 'light' && 'glass-panel')}>
                    <CardHeader>
                    <CardTitle>{currentLang.welcomeBack}</CardTitle>
                    <CardDescription>
                        {currentLang.loginPrompt}
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="identifier">{currentLang.emailOrUser}</Label>
                        <Input id="identifier" name="identifier" type="text" placeholder={currentLang.emailOrUserPlaceholder} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password-login">{currentLang.password}</Label>
                        <PasswordInput id="password-login" name="password" required />
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading || loginStatus === 'loading'}>
                        {currentLang.loginButton}
                    </Button>
                    </CardFooter>
                </Card>
                </form>
            </TabsContent>
            <TabsContent value="register">
                <form onSubmit={handleRegister}>
                <Card className={cn('bg-card', theme === 'light' && 'glass-panel')}>
                    <CardHeader>
                    <CardTitle>{currentLang.createAccount}</CardTitle>
                    <CardDescription>
                        {currentLang.registerPrompt}
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">{currentLang.username}</Label>
                        <Input id="username" name="username" type="text" placeholder={currentLang.usernamePlaceholder} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email-register">{currentLang.email}</Label>
                        <Input id="email-register" name="email" type="email" placeholder={currentLang.emailPlaceholder} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password-register">{currentLang.password}</Label>
                        <PasswordInput id="password-register" name="password" required />
                    </div>
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? currentLang.registering : currentLang.registerButton}
                    </Button>
                    </CardFooter>
                </Card>
                </form>
            </TabsContent>
        </Tabs>
     );
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent relative p-4">
       <div className="absolute top-4 right-4 flex items-center gap-2">
         <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <QrCode className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>{currentLang.shareUrlQr}</DialogTitle>
                    <DialogDescription>{currentLang.shareUrlQrDesc}</DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                    {currentUrl && <QRCode value={currentUrl} size={224} />}
                </div>
            </DialogContent>
         </Dialog>
         <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pl">Polski</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        <ThemeToggle onThemeChange={setTheme} currentTheme={theme} />
      </div>
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        <Image 
            src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo-light.svg'} 
            alt="TaskFlow Logo" 
            width={250} 
            height={250} 
            className="mb-8" 
        />
        {loggedInUser ? renderLoggedInState() : renderAuthContent()}
      </div>
    </div>
  );
}
