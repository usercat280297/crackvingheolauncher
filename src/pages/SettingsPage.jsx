import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    downloadPath: 'C:\\Games',
    downloadLimit: 0,
    uploadLimit: 0,
    language: 'en',
    autoUpdate: true,
    theme: 'dark',
    notifications: true,
    autoLaunch: false,
    minimizeToTray: true,
    maxConcurrentDownloads: 2
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        console.log('Settings saved successfully!');
        setTimeout(() => navigate('/library'), 1500);
      } else {
        console.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        setSaving(true);
        const response = await fetch('http://localhost:3000/api/settings/reset', {
          method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
          setSettings(data.data);
          console.log('Settings reset to defaults');
        }
      } catch (error) {
        console.error('Reset error:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500 mx-auto mb-4"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
      <div className="max-width-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/library')}
            className="text-cyan-400 hover:text-cyan-300 transition flex items-center gap-2 mb-6"
          >
            ← Back to Library
          </button>
          <h1 className="text-4xl font-bold">⚙️ Settings</h1>
          <p className="text-gray-400 mt-2">Customize your launcher experience</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Download Settings */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">📥 Download Settings</h2>

            <div className="space-y-6">
              {/* Download Path */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game Installation Folder
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={settings.downloadPath}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
                  />
                  <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition">
                    Browse
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">All games will be downloaded to this location</p>
              </div>

              {/* Download Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Download Speed Limit (MB/s)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.downloadLimit}
                  onChange={(e) => handleChange('downloadLimit', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="0 = Unlimited"
                />
                <p className="text-xs text-gray-500 mt-2">0 means no speed limit</p>
              </div>

              {/* Upload Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Speed Limit (MB/s)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.uploadLimit}
                  onChange={(e) => handleChange('uploadLimit', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="0 = Unlimited"
                />
                <p className="text-xs text-gray-500 mt-2">Help others by seeding games</p>
              </div>

              {/* Max Concurrent Downloads */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum Concurrent Downloads
                </label>
                <select
                  value={settings.maxConcurrentDownloads}
                  onChange={(e) => handleChange('maxConcurrentDownloads', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value={1}>1 Download</option>
                  <option value={2}>2 Downloads</option>
                  <option value={3}>3 Downloads</option>
                  <option value={5}>5 Downloads</option>
                </select>
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">⚡ General Settings</h2>

            <div className="space-y-4">
              {/* Auto Update */}
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/30 p-3 rounded-lg transition">
                <input
                  type="checkbox"
                  checked={settings.autoUpdate}
                  onChange={(e) => handleChange('autoUpdate', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-gray-300">Auto-update launcher</span>
              </label>

              {/* Notifications */}
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/30 p-3 rounded-lg transition">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-gray-300">Enable notifications</span>
              </label>

              {/* Auto Launch */}
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/30 p-3 rounded-lg transition">
                <input
                  type="checkbox"
                  checked={settings.autoLaunch}
                  onChange={(e) => handleChange('autoLaunch', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-gray-300">Launch at system startup</span>
              </label>

              {/* Minimize to Tray */}
              <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-700/30 p-3 rounded-lg transition">
                <input
                  type="checkbox"
                  checked={settings.minimizeToTray}
                  onChange={(e) => handleChange('minimizeToTray', e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-gray-300">Minimize to system tray</span>
              </label>
            </div>
          </div>

          {/* UI Settings */}
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 border border-gray-700/50">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">🎨 UI Settings</h2>

            <div className="space-y-6">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Theme
                </label>
                <div className="flex gap-3">
                  {['dark', 'light'].map(theme => (
                    <button
                      key={theme}
                      onClick={() => handleChange('theme', theme)}
                      className={`px-6 py-3 rounded-lg font-medium transition ${
                        settings.theme === theme
                          ? 'bg-cyan-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="vi">Vietnamese (Tiếng Việt)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between">
            <button
              onClick={resetSettings}
              disabled={saving}
              className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg font-medium transition disabled:opacity-50"
            >
              🔄 Reset to Defaults
            </button>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/library')}
                disabled={saving}
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
