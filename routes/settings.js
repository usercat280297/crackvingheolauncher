const express = require('express');
const router = express.Router();
const SettingsManager = require('../modules/SettingsManager');
const path = require('path');
const fs = require('fs');
const { dialog } = require('electron');

/**
 * GET /api/settings
 * Get all user settings
 */
router.get('/', (req, res) => {
  try {
    const settings = SettingsManager.getAll();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/settings/:key
 * Get specific setting
 */
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const value = SettingsManager.get(key);

    if (value === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: { [key]: value }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/settings/:key
 * Update specific setting
 */
router.put('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Value is required'
      });
    }

    // Validation for specific settings
    if (key === 'downloadPath') {
      if (!fs.existsSync(value)) {
        fs.mkdirSync(value, { recursive: true });
      }
    }

    if (key === 'downloadLimit' || key === 'uploadLimit') {
      if (typeof value !== 'number' || value < 0) {
        return res.status(400).json({
          success: false,
          error: 'Value must be a non-negative number'
        });
      }
    }

    const success = SettingsManager.set(key, value);

    if (!success) {
      throw new Error('Failed to save setting');
    }

    res.json({
      success: true,
      data: { [key]: value },
      message: 'Setting updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/settings
 * Update multiple settings
 */
router.put('/', (req, res) => {
  try {
    const newSettings = req.body;

    // Validate downloadPath if provided
    if (newSettings.downloadPath && !fs.existsSync(newSettings.downloadPath)) {
      fs.mkdirSync(newSettings.downloadPath, { recursive: true });
    }

    const success = SettingsManager.setMultiple(newSettings);

    if (!success) {
      throw new Error('Failed to save settings');
    }

    res.json({
      success: true,
      data: SettingsManager.getAll(),
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/settings/reset
 * Reset to default settings
 */
router.post('/reset', (req, res) => {
  try {
    const success = SettingsManager.reset();

    if (!success) {
      throw new Error('Failed to reset settings');
    }

    res.json({
      success: true,
      data: SettingsManager.getAll(),
      message: 'Settings reset to defaults'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
