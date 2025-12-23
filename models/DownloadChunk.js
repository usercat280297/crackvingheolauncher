const mongoose = require('mongoose');

const DownloadChunkSchema = new mongoose.Schema({
  downloadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Download',
    required: true,
    index: true
  },
  index: {
    type: Number,
    required: true
  },
  start: {
    type: Number,
    required: true
  },
  end: {
    type: Number,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  downloaded: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'downloading', 'completed', 'failed'],
    default: 'pending'
  },
  retries: {
    type: Number,
    default: 0
  },
  url: {
    type: String
  },
  tempPath: {
    type: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for faster lookups
DownloadChunkSchema.index({ downloadId: 1, index: 1 }, { unique: true });

module.exports = mongoose.model('DownloadChunk', DownloadChunkSchema);
