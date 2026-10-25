import { useCallback, useEffect, useRef, useState } from 'react';

// Module-level cache: loaded once, shared across all hook instances
let audioMapCache: Record<string, string> | null = null;
let audioMapLoading: Promise<Record<string, string>> | null = null;

async function loadAudioMap(): Promise<Record<string, string>> {
  if (audioMapCache) return audioMapCache;
  if (audioMapLoading) return audioMapLoading;

  audioMapLoading = fetch('/audio_map.json')
    .then((r) => r.json())
    .then((data) => {
      audioMapCache = data;
      return data;
    })
    .catch(() => {
      audioMapCache = {};
      return {};
    });

  return audioMapLoading;
}

// Preload on module import so it's ready by the time a card renders
loadAudioMap();

export function usePronunciation() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (ttsSupported) window.speechSynthesis.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const speak = useCallback(async (word: string) => {
    // Stop anything currently playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (ttsSupported) window.speechSynthesis.cancel();

    // Try real human audio first
    const map = await loadAudioMap();
    const mp3Url = map[word.toLowerCase()];

    if (mp3Url) {
      // Play the real MP3 recording
      const audio = new Audio(mp3Url);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        // Fallback to TTS if audio file fails
        speakTTS(word);
      };

      try {
        setIsSpeaking(true);
        await audio.play();
      } catch {
        setIsSpeaking(false);
        speakTTS(word);
      }
    } else {
      // No real recording found — use browser TTS
      speakTTS(word);
    }
  }, [ttsSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  function speakTTS(word: string) {
    if (!ttsSupported) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (ttsSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [ttsSupported]);

  return { speak, cancel, isSpeaking, supported: true };
}
