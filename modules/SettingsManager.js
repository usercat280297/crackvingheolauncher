const fs = require('fs');
const path = require('path');

class SettingsManager {
  constructor() {
    this.settingsPath = path.join(__dirname, '../config/user-settings.json');
    this.defaultSettings = {
      downloadPath: 'C:\\Games',
      uploadLimit: 0,
      downloadLimit: 0,
      language: 'en',
      autoUpdate: true,
      theme: 'dark',
      notifications: true,
      autoLaunch: false,
      minimizeToTray: true,
      maxConcurrentDownloads: 2
    };
    this.settings = this.loadSettings();
  }

  loadSettings() {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        return { ...this.defaultSettings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return { ...this.defaultSettings };
  }

  saveSettings() {
    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    this.settings[key] = value;
    return this.saveSettings();
  }

  getAll() {
    return { ...this.settings };
  }

  setMultiple(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    return this.saveSettings();
  }

  reset() {
    this.settings = { ...this.defaultSettings };
    return this.saveSettings();
  }
}

module.exports = new SettingsManager();
