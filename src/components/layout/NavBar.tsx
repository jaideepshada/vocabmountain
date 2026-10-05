import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../shared/ThemeToggle';

export interface NavBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export const NavBar: React.FC<NavBarProps> = ({ 
  title, 
  showBack = false, 
  onBack, 
  rightContent = <ThemeToggle className="-mr-2" />
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex items-center justify-between h-12 px-2 shrink-0 w-full">
      <div className="w-12 flex justify-start">
        {showBack && (
          <button 
            onClick={handleBack}
            className="w-11 h-11 flex items-center justify-center -ml-2 text-ink-secondary hover:text-ink transition-colors"
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 flex justify-center">
        <h1 className="text-base font-semibold text-ink truncate max-w-[200px]">
          {title}
        </h1>
      </div>

      <div className="w-12 flex justify-end">
        {rightContent}
      </div>
    </div>
  );
};
