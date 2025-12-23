import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useUserState } from '../hooks/useCache';

export default function WelcomeScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { user, isLoading } = useUserState();
  const [step, setStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [selectedLang, setSelectedLang] = useState(language);

  useEffect(() => {
    if (isLoading) return;
    
    // Kiểm tra localStorage trước (fallback)
    const hasSeenLocal = localStorage.getItem('hasSeenWelcomeScreen');
    if (hasSeenLocal === 'true') {
      setShowWelcome(false);
      return;
    }
    
    // Nếu chưa thấy welcome screen thì hiển thị
    setShowWelcome(true);
    const savedTheme = localStorage.getItem('appTheme') || 'dark';
    setTheme(savedTheme);
  }, [isLoading]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLanguageChange = (lang) => {
    setSelectedLang(lang);
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenWelcomeScreen', 'true');
    setShowWelcome(false);
  };

  if (!showWelcome) return null;

  const languages = [
    { code: 'vi', label: '🇻🇳 Tiếng Việt', name: 'Vietnamese' },
    { code: 'en', label: '🇺🇸 English', name: 'English' },
  ];

  const themes = [
    { id: 'dark', name: 'Dark Mode', icon: '🌙', desc: 'Perfect for gaming' },
    { id: 'light', name: 'Light Mode', icon: '☀️', desc: 'Bright interface' },
  ];

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center ${theme === 'light' ? 'bg-gray-100' : 'bg-black'}`}>
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-0 left-0 w-96 h-96 ${theme === 'light' ? 'bg-blue-200' : 'bg-blue-900'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob`}></div>
        <div className={`absolute top-0 right-0 w-96 h-96 ${theme === 'light' ? 'bg-purple-200' : 'bg-purple-900'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000`}></div>
        <div className={`absolute -bottom-8 left-20 w-96 h-96 ${theme === 'light' ? 'bg-pink-200' : 'bg-pink-900'} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000`}></div>
      </div>

      {/* Content */}
      <div className={`relative z-10 w-full max-w-2xl mx-auto px-6 py-12 rounded-2xl backdrop-blur-md ${
        theme === 'light' 
          ? 'bg-white/80 shadow-2xl' 
          : 'bg-gray-900/80 border border-gray-700'
      }`}>
        
        {/* Step indicator */}
        <div className="flex justify-between mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 mx-1">
              <div className={`h-2 rounded-full transition-colors duration-300 ${
                i <= step 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                  : theme === 'light' ? 'bg-gray-300' : 'bg-gray-700'
              }`}></div>
            </div>
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 0 && (
          <div className="text-center animate-fadeIn">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className={`text-4xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Welcome to crackvìnghèo
            </h1>
            <p className={`text-lg mb-8 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              Your Ultimate Game Launcher
            </p>

            <button
              onClick={() => setStep(1)}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Theme Selection */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Choose Your Theme
            </h2>
            <p className={`mb-8 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              How do you prefer the launcher?
            </p>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    theme === t.id
                      ? `${t.id === 'light' ? 'border-blue-500 bg-blue-50/50' : 'border-cyan-500 bg-gray-800/50'}`
                      : `${theme === 'light' ? 'border-gray-300 hover:border-gray-400' : 'border-gray-700 hover:border-gray-600'}`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl mt-1">{t.icon}</span>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {t.name}
                      </h3>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        {t.desc}
                      </p>
                    </div>
                    {theme === t.id && (
                      <div className="text-2xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(0)}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                  theme === 'light'
                    ? 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Language Selection */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h2 className={`text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Select Language
            </h2>
            <p className={`mb-8 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
              Choose your language
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left font-medium ${
                    selectedLang === lang.code
                      ? `${theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-cyan-500 bg-gray-800'}`
                      : `${theme === 'light' ? 'border-gray-300 hover:border-gray-400' : 'border-gray-700 hover:border-gray-600'}`
                  }`}
                >
                  <div className={`${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                    {lang.label}
                  </div>
                  <div className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    {lang.name}
                  </div>
                  {selectedLang === lang.code && (
                    <div className="text-lg mt-2">✓</div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                  theme === 'light'
                    ? 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                ← Back
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Get Started 🚀
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
