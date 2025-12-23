import { useState } from 'react';

export default function Accessibility() {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Accessibility</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-900/50 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Visual</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Font Size: {fontSize}px</label>
              <input 
                type="range" 
                min="12" 
                max="24" 
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span>High Contrast Mode</span>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-14 h-8 rounded-full transition ${highContrast ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${highContrast ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Reduce Motion</span>
              <button
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`w-14 h-8 rounded-full transition ${reduceMotion ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${reduceMotion ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
