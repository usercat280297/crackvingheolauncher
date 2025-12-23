const mongoose = require('mongoose');

const LibrarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appId: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  installPath: {
    type: String,
    default: ''
  },
  isInstalled: {
    type: Boolean,
    default: false
  },
  installSize: {
    type: Number,
    default: 0
  },
  playTime: {
    type: Number,
    default: 0 // in minutes
  },
  lastPlayed: {
    type: Date,
    default: null
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  notes: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create unique index for userId + appId
LibrarySchema.index({ userId: 1, appId: 1 }, { unique: true });

module.exports = mongoose.model('Library', LibrarySchema);
