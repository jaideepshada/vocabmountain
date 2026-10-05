import React from 'react';
import type { Word } from '../../core/types';

interface CardBackProps {
  word: Word;
}

export const CardBack: React.FC<CardBackProps> = ({ word }) => {
  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-8 flex flex-col">
      <div className="text-xs font-sans uppercase tracking-wide text-ink-tertiary mb-4">
        {word.partOfSpeech}
      </div>
      
      <div className="flex flex-col flex-1">
        {word.senses.map((sense, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col mb-4 last:mb-0">
              <div className="flex items-start gap-3">
                {word.senses.length > 1 && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-raised border border-border flex items-center justify-center text-[10px] text-ink-tertiary mt-0.5">
                    {index + 1}
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-[17px] leading-relaxed text-ink font-sans">
                    {sense.definition}
                  </div>
                  {sense.example && (
                    <div className="italic text-ink-secondary text-[16px] mt-1 pl-3 border-l-2 border-accent">
                      {sense.example}
                    </div>
                  )}
                  {sense.synonyms && sense.synonyms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {sense.synonyms.map((synonym, i) => (
                        <div key={i} className="bg-surface text-ink-secondary text-xs px-2.5 py-1 rounded-chip border border-border-subtle">
                          {synonym}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {index < word.senses.length - 1 && (
              <hr className="border-border-subtle my-4" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
