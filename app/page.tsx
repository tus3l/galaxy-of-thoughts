'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import MessageOverlay from '@/components/MessageOverlay';
import AddStarModal from '@/components/AddStarModal';
import { StarData } from '@/types';

// Dynamically import the 3D scene to avoid SSR issues
const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function Home() {
  const [selectedStar, setSelectedStar] = useState<StarData | null>(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isAddStarModalVisible, setIsAddStarModalVisible] = useState(false);
  const [totalStars, setTotalStars] = useState<number>(0);
  const [newStarPosition, setNewStarPosition] = useState<[number, number, number] | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch total stars count
  const fetchStarsCount = async () => {
    try {
      const response = await fetch('/api/stars/count');
      const data = await response.json();
      setTotalStars(data.count || 0);
    } catch (error) {
      console.error('Error fetching stars count:', error);
    }
  };

  // Load stars count on mount
  useEffect(() => {
    fetchStarsCount();
  }, []);

  const handleStarClick = (star: StarData) => {
    console.log('👆 Star clicked in page.tsx:', star);
    setSelectedStar(star);
    setIsOverlayVisible(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false);
    setTimeout(() => setSelectedStar(null), 300);
  };

  const handleAddStarSuccess = (star?: any) => {
    console.log('🌟 New star data:', star);
    
    // Update counter immediately
    setTotalStars(prev => prev + 1);
    
    // Set new star position to animate camera
    if (star && star.position) {
      console.log('📍 Moving camera to:', star.position);
      setNewStarPosition(star.position);
      
      // Trigger Galaxy to reload stars after animation completes
      setTimeout(() => {
        console.log('✨ Refreshing stars list...');
        setRefreshTrigger(prev => prev + 1);
        // Fetch actual count to ensure sync
        fetchStarsCount();
      }, 3500);
    } else {
      console.error('❌ No position in star data:', star);
      // Refresh manually if no position
      setRefreshTrigger(prev => prev + 1);
      fetchStarsCount();
    }
  };

  return (
    <main className="w-screen h-screen relative">
      <Suspense fallback={<LoadingScreen />}>
        <Scene 
          onStarClick={handleStarClick}
          newStarPosition={newStarPosition}
          refreshTrigger={refreshTrigger}
        />
      </Suspense>
      
      {/* Message Overlay */}
      <MessageOverlay 
        star={selectedStar}
        isVisible={isOverlayVisible}
        onClose={handleCloseOverlay}
      />

      {/* Add Star Modal */}
      <AddStarModal
        isVisible={isAddStarModalVisible}
        onClose={() => setIsAddStarModalVisible(false)}
        onSuccess={handleAddStarSuccess}
      />
      
      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
        {/* Top Bar */}
        <div className="absolute top-4 md:top-8 left-1/2 transform -translate-x-1/2 pointer-events-auto px-4">
          <div className="glass-panel px-4 md:px-8 py-2 md:py-4 text-center">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Galaxy of Thoughts
            </h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              {totalStars.toLocaleString()} Stars
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 md:bottom-8 left-4 md:left-8 pointer-events-auto max-w-[calc(100vw-2rem)] md:max-w-none">
          <div className="glass-panel px-4 md:px-6 py-3 md:py-4 max-w-sm">
            <p className="text-xs md:text-sm text-gray-300 mb-1 md:mb-2">
              <span className="text-blue-400 font-semibold">Click</span> any star to read its message
            </p>
            <p className="text-xs md:text-sm text-gray-300">
              <span className="text-purple-400 font-semibold">Drag</span> to rotate • <span className="text-pink-400 font-semibold">Scroll</span> to zoom
            </p>
          </div>
        </div>

        {/* Add Star Button */}
        <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 pointer-events-auto">
          <button 
            onClick={() => setIsAddStarModalVisible(true)}
            className="glass-panel px-4 md:px-8 py-3 md:py-4 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <span className="text-base md:text-lg font-semibold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              ✨ Add Your Star
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
