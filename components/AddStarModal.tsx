'use client';

import { useState, useEffect } from 'react';
import { getUserFingerprint } from '@/lib/fingerprint';

interface AddStarModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: (star?: any) => void;
}

export default function AddStarModal({ isVisible, onClose, onSuccess }: AddStarModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [remainingTime, setRemainingTime] = useState(0);

  // Check if user can submit when modal opens
  useEffect(() => {
    if (isVisible) {
      checkEligibility();
    }
  }, [isVisible]);

  const checkEligibility = async () => {
    try {
      const fingerprintId = await getUserFingerprint();
      const response = await fetch('/api/stars/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprintId }),
      });

      const data = await response.json();
      setCanSubmit(data.canSubmit);
      if (!data.canSubmit) {
        setRemainingTime(data.remainingTime);
      }
    } catch (err) {
      console.error('Error checking eligibility:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const fingerprintId = await getUserFingerprint();
      
      const response = await fetch('/api/stars/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprintId, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add star');
      }

      setSuccess(true);
      setTimeout(() => {
        // Pass the new star data to parent
        if (onSuccess && data.star) {
          onSuccess(data.star);
        }
        onClose();
        setMessage('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError('');
    setSuccess(false);
    onClose();
  };

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    
    if (isVisible) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const formatRemainingTime = (minutes: number) => {
    // Since we're using 1-minute cooldown, convert to seconds
    const seconds = Math.ceil(minutes * 60);
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} minute${mins !== 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4 overflow-y-auto">
        <div 
          className="glass-panel max-w-2xl w-full p-4 sm:p-6 md:p-8 pointer-events-auto fade-in my-4"
          style={{ animationDelay: '0.1s' }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
          >
            <span className="text-white text-xl">×</span>
          </button>

          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-block p-4 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-400/20 mb-4">
              <span className="text-4xl">✨</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Add Your Star to the Galaxy
            </h2>
            <p className="text-gray-400 text-sm">
              Share your message with the world • One star every minute
            </p>
          </div>

          {/* Cannot Submit Message */}
          {!canSubmit && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-center">
                ⏰ You've already added your star!<br />
                You can add a new star in {formatRemainingTime(remainingTime)}
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-green-300 text-center">
                ✨ Your star has been added successfully! Updating the galaxy...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          {canSubmit && !success && (
            <form onSubmit={handleSubmit}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here... (10-280 characters)"
                className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400/50 transition-colors resize-none"
                maxLength={280}
                minLength={10}
                required
                disabled={isSubmitting}
              />
              
              <div className="flex justify-between items-center mt-2 mb-6">
                <span className="text-sm text-gray-400">
                  {message.length}/280
                </span>
                <span className="text-xs text-gray-500">
                  {message.length >= 10 ? '✓' : ''} Minimum: 10 characters
                </span>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 sm:px-6 py-3 text-sm sm:text-base bg-white/5 hover:bg-white/10 active:bg-white/20 text-white rounded-lg transition-all duration-300 touch-manipulation"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || message.length < 10}
                  className="flex-1 px-4 sm:px-6 py-3 text-sm sm:text-base bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 active:from-yellow-600 active:to-orange-600 text-black font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {isSubmitting ? 'Adding...' : '✨ Launch Star'}
                </button>
              </div>
            </form>
          )}

          {/* Close button if cannot submit */}
          {!canSubmit && (
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-300"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}
