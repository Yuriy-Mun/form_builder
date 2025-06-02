'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SupabaseAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp, loading } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signIn(email, password);
      toast.success('Signed in successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signUp(email, password);
      toast.success('Signed up successfully! Please check your email for confirmation.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign up failed');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6 bg-card rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center">Authentication</h2>
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-4">
          <Button
            type="button"
            className="w-full"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSignUp}
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </div>
      </form>
    </div>
  );
} 