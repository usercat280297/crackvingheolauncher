import { useContext, useState } from 'react';
import { DownloadContext } from '../context/DownloadContext';

export default function DownloadModal() {
  const { showDownloadModal, setShowDownloadModal, selectedGameForDownload, addDownload } = useContext(DownloadContext);
  const [selectedDrive, setSelectedDrive] = useState('C:');
  const [drives, setDrives] = useState([
    { letter: 'C:', total: 512, free: 128, used: 384 },
    { letter: 'D:', total: 1024, free: 512, used: 512 },
    { letter: 'E:', total: 2048, free: 1800, used: 248 }
  ]);

  if (!showDownloadModal || !selectedGameForDownload) return null;

  const gameSize = parseInt(selectedGameForDownload.size) || 50;
  const selectedDriveInfo = drives.find(d => d.letter === selectedDrive);
  const isFull = selectedDriveInfo.free < gameSize;
  const recommendedDrive = drives.find(d => d.free >= gameSize)?.letter || 'C:';

  const handleBrowse = async () => {
    try {
      // Use Electron ipcRenderer to open file dialog
      const ipcRenderer = window.require?.('electron')?.ipcRenderer;
      if (ipcRenderer) {
        const result = await ipcRenderer.invoke('dialog:openDirectory');
        if (result && result.filePath) {
          handleDownload(result.filePath);
        }
      } else {
        // Fallback for non-Electron environment
        handleDownload(`${selectedDrive}\\Games\\${selectedGameForDownload.title}`);
      }
    } catch (error) {
      console.error('Error opening file dialog:', error);
      // Fallback: just use the selected drive
      handleDownload(`${selectedDrive}\\Games\\${selectedGameForDownload.title}`);
    }
  };

  const handleDownload = (path) => {
    addDownload(selectedGameForDownload, path);
    setShowDownloadModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 rounded-3xl max-w-2xl w-full border border-cyan-500/20 shadow-2xl shadow-cyan-500/30 animate-in fade-in zoom-in duration-300 overflow-hidden">
        {/* Animated Top Border */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 bg-[length:200%_100%] animate-pulse" />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-cyan-600/20 px-8 py-6 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              Download: <span className="text-cyan-400">{selectedGameForDownload.title}</span>
            </h2>
          </div>
          <button
            onClick={() => setShowDownloadModal(false)}
            className="text-gray-400 hover:text-white transition-colors hover:bg-gray-700/50 p-2 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Game Info */}
          <div className="flex gap-4">
            <img
              src={selectedGameForDownload.cover}
              alt={selectedGameForDownload.title}
              className="w-24 h-32 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">{selectedGameForDownload.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{selectedGameForDownload.developer}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7m0 0V5c0-2.21-3.582-4-8-4S4 2.79 4 5v2m16 0a8.001 8.001 0 00-16 0" />
                  </svg>
                  <span className="text-cyan-400 font-semibold">{selectedGameForDownload.size}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Drive Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Select Installation Drive</h3>
            <div className="grid grid-cols-3 gap-3">
              {drives.map(drive => {
                const usage = (drive.used / drive.total) * 100;
                const canInstall = drive.free >= gameSize;
                return (
                  <button
                    key={drive.letter}
                    onClick={() => setSelectedDrive(drive.letter)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedDrive === drive.letter
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="text-sm font-bold mb-2">{drive.letter}</div>
                    <div className="text-xs text-gray-400 mb-2">
                      {drive.free} GB free / {drive.total} GB total
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          usage > 80 ? 'bg-red-500' : usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${usage}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {isFull && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-red-400 mb-1">Drive is full!</p>
                  <p className="text-sm text-red-300">
                    Need {gameSize}GB but only {selectedDriveInfo.free}GB available. Recommend: <span className="font-bold">{recommendedDrive}</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Path Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white">Installation Path</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={`${selectedDrive}\\Games\\${selectedGameForDownload.title}`}
                readOnly
                className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-400 text-sm"
              />
              <button
                onClick={handleBrowse}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700/50">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDownload(`${selectedDrive}\\Games\\${selectedGameForDownload.title}`)}
              disabled={isFull}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isFull
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
