'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@lands.gov.pg');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login successful!');
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #4A4284 0%, #5A5294 100%)' }}>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3 pb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/dlpp-logo.svg"
              alt="DLPP Logo"
              className="h-24 w-auto"
            />
          </div>
          <CardTitle className="text-2xl text-center font-bold" style={{ color: '#4A4284' }}>Legal Case Management System</CardTitle>
          <CardDescription className="text-center text-base">
            Department of Lands & Physical Planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-white font-semibold hover:opacity-90 transition-opacity"
              style={{ background: '#EF5A5A' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
