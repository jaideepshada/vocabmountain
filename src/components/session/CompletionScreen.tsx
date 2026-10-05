import React from 'react';
import { motion } from 'framer-motion';
import type { SessionType } from '../../core/types';
import { useAllSessions } from '../../db/hooks';
import { coveredDays } from '../../core/session';
import { MountainProgress } from '../progress/MountainProgress';


interface CompletionScreenProps {
  totalCards: number;
  sessionType: SessionType;
  onGoHome: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  totalCards,
  onGoHome,
}) => {
  const sessions = useAllSessions();
  const days = coveredDays(sessions);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.8,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-surface">
      <motion.div
        className="mb-8"
        initial={{ strokeDashoffset: 100 }}
        animate={{ strokeDashoffset: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <svg className="w-24 h-24 text-semantic-green" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
          <motion.path
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="100"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center flex flex-col items-center"
      >
        <motion.h1 variants={itemVariants} className="font-serif text-3xl text-ink mb-2">
          All done
        </motion.h1>
        
        <motion.p variants={itemVariants} className="text-lg text-ink-secondary mb-10">
          {totalCards} cards mastered
        </motion.p>

        <motion.div variants={itemVariants} className="w-full mb-10">
          <MountainProgress coveredDays={days} compact />
        </motion.div>
        
        <motion.button
          variants={itemVariants}
          onClick={onGoHome}
          className="bg-accent text-white dark:text-surface rounded-button px-8 py-3 text-base font-medium shadow-soft hover:opacity-90 transition-opacity"
        >
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
};
