const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  gameId: {
    type: Number,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: '/Saitma-Meme-PNG-758x473-removebg-preview.png'
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  recommended: {
    type: Boolean,
    default: null // null = no rating, true = recommend, false = not recommend
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userAvatar: String,
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

commentSchema.index({ gameId: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
