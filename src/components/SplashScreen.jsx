import React, { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  "Initializing launcher core...",
  "Checking for updates...",
  "Loading user settings...",
  "Fetching game database...",
  "Verifying integrity...",
  "Connecting to servers...",
  "Preparing visual assets...",
  "Almost ready..."
];

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(LOADING_MESSAGES[0]);
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check cache for previous load data (simulated)
    const cachedProgress = localStorage.getItem('launcher_load_progress');
    let startProgress = 0;
    
    // In a real scenario, we might resume, but for a splash screen, 
    // we usually want to show it briefly every time or check if assets are cached.
    // Here we simulate "fast load" if cached.
    const isCached = localStorage.getItem('launcher_assets_cached') === 'true';
    const duration = isCached ? 2000 : 4000; // Faster if cached
    const intervalTime = 50;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    let currentProgress = startProgress;
    let messageIndex = 0;

    const timer = setInterval(() => {
      currentProgress += increment;
      
      // Update status message based on progress
      const totalMessages = LOADING_MESSAGES.length;
      const messageThreshold = 100 / totalMessages;
      if (currentProgress > (messageIndex + 1) * messageThreshold && messageIndex < totalMessages - 1) {
        messageIndex++;
        setStatus(LOADING_MESSAGES[messageIndex]);
      }

      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(timer);
        
        // Cache success
        localStorage.setItem('launcher_assets_cached', 'true');
        localStorage.setItem('launcher_last_load', Date.now().toString());
        
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setShow(false);
            if (onComplete) onComplete();
          }, 500); // Fade out duration
        }, 200);
      }
      
      setProgress(Math.min(currentProgress, 100));
      // Save progress to cache (requirement: automatically save download/load data to cache)
      localStorage.setItem('launcher_load_progress', currentProgress.toString());

    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Background Visual Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8">
        {/* Logo/Image */}
        <div className="mb-12 relative group">
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/30 transition-all duration-500" />
          <img 
            src="/Saitma-Meme-PNG-758x473-removebg-preview.png" 
            alt="Logo" 
            className="w-32 h-32 object-contain relative z-10 drop-shadow-2xl animate-bounce-slow"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 tracking-wider uppercase">
          crackvìnghèo
        </h1>
        <p className="text-gray-500 text-xs tracking-[0.2em] mb-12 uppercase">Ultimate Game Launcher</p>

        {/* Progress Bar Container */}
        <div className="w-full relative">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-cyan-400">{status}</span>
            <span className="text-gray-400">{Math.round(progress)}%</span>
          </div>
          
          <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 relative transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-shimmer" 
                   style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', transform: 'skewX(-20deg)' }} 
              />
            </div>
          </div>
        </div>

        {/* Technical Stats (Optional "Nerd" stats) */}
        <div className="mt-8 text-[10px] text-gray-600 font-mono flex gap-4 opacity-50">
          <span>MEM: {Math.round(progress * 2.5)}MB</span>
          <span>CACHE: {localStorage.getItem('launcher_assets_cached') ? 'HIT' : 'MISS'}</span>
          <span>VER: 4.0.0</span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
