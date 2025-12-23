import { useState, useEffect } from 'react';

export default function Tutorial() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial) {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const steps = [
    {
      target: 'home',
      title: 'Welcome to crackvìnghèo! 🎮',
      description: 'This is your Home page where you can browse all available games',
      position: { top: '20%', left: '250px' },
      arrow: { top: '50%', left: '-100px', rotation: 180 }
    },
    {
      target: 'library',
      title: 'Your Library 📚',
      description: 'All your installed games will appear here',
      position: { top: '30%', left: '250px' },
      arrow: { top: '50%', left: '-100px', rotation: 180 }
    },
    {
      target: 'downloads',
      title: 'Downloads 📥',
      description: 'Track your game downloads and installations here',
      position: { top: '40%', left: '250px' },
      arrow: { top: '50%', left: '-100px', rotation: 180 }
    },
    {
      target: 'search',
      title: 'Search Games 🔍',
      description: 'Find your favorite games quickly',
      position: { bottom: '200px', right: '550px' },
      arrow: { top: '100%', right: '150px', rotation: 90 }
    }
  ];

  useEffect(() => {
    if (show) {
      const targetElement = document.querySelector(`[data-tutorial="${steps[step].target}"]`);
      if (targetElement) {
        targetElement.classList.add('tutorial-highlight');
      }
      return () => {
        if (targetElement) {
          targetElement.classList.remove('tutorial-highlight');
        }
      };
    }
  }, [show, step]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShow(false);
  };

  if (!show) return null;

  const currentStep = steps[step];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] animate-fadeIn" onClick={handleClose} />
      
      {/* Tutorial Card */}
      <div 
        className="fixed z-[10001] animate-slideUp"
        style={currentStep.position}
      >
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-2xl border border-cyan-500/30 max-w-xs backdrop-blur-xl">
          {/* Step Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                {step + 1}
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Step {step + 1}/{steps.length}</span>
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold mb-3 text-white">{currentStep.title}</h3>
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">{currentStep.description}</p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-700 rounded-full h-1 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                ← Back
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/50 text-white rounded-lg transition-all text-sm font-medium"
            >
              {step === steps.length - 1 ? '✓ Done' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
