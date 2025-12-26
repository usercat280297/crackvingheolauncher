import { useState, useEffect } from 'react';

export default function TorrentProgressBar({ downloadId, gameName, onComplete }) {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!downloadId) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/torrent/status/${downloadId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            clearInterval(pollInterval);
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          setProgress(data);
          setError(null);

          // Check if completed
          if (data.status === 'completed' || data.status === 'error') {
            clearInterval(pollInterval);
            if (data.status === 'completed') {
              setIsComplete(true);
              onComplete?.(data);
            } else if (data.status === 'error') {
              setError(data.errorMessage || 'Download failed');
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Progress fetch error:', err);
          // Don't set error for network issues, just retry
        }
      }
    }, 1000); // Poll every second

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [downloadId, onComplete]);

  if (!progress) {
    return (
      <div className="torrent-progress">
        <div className="progress-loading">
          <div className="spinner"></div>
          <p>Đang chuẩn bị tải...</p>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round((progress.progress || 0) * 100);
  const downloadedMB = (progress.downloaded / 1024 / 1024).toFixed(1);
  const totalMB = (progress.total / 1024 / 1024).toFixed(1);
  const speedMBs = (progress.speed / 1024 / 1024).toFixed(2);
  const etaMinutes = Math.floor((progress.eta || 0) / 60);
  const etaSeconds = Math.floor((progress.eta || 0) % 60);

  return (
    <div className="torrent-progress">
      <style>{`
        .torrent-progress {
          padding: 20px;
          background: linear-gradient(135deg, rgba(0, 188, 212, 0.1) 0%, rgba(63, 81, 181, 0.1) 100%);
          border: 1px solid rgba(0, 188, 212, 0.3);
          border-radius: 8px;
          margin: 20px 0;
        }

        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .progress-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .progress-title h3 {
          margin: 0;
          color: #fff;
          font-size: 16px;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }

        .status-downloading {
          background: rgba(0, 188, 212, 0.3);
          color: #00bcd4;
        }

        .status-unzipping {
          background: rgba(255, 152, 0, 0.3);
          color: #ff9800;
        }

        .status-completed {
          background: rgba(76, 175, 80, 0.3);
          color: #4caf50;
        }

        .status-error {
          background: rgba(244, 67, 54, 0.3);
          color: #f44336;
        }

        .progress-container {
          margin-bottom: 15px;
        }

        .progress-bar-background {
          width: 100%;
          height: 28px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(0, 188, 212, 0.2);
          position: relative;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #00bcd4, #0097a7);
          width: var(--progress);
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 10px;
          position: relative;
          overflow: hidden;
        }

        .progress-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-text {
          color: #fff;
          font-weight: bold;
          font-size: 12px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          z-index: 1;
          position: relative;
        }

        .progress-percent {
          position: absolute;
          right: 10px;
          color: #fff;
          font-weight: bold;
          font-size: 12px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }

        .stat-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 10px;
          text-align: center;
        }

        .stat-label {
          display: block;
          color: rgba(255, 255, 255, 0.6);
          font-size: 11px;
          margin-bottom: 5px;
        }

        .stat-value {
          display: block;
          color: #00bcd4;
          font-weight: bold;
          font-size: 14px;
        }

        .progress-message {
          padding: 10px;
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .message-icon {
          font-size: 18px;
        }

        .message-info {
          background: rgba(33, 150, 243, 0.2);
          color: #2196f3;
          border: 1px solid rgba(33, 150, 243, 0.3);
        }

        .message-success {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .message-error {
          background: rgba(244, 67, 54, 0.2);
          color: #f44336;
          border: 1px solid rgba(244, 67, 54, 0.3);
        }

        .message-warning {
          background: rgba(255, 152, 0, 0.2);
          color: #ff9800;
          border: 1px solid rgba(255, 152, 0, 0.3);
        }

        .progress-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 30px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(0, 188, 212, 0.2);
          border-top-color: #00bcd4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .progress-loading p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .completed-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .btn-action {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-open {
          background: #4caf50;
          color: white;
        }

        .btn-open:hover {
          background: #45a049;
        }

        .btn-close {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-close:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>

      {/* Header */}
      <div className="progress-header">
        <div className="progress-title">
          <span>📥</span>
          <h3>{gameName}</h3>
        </div>
        <span className={`status-badge status-${progress.status}`}>
          {progress.status === 'downloading' && '⬇️ Đang tải'}
          {progress.status === 'unzipping' && '📦 Đang giải nén'}
          {progress.status === 'completed' && '✅ Hoàn tất'}
          {progress.status === 'error' && '❌ Lỗi'}
          {progress.status === 'paused' && '⏸️ Tạm dừng'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar-background">
          <div
            className="progress-bar-fill"
            style={{ '--progress': `${progressPercent}%` }}
          >
            <span className="progress-text">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">📊 Tiến độ</span>
          <span className="stat-value">{progressPercent}%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">💾 Đã tải / Tổng</span>
          <span className="stat-value">{downloadedMB}MB / {totalMB}MB</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">⚡ Tốc độ</span>
          <span className="stat-value">{speedMBs} MB/s</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">⏱️ Thời gian còn</span>
          <span className="stat-value">
            {progress.eta ? `${etaMinutes}m ${etaSeconds}s` : '...'}
          </span>
        </div>
      </div>

      {/* Status Messages */}
      {progress.status === 'downloading' && (
        <div className="progress-message message-info">
          <span className="message-icon">⬇️</span>
          <span>Đang tải từ {progress.peers || 1} peer, kết nối {progress.connections || 1}</span>
        </div>
      )}

      {progress.status === 'unzipping' && (
        <div className="progress-message message-warning">
          <span className="message-icon">📦</span>
          <span>Đang giải nén file, vui lòng chờ...</span>
        </div>
      )}

      {progress.status === 'completed' && (
        <div>
          <div className="progress-message message-success">
            <span className="message-icon">✅</span>
            <span>Tải và giải nén hoàn tất!</span>
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', margin: '10px 0' }}>
            📁 Vị trí: {progress.installPath || 'C:\\Games\\Torrents'}
          </p>
        </div>
      )}

      {error && (
        <div className="progress-message message-error">
          <span className="message-icon">❌</span>
          <span>{error}</span>
        </div>
      )}

      {isComplete && (
        <div className="completed-actions">
          <button className="btn-action btn-open" onClick={() => {
            // Open folder with explorer
            if (window.electron?.ipcRenderer) {
              window.electron.ipcRenderer.send('open-folder', progress.installPath);
            }
          }}>
            📂 Mở thư mục
          </button>
          <button className="btn-action btn-close" onClick={() => onComplete?.()}>
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
