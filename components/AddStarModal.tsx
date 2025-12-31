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
        throw new Error(data.error || 'فشل في إضافة النجمة');
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
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ساعة و ${mins} دقيقة`;
    }
    return `${mins} دقيقة`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
        <div 
          className="glass-panel max-w-2xl w-full p-6 md:p-8 pointer-events-auto fade-in"
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
              أضف نجمتك إلى المجرة
            </h2>
            <p className="text-gray-400 text-sm">
              شارك رسالتك مع العالم • نجمة واحدة كل 24 ساعة
            </p>
          </div>

          {/* Cannot Submit Message */}
          {!canSubmit && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-center">
                ⏰ لقد أضفت نجمتك اليوم!<br />
                يمكنك إضافة نجمة جديدة بعد {formatRemainingTime(remainingTime)}
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-green-300 text-center">
                ✨ تم إضافة نجمتك بنجاح! جاري تحديث المجرة...
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
                placeholder="اكتب رسالتك هنا... (10-280 حرف)"
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
                  {message.length >= 10 ? '✓' : ''} الحد الأدنى: 10 أحرف
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-300"
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || message.length < 10}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الإضافة...' : '✨ إطلاق النجمة'}
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
              إغلاق
            </button>
          )}
        </div>
      </div>
    </>
  );
}
