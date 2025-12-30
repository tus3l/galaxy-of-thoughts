'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState } from 'react';
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

  const handleStarClick = (star: StarData) => {
    setSelectedStar(star);
    setIsOverlayVisible(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayVisible(false);
    setTimeout(() => setSelectedStar(null), 300);
  };

  const handleAddStarSuccess = () => {
    // Refresh the page to show the new star
    window.location.reload();
  };

  return (
    <main className="w-screen h-screen relative">
      <Suspense fallback={<LoadingScreen />}>
        <Scene onStarClick={handleStarClick} />
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
          <div className="glass-panel px-4 md:px-8 py-2 md:py-4">
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              مجرة الأفكار
            </h1>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 md:bottom-8 left-4 md:left-8 pointer-events-auto max-w-[calc(100vw-2rem)] md:max-w-none">
          <div className="glass-panel px-4 md:px-6 py-3 md:py-4 max-w-sm">
            <p className="text-xs md:text-sm text-gray-300 mb-1 md:mb-2">
              <span className="text-blue-400 font-semibold">انقر</span> على أي نجمة لقراءة الرسالة
            </p>
            <p className="text-xs md:text-sm text-gray-300">
              <span className="text-purple-400 font-semibold">اسحب</span> للتدوير • <span className="text-pink-400 font-semibold">التمرير</span> للتقريب
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
              ✨ أضف نجمتك
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
