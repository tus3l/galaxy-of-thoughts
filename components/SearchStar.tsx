'use client';

import { useState } from 'react';

interface SearchStarProps {
  onStarFound: (star: any) => void;
  onClose: () => void;
}

export default function SearchStar({ onStarFound, onClose }: SearchStarProps) {
  const [starId, setStarId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!starId || parseInt(starId) < 1) {
      setError('Please enter a valid star ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/stars/search?id=${starId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Star not found');
        setLoading(false);
        return;
      }

      // إرسال النجمة للـ parent
      onStarFound(data.star);
      onClose();
    } catch (err) {
      setError('An error occurred while searching');
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        background: 'rgba(0, 5, 16, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel p-8 max-w-md w-full animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* العنوان */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            🔍 Search Star by ID
          </h2>
          <p className="text-white/60 text-sm">
            Enter the star number to find it in the galaxy
          </p>
        </div>

        {/* النموذج */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="starId" className="block text-white/80 mb-2 text-sm font-medium">
              Star ID #
            </label>
            <input
              id="starId"
              type="number"
              min="1"
              value={starId}
              onChange={(e) => {
                setStarId(e.target.value);
                setError('');
              }}
              placeholder="e.g. 42"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition-all"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* رسالة خطأ */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* الأزرار */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !starId}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🔍</span>
                  Searching...
                </span>
              ) : (
                '🚀 Find Star'
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/80 font-medium rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* معلومات إضافية */}
        <div className="mt-6 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
          <p className="text-white/50 text-xs text-center">
            💡 Tip: Each star has a unique ID number. Share yours with friends!
          </p>
        </div>
      </div>
    </div>
  );
}
