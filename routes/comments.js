const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// Get comments for a game
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ gameId: parseInt(gameId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Comment.countDocuments({ gameId: parseInt(gameId) });

    res.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + comments.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Post a comment
router.post('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const { content, recommended } = req.body;
    
    // Get user from localStorage (frontend will send)
    const user = req.body.user || { name: 'Guest', avatar: '/Saitma-Meme-PNG-758x473-removebg-preview.png' };

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const comment = new Comment({
      gameId: parseInt(gameId),
      userId: user._id || '000000000000000000000000',
      userName: user.name,
      userAvatar: user.avatar || '/Saitma-Meme-PNG-758x473-removebg-preview.png',
      content: content.trim(),
      recommended: recommended === true ? true : recommended === false ? false : null
    });

    await comment.save();

    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Like a comment
router.post('/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.body.userId || '000000000000000000000000';

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Remove from disliked if exists
    comment.dislikedBy = comment.dislikedBy.filter(id => id.toString() !== userId);
    
    // Toggle like
    const likeIndex = comment.likedBy.findIndex(id => id.toString() === userId);
    if (likeIndex > -1) {
      comment.likedBy.splice(likeIndex, 1);
    } else {
      comment.likedBy.push(userId);
    }

    comment.likes = comment.likedBy.length;
    comment.dislikes = comment.dislikedBy.length;
    await comment.save();

    res.json({ success: true, likes: comment.likes, dislikes: comment.dislikes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dislike a comment
router.post('/:commentId/dislike', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.body.userId || '000000000000000000000000';

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Remove from liked if exists
    comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId);
    
    // Toggle dislike
    const dislikeIndex = comment.dislikedBy.findIndex(id => id.toString() === userId);
    if (dislikeIndex > -1) {
      comment.dislikedBy.splice(dislikeIndex, 1);
    } else {
      comment.dislikedBy.push(userId);
    }

    comment.likes = comment.likedBy.length;
    comment.dislikes = comment.dislikedBy.length;
    await comment.save();

    res.json({ success: true, likes: comment.likes, dislikes: comment.dislikes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reply to a comment
router.post('/:commentId/reply', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const user = req.body.user || { name: 'Guest', avatar: '/Saitma-Meme-PNG-758x473-removebg-preview.png' };

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    comment.replies.push({
      userId: user._id || '000000000000000000000000',
      userName: user.name,
      userAvatar: user.avatar || '/Saitma-Meme-PNG-758x473-removebg-preview.png',
      content: content.trim()
    });

    await comment.save();

    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a comment
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.body.userId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
