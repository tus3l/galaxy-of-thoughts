'use client';

export default function LoadingScreen() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-xl text-gray-400 animate-pulse">
          Loading the Universe...
        </p>
      </div>
    </div>
  );
}
