import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Tutorial from './components/Tutorial'
import WelcomeScreen from './components/WelcomeScreen'
import { ToastDisplay } from './components/ToastDisplay'
import { useLanguage } from './i18n/LanguageContext'
import { DownloadProvider } from './context/DownloadContext'
import DownloadModal from './components/DownloadModal'
import DonatePopup from './components/DonatePopup'
import GameAutoUpdateManager from './services/GameAutoUpdateManager'
import luaHandler from './services/LuaGameHandler'
import installationManager from './services/GameInstallationManager'
import DownloadManager from './components/DownloadManager'

// Safe electron access
const electron = typeof window !== 'undefined' && window.electron ? window.electron : null;

export default function App() {
  const location = useLocation()
  const { t } = useLanguage()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showToggleBtn, setShowToggleBtn] = useState(true)
  const [toggleTimeout, setToggleTimeout] = useState(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)

  // Initialize all auto-update managers on app mount
  useEffect(() => {
    const handleSidebarToggle = () => {
      const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
      setSidebarCollapsed(collapsed);
    };
    
    window.addEventListener('sidebarToggle', handleSidebarToggle);
    handleSidebarToggle();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Initialize auto-update system
    console.log('🚀 Initializing auto-update systems...');
    
    // GameAutoUpdateManager starts auto-syncing (singleton)
    window.gameAutoUpdateManager = GameAutoUpdateManager;
    
    // LuaHandler initializes Lua scripts
    window.luaHandler = luaHandler;
    
    // Installation manager resumes incomplete downloads
    window.installationManager = installationManager;
    
    // Load settings from API and apply them
    const loadSettings = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/settings');
        if (response.ok) {
          const data = await response.json();
          const settings = data.data;
          
          // Apply settings
          if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          
          // Store settings in window for other components to access
          window.appSettings = settings;
          console.log('✅ Settings loaded:', settings);
        }
      } catch (error) {
        console.warn('Could not load settings from API:', error);
      }
    };
    
    loadSettings();
    
    // Listen to update events
    window.addEventListener('metadataUpdated', (e) => {
      console.log('🔄 Game metadata updated:', e.detail);
    });
    
    window.addEventListener('updatesAvailable', (e) => {
      console.log('📦 Updates available:', e.detail);
    });

    if (electron) {
      electron.on('fullscreen-change', (fullscreen) => setIsFullscreen(fullscreen))
      return () => {
        electron.removeAllListeners('fullscreen-change')
        window.removeEventListener('metadataUpdated', null)
        window.removeEventListener('updatesAvailable', null)
        window.removeEventListener('sidebarToggle', handleSidebarToggle)
      }
    } else {
      return () => {
        window.removeEventListener('metadataUpdated', null)
        window.removeEventListener('updatesAvailable', null)
        window.removeEventListener('sidebarToggle', handleSidebarToggle)
      }
    }
  }, [])

  useEffect(() => {
    if (sidebarCollapsed) {
      setShowToggleBtn(true)
      if (toggleTimeout) clearTimeout(toggleTimeout)
    } else {
      setShowToggleBtn(true)
      if (toggleTimeout) clearTimeout(toggleTimeout)
    }
  }, [sidebarCollapsed, location.pathname])

  const handleToggleHover = () => {
    if (toggleTimeout) clearTimeout(toggleTimeout)
    setShowToggleBtn(true)
  }

  const handleToggleLeave = () => {
    // Remove auto-hide functionality
  }

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 300)
  }

  const scrollToTop = () => {
    document.querySelector('main').scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Welcome Screen for first-time users */}
      <WelcomeScreen />
      
      {/* Global Toast Display */}
      <ToastDisplay />
      
      {/* Tutorial for first-time users */}
      <Tutorial />
      
      {/* Floating Download Manager */}
      <DownloadManager />
      {/* Custom Title Bar - Minimalist Black */}
      {!isFullscreen && (
        <div className="h-8 bg-black flex items-center justify-end px-4 select-none relative z-[9999]" style={{ WebkitAppRegion: 'drag' }}>
          <div className="flex" style={{ WebkitAppRegion: 'no-drag' }}>
            <button onClick={() => electron?.minimize()} className="w-12 h-8 hover:bg-gray-800 transition flex items-center justify-center" title="Minimize">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16"><path d="M4 8h8v1H4z"/></svg>
            </button>
            <button onClick={() => electron?.maximize()} className="w-12 h-8 hover:bg-gray-800 transition flex items-center justify-center" title="Fullscreen">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
            <button onClick={() => setShowExitDialog(true)} className="w-12 h-8 hover:bg-red-600 transition flex items-center justify-center" title="Exit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
      {/* Hide main sidebar on pages with their own layout */}
      {!location.pathname.includes('/lockscreen') && location.pathname !== '/' && !location.pathname.includes('/tags') && !location.pathname.includes('/epic-sale') && !location.pathname.includes('/steam-sale') && !location.pathname.includes('/game/') && !location.pathname.includes('/settings') && (
        <aside className={`bg-black border-r border-gray-900 flex flex-col transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'w-0' : 'w-52'}`} style={{ overflow: 'hidden' }}>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-w-[208px] pt-24">
          <Link to="/" onClick={() => localStorage.removeItem('launcherUnlocked')} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Màn hình chờ
          </Link>
          
          <Link to="/home" data-tutorial="home" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/home' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            {t('home')}
          </Link>
          
          <Link to="/bypass" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/bypass' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
            Bypass
          </Link>
          
          <Link to="/onlinefix" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/onlinefix' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            Online-Fix
          </Link>
          
          <Link to="/library" data-tutorial="library" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/library' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            {t('library')}
          </Link>
          
          <Link to="/downloads" data-tutorial="downloads" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/downloads' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {t('downloads')}
          </Link>

          <Link to="/wishlist" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/wishlist' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            ♥ Wishlist
          </Link>
          
          <div className="pt-4 pb-2 px-4">
            <p className="text-xs text-gray-500 font-semibold uppercase">{t('tools')}</p>
          </div>
          
          <Link to="/wine" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/wine' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            {t('wineManager')}
          </Link>
          
          <Link to="/platforms" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 ${location.pathname === '/platforms' ? 'bg-gradient-to-r from-cyan-600/30 to-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/10' : 'text-gray-400 hover:bg-gray-800/40 hover:text-white'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /></svg>
            {t('platforms')}
          </Link>
          
          <Link to="/tags?tag=Việt Hóa" className="flex items-center gap-3 px-4 py-3 rounded-lg transition duration-300 transform hover:translate-x-1 text-gray-400 hover:bg-gray-800/40 hover:text-white">
            <span className="text-lg">🇻🇳</span>
            Việt Hóa
          </Link>
        </nav>
        
        <div className="p-3 border-t border-gray-900 min-w-[208px] space-y-2 bg-black">
          <Link 
            to="/settings" 
            onClick={() => localStorage.setItem('previousTab', location.pathname)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800/40 hover:text-cyan-400 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t('settings')}
          </Link>
        </div>
      </aside>
      )}
      
      {/* Hide toggle button on pages with their own sidebar */}
      {!location.pathname.includes('/lockscreen') && location.pathname !== '/' && !location.pathname.includes('/tags') && !location.pathname.includes('/game/') && !location.pathname.includes('/settings') && (
        <div 
          className={`fixed left-0 top-16 w-8 h-32 z-[100] cursor-pointer transition-all duration-300 ${sidebarCollapsed ? 'hover:bg-cyan-600/20' : ''}`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ left: sidebarCollapsed ? '0' : '208px' }}
        >
          <div className={`absolute inset-y-0 ${sidebarCollapsed ? 'left-0' : 'right-0'} w-1 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        </div>
      )}
      
      <div className="flex-1 flex gap-4 overflow-hidden p-4">
        <main className="flex-1 overflow-y-auto transition-opacity duration-500" onScroll={handleScroll}>
          <Outlet />
        </main>
      </div>

      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white p-4 rounded-full shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/80 transition-all duration-300 z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
        </button>
      )}
      
      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-700 animate-scaleIn">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center overflow-hidden">
                <img src="/Saitma-Meme-PNG-758x473-removebg-preview.png" alt="Saitama" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Exit crackvìnghèo?</h3>
                <p className="text-gray-400 text-sm">Are you sure you want to quit?</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => electron?.close()}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <DownloadModal />
      <DonatePopup />
      </div>
      </div>
    )
  }
