'use client';

import { useEffect, useState } from 'react';

interface WelcomeMessageProps {
  onComplete: () => void;
}

export default function WelcomeMessage({ onComplete }: WelcomeMessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // إخفاء الرسالة بعد 5 ثواني
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 500); // انتظر نهاية الـ fade out
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        animation: visible ? 'fadeIn 1s ease-in' : 'fadeOut 0.5s ease-out',
      }}
    >
      <div className="text-center space-y-4 px-4">
        <h1 
          className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          style={{ textShadow: '0 0 40px rgba(147, 51, 234, 0.5)' }}
        >
          Welcome to the Galaxy
        </h1>
        <p className="text-xl md:text-2xl text-white/80">
          ✨ Each star is a thought, a dream, a message...
        </p>
        <p className="text-lg md:text-xl text-white/60">
          Explore the universe of ideas
        </p>
      </div>
    </div>
  );
}
