import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

export default function Downloads() {
  const [downloads, setDownloads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [downloadPath, setDownloadPath] = useState('');

  useEffect(() => {
    loadDownloads();
    loadDownloadPath();
    
    // Listen for download updates
    if (window.electron?.downloads) {
      window.electron.downloads.onUpdate((download) => {
        setDownloads(prev => {
          const index = prev.findIndex(d => d.id === download.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = download;
            return updated;
          } else {
            return [...prev, download];
          }
        });
      });

      window.electron.downloads.onList((downloadsList) => {
        setDownloads(downloadsList);
      });

      window.electron.downloads.onCompleted((download) => {
        // Show completion notification
        if (Notification.permission === 'granted') {
          new Notification(`Download Complete`, {
            body: `${download.title} has finished downloading`,
            icon: download.cover
          });
        }
      });
    }

    return () => {
      if (window.electron?.downloads) {
        window.electron.downloads.removeListeners();
      }
    };
  }, []);

  const loadDownloads = async () => {
    if (window.electron?.downloads) {
      try {
        const allDownloads = await window.electron.downloads.getAll();
        setDownloads(allDownloads || []);
      } catch (error) {
        console.error('Error loading downloads:', error);
      }
    }
  };

  const loadDownloadPath = async () => {
    if (window.electron?.downloads) {
      try {
        const path = await window.electron.downloads.getPath();
        setDownloadPath(path);
      } catch (error) {
        console.error('Error loading download path:', error);
      }
    }
  };

  const changeDownloadPath = async () => {
    if (window.electron?.selectFolder) {
      try {
        const newPath = await window.electron.selectFolder();
        if (newPath) {
          await window.electron.downloads.setPath(newPath);
          setDownloadPath(newPath);
        }
      } catch (error) {
        console.error('Error changing download path:', error);
      }
    }
  };

  const filteredDownloads = downloads.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'downloading') return d.status === 'downloading';
    if (filter === 'completed') return d.status === 'completed';
    if (filter === 'paused') return d.status === 'paused';
    return true;
  });

  const pauseDownload = async (id) => {
    if (window.electron?.downloads) {
      await window.electron.downloads.pause(id);
    }
  };

  const resumeDownload = async (id) => {
    if (window.electron?.downloads) {
      await window.electron.downloads.resume(id);
    }
  };

  const cancelDownload = async (id) => {
    if (confirm('Cancel this download? All progress will be lost.')) {
      if (window.electron?.downloads) {
        await window.electron.downloads.cancel(id);
      }
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8" style={{ paddingTop: '104px' }}>
      <PageHeader title="Downloads">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Path: <span className="text-cyan-400">{downloadPath}</span>
          </div>
          <button
            onClick={changeDownloadPath}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Change Path
          </button>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-cyan-400">{downloads.length}</div>
          <div className="text-sm text-gray-400">Total Downloads</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{downloads.filter(d => d.status === 'downloading').length}</div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">{downloads.filter(d => d.status === 'completed').length}</div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">{downloads.filter(d => d.status === 'paused').length}</div>
          <div className="text-sm text-gray-400">Paused</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'downloading', 'completed', 'paused'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              filter === f
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Downloads List */}
      <div className="space-y-4">
        {filteredDownloads.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-24 h-24 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <p className="text-gray-400 text-lg mb-2">No downloads yet</p>
            <p className="text-gray-500 text-sm">Start downloading games from the Store</p>
          </div>
        ) : (
          filteredDownloads.map(download => (
            <div key={download.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition">
              <div className="flex items-start gap-4">
                {/* Game Cover */}
                <img 
                  src={download.cover || '/placeholder.png'} 
                  alt={download.title}
                  className="w-24 h-32 object-cover rounded-lg"
                />

                {/* Download Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{download.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>{download.size}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          download.method === 'steamtools' ? 'bg-blue-600/20 text-blue-400' : 'bg-green-600/20 text-green-400'
                        }`}>
                          {download.method === 'steamtools' ? 'SteamTools' : 'Direct'}
                        </span>
                        <span className="text-gray-500">→ {download.path}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {download.status === 'downloading' && (
                        <button
                          onClick={() => pauseDownload(download.id)}
                          className="p-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg transition"
                          title="Pause"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      {download.status === 'paused' && (
                        <button
                          onClick={() => resumeDownload(download.id)}
                          className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition"
                          title="Resume"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                      {download.status === 'completed' && (
                        <button
                          onClick={() => window.electron?.shell?.openPath(download.path)}
                          className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition"
                          title="Open Folder"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => cancelDownload(download.id)}
                        className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition"
                        title="Cancel"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">
                        {download.status === 'completed' ? 'Completed' : `${download.progress || 0}%`}
                      </span>
                      <span className="text-gray-400">
                        {formatBytes(download.downloaded || 0)} / {formatBytes(download.total || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          download.status === 'completed' ? 'bg-green-500' : 
                          download.status === 'paused' ? 'bg-yellow-500' :
                          download.status === 'error' ? 'bg-red-500' :
                          'bg-cyan-500'
                        }`}
                        style={{ width: `${download.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Status & Speed */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-3 py-1 rounded-full font-medium ${
                      download.status === 'downloading' ? 'bg-cyan-600/20 text-cyan-400' :
                      download.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                      download.status === 'paused' ? 'bg-yellow-600/20 text-yellow-400' :
                      download.status === 'error' ? 'bg-red-600/20 text-red-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {download.status}
                    </span>
                    {download.speed && download.status === 'downloading' && (
                      <span className="text-gray-400">
                        {download.speed}
                      </span>
                    )}
                    {download.timeRemaining && download.status === 'downloading' && (
                      <span className="text-gray-400">
                        {download.timeRemaining} remaining
                      </span>
                    )}
                    {download.error && (
                      <span className="text-red-400 text-xs">
                        Error: {download.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
