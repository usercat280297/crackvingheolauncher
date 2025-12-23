import { useContext } from 'react';
import { DownloadContext } from '../context/DownloadContext';

export default function DownloadsTab() {
  const { downloads, pauseDownload, resumeDownload, cancelDownload } = useContext(DownloadContext);

  if (downloads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
        </svg>
        <p className="text-gray-400 text-lg">No downloads yet</p>
        <p className="text-gray-500 text-sm mt-2">Games you download will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {downloads.map(download => (
        <div
          key={download.id}
          className="bg-gradient-to-r from-gray-800/40 to-gray-800/20 rounded-2xl p-5 border border-gray-700/50 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group"
        >
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0 group/image">
              <img
                src={download.cover}
                alt={download.title}
                className="w-20 h-24 object-cover rounded-xl shadow-lg shadow-gray-900/50"
              />
              {download.status === 'completed' && (
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/30 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate">{download.title}</h3>
              <p className="text-sm text-gray-400 mb-2">{download.downloadPath}</p>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-300 shadow-lg ${
                        download.status === 'completed'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/50'
                      }`}
                      style={{ width: `${download.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-white w-10 text-right">{download.progress}%</span>
                </div>

                {/* Stats */}
                {download.status !== 'completed' && (
                  <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      <span>{download.speed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                      </svg>
                      <span>{download.eta}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    download.status === 'completed'
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : download.status === 'paused'
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  {download.status === 'completed'
                    ? 'Completed'
                    : download.status === 'paused'
                    ? 'Paused'
                    : 'Downloading'}
                </span>
                {download.status === 'downloading' && (
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {download.status === 'downloading' && (
              <button
                onClick={() => pauseDownload(download.id)}
                className="p-2 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500/50 rounded-lg transition-all duration-200 text-yellow-400"
                title="Pause"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
            )}
            {download.status === 'paused' && (
              <button
                onClick={() => resumeDownload(download.id)}
                className="p-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 rounded-lg transition-all duration-200 text-cyan-400"
                title="Resume"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => cancelDownload(download.id)}
              className="p-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-lg transition-all duration-200 text-red-400"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
