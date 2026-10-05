import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import type { Deck } from './core/types';
import { validateDeck } from './core/deck';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { StudyPage } from './pages/StudyPage';
import { LibraryPage } from './pages/LibraryPage';
import { MissingPage } from './pages/MissingPage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { useTheme } from './hooks/useTheme';

export function App() {
  useTheme(); // Initialize global theme listener
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/words.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load deck: ${res.status}`);
        return res.json();
      })
      .then((data: unknown) => {
        const validated = validateDeck(data);
        setDeck(validated);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load word deck');
      });
  }, []);

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4">
          <p className="text-semantic-red text-base">Failed to load deck</p>
          <p className="text-ink-secondary text-sm">{error}</p>
        </div>
      </AppShell>
    );
  }

  if (!deck) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-ink-secondary text-sm">Loading deck…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage deck={deck} />} />
        <Route path="/study" element={<StudyPage deck={deck} />} />
        <Route path="/library" element={<LibraryPage deck={deck} />} />
        <Route path="/missing" element={<MissingPage deck={deck} />} />
        <Route path="/progress" element={<ProgressPage deck={deck} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
