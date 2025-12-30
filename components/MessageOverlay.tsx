'use client';

import { useEffect } from 'react';
import { StarData } from '@/types';

interface MessageOverlayProps {
  star: StarData | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function MessageOverlay({ star, isVisible, onClose }: MessageOverlayProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isVisible) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !star) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 fade-in"
        onClick={onClose}
      />
      
      {/* Message Panel */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div 
          className="glass-panel max-w-2xl w-full mx-8 p-8 pointer-events-auto fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
          >
            <span className="text-white text-xl">×</span>
          </button>

          {/* Star Icon */}
          <div className="flex items-center justify-center mb-6">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
              }}
            >
              <span className="text-4xl">✨</span>
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-2xl md:text-3xl text-white font-light leading-relaxed mb-6">
              "{star.message}"
            </p>
            
            {/* Metadata */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <span>Star #{star.id}</span>
              <span>•</span>
              <span>{star.createdAt ? new Date(star.createdAt).toLocaleDateString('ar-SA') : 'Unknown'}</span>
            </div>
          </div>

          {/* Close hint */}
          <div className="mt-6 text-center text-sm text-gray-500">
            اضغط ESC أو انقر خارج المربع للإغلاق
          </div>
        </div>
      </div>
    </>
  );
}
