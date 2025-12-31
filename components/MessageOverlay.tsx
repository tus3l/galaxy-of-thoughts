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
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
        <div 
          className="glass-panel max-w-2xl w-full mx-4 p-4 md:mx-8 md:p-8 pointer-events-auto fade-in max-h-[90vh] overflow-y-auto"
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
            <div className="text-6xl animate-pulse">
              ⭐
            </div>
          </div>

          {/* Star Coordinates */}
          <div className="mb-4 p-3 bg-black/20 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 text-center font-mono">
              Coordinates: ({star.position[0].toFixed(1)}, {star.position[1].toFixed(1)}, {star.position[2].toFixed(1)})
            </p>
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
              <span>{star.createdAt ? new Date(star.createdAt).toLocaleDateString('en-US') : 'Unknown'}</span>
            </div>
          </div>

          {/* Close hint */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Press ESC or click outside to close
          </div>
        </div>
      </div>
    </>
  );
}
