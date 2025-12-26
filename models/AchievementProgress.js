const mongoose = require('mongoose');

const achievementProgressSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  appId: {
    type: Number,
    required: true,
    index: true
  },
  achievements: [{
    name: String,
    achieved: Boolean,
    unlockTime: Date
  }],
  stats: {
    total: Number,
    unlocked: Number,
    progress: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for faster queries
achievementProgressSchema.index({ userId: 1, appId: 1 }, { unique: true });

module.exports = mongoose.model('AchievementProgress', achievementProgressSchema);
