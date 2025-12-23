const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  appId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    index: true
  },
  slug: {
    type: String,
    index: true
  },
  description: {
    type: String
  },
  detailedDescription: {
    type: String
  },
  shortDescription: {
    type: String
  },
  aboutTheGame: {
    type: String
  },
  headerImage: {
    type: String
  },
  capsuleImage: {
    type: String
  },
  backgroundImage: {
    type: String
  },
  developers: [{
    type: String
  }],
  publishers: [{
    type: String
  }],
  genres: [{
    type: String
  }],
  categories: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  releaseDate: {
    type: String
  },
  comingSoon: {
    type: Boolean,
    default: false
  },
  price: {
    currency: String,
    initial: Number,
    final: Number,
    discount: Number,
    formatted: String
  },
  isFree: {
    type: Boolean,
    default: false
  },
  platforms: {
    windows: { type: Boolean, default: true },
    mac: { type: Boolean, default: false },
    linux: { type: Boolean, default: false }
  },
  metacritic: {
    score: Number,
    url: String
  },
  recommendations: {
    total: Number
  },
  achievements: {
    total: Number,
    highlighted: [{
      name: String,
      path: String
    }]
  },
  screenshots: [{
    id: Number,
    path_thumbnail: String,
    path_full: String
  }],
  movies: [{
    id: Number,
    name: String,
    thumbnail: String,
    webm: {
      480: String,
      max: String
    },
    mp4: {
      480: String,
      max: String
    },
    highlight: Boolean
  }],
  // System Requirements
  pcRequirements: {
    minimum: String,
    recommended: String
  },
  // External Links
  steamUrl: String,
  steamDbUrl: String,
  
  // Internal Metadata
  hasLua: {
    type: Boolean,
    default: true
  },
  luaFile: String,
  isCrack: {
    type: Boolean,
    default: true
  },
  
  // Stats
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Text index for search
GameSchema.index({ 
  title: 'text', 
  description: 'text', 
  developers: 'text', 
  publishers: 'text', 
  genres: 'text' 
});

module.exports = mongoose.model('Game', GameSchema);
