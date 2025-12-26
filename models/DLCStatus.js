const mongoose = require('mongoose');

const dlcStatusSchema = new mongoose.Schema({
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
  dlcs: [{
    dlcId: Number,
    installed: Boolean,
    installDate: Date,
    installPath: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index
dlcStatusSchema.index({ userId: 1, appId: 1 }, { unique: true });

module.exports = mongoose.model('DLCStatus', dlcStatusSchema);
