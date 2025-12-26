const mongoose = require('mongoose');

const DownloadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gameTitle: {
    type: String,
    required: true,
    index: true
  },
  appId: {
    type: Number
  },
  title: {
    type: String
  },
  fileUrl: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['initializing', 'downloading', 'paused', 'completed', 'failed', 'cancelled'],
    default: 'downloading',
    index: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  fileSize: {
    type: Number,
    default: 0 // Total size in bytes
  },
  totalSize: {
    type: Number,
    default: 0
  },
  downloadedSize: {
    type: Number,
    default: 0
  },
  speed: {
    type: Number,
    default: 0 // in bytes/sec
  },
  eta: {
    type: String,
    default: null
  },
  estimatedTime: {
    type: Number,
    default: 0 // in seconds
  },
  downloadPath: {
    type: String
  },
  // Multi-threading
  totalChunks: {
    type: Number,
    default: 0
  },
  completedChunks: {
    type: Number,
    default: 0
  },
  chunkSize: {
    type: Number,
    default: 50 * 1024 * 1024
  },
  // Compression
  compress: {
    type: Boolean,
    default: false
  },
  compressed: {
    type: Boolean,
    default: false
  },
  compressedPath: {
    type: String
  },
  // Verification
  expectedHash: {
    type: String
  },
  actualHash: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  // Timing
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  pausedAt: {
    type: Date
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  pausedTime: {
    type: Date,
    default: null
  },
  completedTime: {
    type: Date,
    default: null
  },
  errorMessage: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
DownloadSchema.index({ userId: 1, appId: 1 });
DownloadSchema.index({ status: 1 });
DownloadSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Download', DownloadSchema);
