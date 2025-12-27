import { useState, useEffect } from 'react';
import { openDirectoryDialog } from '../utils/ipcRenderer';

export default function FolderSelector({ onPathSelected, defaultPath = 'C:\\Games\\Torrents' }) {
  const [currentPath, setCurrentPath] = useState(defaultPath);
  const [isLoading, setIsLoading] = useState(false);

  // Handle browse button - open folder selection dialog
  const handleBrowse = async () => {
    try {
      setIsLoading(true);

      // Using Electron's dialog.showOpenDialog via IPC
      const result = await openDirectoryDialog();

      if (result && result.filePaths && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        setCurrentPath(selectedPath);
        onPathSelected(selectedPath);
      }
    } catch (err) {
      console.error('Browse error:', err);
      alert('Failed to open folder browser: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual path input
  const handlePathInput = (e) => {
    const newPath = e.target.value;
    setCurrentPath(newPath);
  };

  // Validate path and confirm
  const handleConfirm = () => {
    if (currentPath && currentPath.trim()) {
      onPathSelected(currentPath);
    } else {
      alert('Please enter a valid path');
    }
  };

  return (
    <div className="folder-selector">
      <style>{`
        .folder-selector {
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .folder-selector h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #fff;
          font-size: 16px;
        }

        .path-input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .path-input {
          flex: 1;
          padding: 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
        }

        .path-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .path-input:focus {
          outline: none;
          border-color: #00bcd4;
          background: rgba(0, 188, 212, 0.1);
        }

        .btn-browse {
          padding: 12px 20px;
          background: rgba(0, 188, 212, 0.3);
          border: 1px solid #00bcd4;
          border-radius: 6px;
          color: #00bcd4;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s;
          min-width: 100px;
        }

        .btn-browse:hover {
          background: #00bcd4;
          color: #000;
        }

        .btn-browse:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .path-display {
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #fff;
          font-size: 13px;
          word-break: break-all;
          margin-bottom: 15px;
        }

        .folder-selector-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-confirm, .btn-cancel {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-confirm {
          background: #4caf50;
          color: white;
        }

        .btn-confirm:hover {
          background: #45a049;
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .info-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin-top: 10px;
        }
      `}</style>

      <h3>📁 Chọn Thư Mục Tải</h3>

      {/* Path Input and Browse */}
      <div className="path-input-group">
        <input
          type="text"
          className="path-input"
          value={currentPath}
          onChange={handlePathInput}
          placeholder="Enter path or select drive..."
        />
        <button
          className="btn-browse"
          onClick={handleBrowse}
          disabled={isLoading}
        >
          {isLoading ? 'Tìm...' : '📂 Duyệt'}
        </button>
      </div>

      {/* Display Current Path */}
      <div className="path-display">
        <strong>Đường dẫn hiện tại:</strong> {currentPath}
      </div>

      {/* Info */}
      <p className="info-text">
        💾 <strong>Yêu cầu:</strong> Ít nhất 22 GB không gian trống
      </p>
    </div>
  );
}
