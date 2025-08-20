'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { loginWithTempToken } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function TokenLoginPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [message, setMessage] = useState('Verifying your login...');
  const token = params.token as string;

  useEffect(() => {
    if (!token) {
      setMessage('No login token provided. Redirecting...');
      setTimeout(() => router.push('/'), 2000);
      return;
    }

    const performLogin = async () => {
      const result = await loginWithTempToken(token);

      if (result.success && result.user) {
        sessionStorage.setItem('user', JSON.stringify(result.user));
        if (result.user.settings?.language) {
          localStorage.setItem('checklist_lang', result.user.settings.language);
        }
        toast({
          title: 'Login successful!',
          description: 'You have been logged in.',
        });
        router.push('/app');
      } else {
        setMessage(result.message || 'Login failed. Redirecting...');
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: result.message || 'The link is invalid or has expired.',
        });
        setTimeout(() => router.push('/'), 3000);
      }
    };

    performLogin();
  }, [token, router, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin mb-4" />
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  );
}
