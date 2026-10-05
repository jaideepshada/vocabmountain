import React from 'react';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-ink safe-area-pad">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col relative">
        {children}
      </div>
    </div>
  );
};
