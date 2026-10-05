import React, { useState } from 'react';
import { supabase } from '../../core/supabase';
import { useAuth } from '../../hooks/useAuth';

export const AuthSection: React.FC = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (loading) {
    return (
      <section>
        <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-4">Cloud Sync</h2>
        <div className="bg-surface-raised border border-border rounded-card p-5 animate-pulse h-32" />
      </section>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSync = async () => {
    setAuthLoading(true);
    setError(null);
    setMessage(null);
    
    // Dynamically import to avoid circular dependencies during initialization if any
    const { syncDatabase } = await import('../../db/sync');
    const result = await syncDatabase();
    
    setAuthLoading(false);
    if (result.success) {
      setMessage('Sync complete! Your data is backed up.');
    } else {
      setError(result.message || 'Sync failed.');
    }
  };

  return (
    <section>
      <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-4">Cloud Sync</h2>
      
      {user ? (
        <div className="bg-surface-raised border border-border rounded-card p-5 space-y-4">
          <div>
            <p className="text-sm font-medium text-ink">Logged in securely</p>
            <p className="text-sm text-ink-secondary mt-0.5">{user.email}</p>
          </div>
          
          {error && <p className="text-sm text-semantic-red">{error}</p>}
          {message && <p className="text-sm text-semantic-green">{message}</p>}

          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleSignOut}
              className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-button text-ink hover:bg-surface transition-colors"
            >
              Sign Out
            </button>
            <button 
              onClick={handleSync}
              disabled={authLoading}
              className="flex-1 px-4 py-2 text-sm font-medium bg-accent text-white dark:text-surface rounded-button hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {authLoading ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface-raised border border-border rounded-card p-5">
          <p className="text-sm text-ink-secondary mb-4">
            Create an account to securely back up your progress and sync across devices.
          </p>

          <form onSubmit={handleAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-button text-sm text-ink focus:outline-none focus:border-accent"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-button text-sm text-ink focus:outline-none focus:border-accent"
              required
              minLength={6}
            />
            
            {error && <p className="text-sm text-semantic-red pt-1">{error}</p>}
            {message && <p className="text-sm text-semantic-green pt-1">{message}</p>}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-accent text-white dark:text-surface rounded-button font-medium text-sm disabled:opacity-50 transition-opacity mt-2"
            >
              {authLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-xs text-ink-secondary hover:text-ink underline transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
