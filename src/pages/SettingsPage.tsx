import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/layout/NavBar';
import { serializeProgress } from '../core/exportImport';
import { deserializeProgress } from '../core/exportImport';
import { getAllEvents, getAllSessions, importData, clearAllData } from '../db/database';
import { useTheme, type Theme } from '../hooks/useTheme';
import { AuthSection } from '../components/auth/AuthSection';
import { supabase } from '../core/supabase';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = async () => {
    try {
      const events = await getAllEvents();
      const sessions = await getAllSessions();
      const json = serializeProgress(events, sessions);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab-mountain-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setImportError('File too large. Maximum 10 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result;
        if (typeof text !== 'string') throw new Error('Could not read file');
        const data = deserializeProgress(text);
        const ok = window.confirm(
          `Import ${data.events.length} events and ${data.sessions.length} sessions?\nThis will merge with existing data.`,
        );
        if (ok) {
          await importData(data.events, data.sessions);
          setImportSuccess(true);
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Invalid backup file.');
      }
    };
    reader.onerror = () => setImportError('Failed to read file.');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = async () => {
    const ok = window.confirm('Delete ALL progress? This cannot be undone and will wipe both local and cloud data.');
    if (!ok) return;
    try {
      // 1. Wipe cloud data if logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Deleting sessions will cascade and delete review_events as well based on our SQL setup, 
        // but we explicitly delete both just to be safe.
        await supabase.from('review_events').delete().eq('user_id', user.id);
        await supabase.from('sessions').delete().eq('user_id', user.id);
      }
      
      // 2. Wipe local data
      await clearAllData();
      
      // 3. Reload app to clear state
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed to clear data. Please try again.');
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden">
      <NavBar title="Settings" showBack onBack={() => navigate(-1)} />

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Appearance section */}
        <section>
          <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-4">Appearance</h2>
          <div className="bg-surface-raised border border-border rounded-card p-1 flex">
            {(['system', 'light', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 py-2 text-sm font-medium capitalize rounded-chip transition-all ${
                  theme === t
                    ? 'bg-surface shadow-soft text-ink'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <AuthSection />

        {/* Data section */}
        <section>
          <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-4">Data</h2>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full text-left p-4 bg-surface-raised border border-border rounded-card text-sm font-medium text-ink hover:border-accent transition-colors"
            >
              Export Progress
              <span className="block text-xs text-ink-tertiary font-normal mt-0.5">
                Download a JSON backup of all events
              </span>
            </button>

            <label className="block w-full cursor-pointer p-4 bg-surface-raised border border-border rounded-card text-sm font-medium text-ink hover:border-accent transition-colors">
              Import Progress
              <span className="block text-xs text-ink-tertiary font-normal mt-0.5">
                Merge a JSON backup into this device
              </span>
              <input type="file" accept=".json,application/json" onChange={handleImport} className="sr-only" />
            </label>

            {importError && (
              <p className="text-sm text-semantic-red px-1">{importError}</p>
            )}
            {importSuccess && (
              <p className="text-sm text-semantic-green px-1">Import successful.</p>
            )}
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Danger zone */}
        <section>
          <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-4">Danger Zone</h2>
          <button
            onClick={handleClear}
            className="w-full text-left p-4 bg-surface border border-semantic-red rounded-card text-sm font-medium text-semantic-red hover:bg-[color:var(--color-red-subtle)] transition-colors"
          >
            Clear All Data
            <span className="block text-xs font-normal opacity-70 mt-0.5">
              Deletes all sessions and review history
            </span>
          </button>
        </section>

        <div className="h-px bg-border" />

        {/* About */}
        <section>
          <h2 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-4">About</h2>
          <div className="bg-surface-raised border border-border rounded-card p-5 space-y-1">
            <div className="font-serif text-base text-ink">Vocab Mountain</div>
            <div className="text-sm text-ink-secondary">1,020 words · 34 days</div>
            <div className="text-sm text-ink-tertiary pt-1">Built for GRE prep</div>
          </div>
        </section>
      </div>
    </div>
  );
}
