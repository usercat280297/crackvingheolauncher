import { useContext } from 'react';
import { DownloadContext } from '../context/DownloadContext';

export default function DonatePopup() {
  const { showDonatePopup, closeDonatePopup, completedGame } = useContext(DownloadContext);

  if (!showDonatePopup || !completedGame) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-amber-900/30 via-gray-900 to-gray-950 rounded-3xl max-w-lg w-full border border-amber-600/40 shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
        {/* Animated Top Border */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] animate-pulse" />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600/40 via-orange-600/30 to-amber-600/40 px-6 py-8 text-center border-b border-amber-600/30">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-amber-300 mb-2">Download Complete!</h2>
          <p className="text-gray-300">{completedGame.title}</p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Success Message with Animation */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-4xl animate-bounce shadow-lg shadow-green-500/50">
              ✓
            </div>
            <p className="text-gray-200 text-lg font-semibold">Game ready to play!</p>
            <p className="text-gray-400 text-sm mt-2">{completedGame.size} installed successfully</p>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

          {/* Support Message */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-800/20 rounded-xl p-4 text-center border border-gray-700/30">
            <p className="text-gray-300 text-sm font-semibold mb-1">❤️ Support the Developer</p>
            <p className="text-gray-400 text-xs">Ủng hộ tui bát mì với mọi người!</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Donate Button */}
            <button
              onClick={() => {
                window.open('https://vietqr.io/', '_blank');
              }}
              className="w-full p-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Donate via VietQR
            </button>

            {/* Discord Button */}
            <button
              onClick={() => {
                window.open('https://discord.gg/92cP5GZK', '_blank');
              }}
              className="w-full p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.211.375-.445.864-.608 1.25a18.27 18.27 0 00-5.487 0c-.163-.386-.397-.875-.609-1.25a.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.294.075.075 0 01.078-.01c3.927 1.793 8.18 1.793 12.062 0a.075.075 0 01.079.009c.12.098.246.198.373.295a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.076.076 0 00-.041.107c.359.698.77 1.364 1.225 1.994a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.057c.5-4.761-.838-8.895-3.549-12.55a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156 0-1.193.956-2.157 2.157-2.157 1.201 0 2.169.964 2.157 2.157 0 1.19-.956 2.157-2.157 2.157zm7.975 0c-1.183 0-2.157-.965-2.157-2.156 0-1.193.955-2.157 2.157-2.157 1.201 0 2.169.964 2.157 2.157 0 1.19-.956 2.157-2.157 2.157z" />
              </svg>
              Join Discord Community
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={closeDonatePopup}
            className="w-full py-3 text-gray-400 hover:text-gray-200 transition-colors font-medium text-sm border border-gray-700 rounded-lg hover:bg-gray-800/50"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
