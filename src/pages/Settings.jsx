import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

function Settings() {
  const navigate = useNavigate();
  const { language: currentLang, setLanguage: setGlobalLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const [installPath, setInstallPath] = useState('C:\\Games');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [downloadLimit, setDownloadLimit] = useState(false);
  const [maxDownloadSpeed, setMaxDownloadSpeed] = useState('10');
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState(currentLang);
  const [startMinimized, setStartMinimized] = useState(false);
  const [closeToTray, setCloseToTray] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [previousTab, setPreviousTab] = useState('/');
  const [currentGameName, setCurrentGameName] = useState('');

  useEffect(() => {
    const prevTab = localStorage.getItem('previousTab') || '/';
    setPreviousTab(prevTab);
  }, []);

  const handleBrowse = async () => {
    if (window.electron && window.electron.selectDirectory) {
      const result = await window.electron.selectDirectory();
      if (result && !result.canceled && result.filePaths[0]) {
        let selectedPath = result.filePaths[0];
        if (currentGameName) {
          const sanitizedName = currentGameName.replace(/[<>:"/\\|?*]/g, '_');
          selectedPath = `${selectedPath}\\${sanitizedName}`;
        }
        setInstallPath(selectedPath);
      }
    }
  };

  const handleSave = () => {
    const settings = {
      installPath,
      autoUpdate,
      notifications,
      downloadLimit,
      maxDownloadSpeed,
      theme,
      language,
      startMinimized,
      closeToTray
    };
    localStorage.setItem('gameSettings', JSON.stringify(settings));
    setGlobalLanguage(language);
    navigate(previousTab);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'downloads', name: 'Downloads', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    { id: 'appearance', name: 'Appearance', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { id: 'notifications', name: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'about', name: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="flex h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black relative">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all border border-gray-600/50"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-xl border-r border-cyan-500/20 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{t('settings')}</h1>
            <p className="text-xs text-gray-400">{t('customizeExperience')}</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full group flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 text-white shadow-lg shadow-cyan-500/10'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border border-transparent hover:border-gray-700/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                activeTab === tab.id ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg' : 'bg-gray-800 group-hover:bg-gray-700'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium">{t(tab.id)}</p>
                <p className="text-xs opacity-60">{t(`configure${tab.name}`)}</p>
              </div>
            </button>
          ))}
        </nav>
        
        {/* Save Button in Sidebar */}
        <div className="mt-8 pt-6 border-t border-gray-700/50">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-medium transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {t('saveSettings')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 pt-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                activeTab === 'general' ? 'from-cyan-500 to-blue-600' :
                activeTab === 'downloads' ? 'from-blue-500 to-indigo-600' :
                activeTab === 'appearance' ? 'from-purple-500 to-pink-600' :
                activeTab === 'notifications' ? 'from-yellow-500 to-orange-600' :
                'from-gray-500 to-gray-600'
              } shadow-lg`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tabs.find(t => t.id === activeTab)?.icon} />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">{t(activeTab)} {t('settings')}</h2>
                <p className="text-gray-400">{t('managePreferences')}</p>
              </div>
            </div>
          </div>

          {activeTab === 'general' && (
            <div className="max-w-5xl space-y-6">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                        </svg>
                        {t('defaultInstallLocation')}
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={installPath}
                          onChange={(e) => setInstallPath(e.target.value)}
                          className="flex-1 bg-gray-900/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        />
                        <button 
                          onClick={handleBrowse}
                          className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-xl transition-all font-medium">
                          {t('browse')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        {t('language')}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-gray-900/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      >
                        <option value="en">English</option>
                        <option value="vi">Tiếng Việt</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {[
                      { key: 'autoUpdate', label: t('autoUpdateGames'), desc: t('autoUpdateDesc'), value: autoUpdate, setter: setAutoUpdate },
                      { key: 'startMinimized', label: t('startWithWindows'), desc: t('startWithWindowsDesc'), value: startMinimized, setter: setStartMinimized },
                      { key: 'closeToTray', label: t('closeToTray'), desc: t('closeToTrayDesc'), value: closeToTray, setter: setCloseToTray }
                    ].map(setting => (
                      <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                        <div className="flex-1">
                          <p className="font-semibold text-white mb-1">{setting.label}</p>
                          <p className="text-sm text-gray-400">{setting.desc}</p>
                        </div>
                        <button
                          onClick={() => setting.setter(!setting.value)}
                          className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
                            setting.value ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30' : 'bg-gray-600'
                          }`}
                        >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-lg ${
                            setting.value ? 'translate-x-9' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tutorial Section */}
                <div className="mt-8 pt-8 border-t border-gray-700/50">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{t('tutorial')}</h3>
                        <p className="text-sm text-gray-400">{t('tutorialDesc')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem('hasSeenTutorial');
                        window.location.reload();
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl transition-all font-medium shadow-lg shadow-blue-500/20"
                    >
                      {t('showTutorial')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-white">Limit download speed</p>
                    <p className="text-sm text-gray-400">Set maximum download speed</p>
                  </div>
                  <button
                    onClick={() => setDownloadLimit(!downloadLimit)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      downloadLimit ? 'bg-cyan-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      downloadLimit ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {downloadLimit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Max Download Speed (MB/s)</label>
                    <input
                      type="number"
                      value={maxDownloadSpeed}
                      onChange={(e) => setMaxDownloadSpeed(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Download Region</label>
                  <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none">
                    <option>Auto (Recommended)</option>
                    <option>North America</option>
                    <option>Europe</option>
                    <option>Asia</option>
                    <option>South America</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['dark', 'light', 'auto'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`p-4 rounded-lg border-2 transition-all capitalize ${
                          theme === t
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-white">Enable notifications</p>
                    <p className="text-sm text-gray-400">Show desktop notifications</p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      notifications ? 'bg-cyan-600' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      notifications ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-3xl space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-3xl">
                    🎮
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">GameLauncher</h3>
                    <p className="text-gray-400">Version 1.0.0</p>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-4 space-y-2">
                  <p className="text-gray-400">Built with React + Electron + TailwindCSS</p>
                  <p className="text-gray-400">© 2024 GameLauncher. All rights reserved.</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition">Check for Updates</button>
                  <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition">View Changelog</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Save Confirmation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700 animate-scaleIn">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t('saveSettingsConfirm')}</h3>
                <p className="text-gray-400 text-sm">{t('saveSettingsDesc')}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;