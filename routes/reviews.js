const express = require('express');
const GameReview = require('../models/GameReview');
const Library = require('../models/Library');

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const router = express.Router();

// Get game reviews
router.get('/:appId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'helpful' } = req.query;
    const appId = parseInt(req.params.appId);

    const skip = (page - 1) * limit;

    const reviews = await GameReview.find({ appId })
      .sort(sortBy === 'helpful' ? { helpful: -1 } : { createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await GameReview.countDocuments({ appId });

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

// Get game stats (average rating, review count)
router.get('/stats/:appId', async (req, res) => {
  try {
    const appId = parseInt(req.params.appId);

    const stats = await GameReview.aggregate([
      { $match: { appId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          totalHelpful: { $sum: '$helpful' }
        }
      }
    ]);

    const ratingDistribution = await GameReview.aggregate([
      { $match: { appId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        averageRating: 0,
        totalReviews: 0,
        totalHelpful: 0
      },
      ratingDistribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats'
    });
  }
});

// Post review
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { appId, rating, title, content } = req.body;

    if (!appId || !rating || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (rating < 1 || rating > 10) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 10'
      });
    }

    // Check if user already reviewed this game
    const existingReview = await GameReview.findOne({
      appId: parseInt(appId),
      userId: req.userId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You already have a review for this game'
      });
    }

    // Check if user has game in library
    const inLibrary = await Library.findOne({
      userId: req.userId,
      appId: parseInt(appId)
    });

    const review = new GameReview({
      appId: parseInt(appId),
      userId: req.userId,
      username: req.body.username || 'Anonymous',
      rating: parseInt(rating),
      title,
      content,
      verified: !!inLibrary
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      review
    });
  } catch (error) {
    console.error('Post review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error posting review'
    });
  }
});

// Update review
router.put('/update/:reviewId', verifyToken, async (req, res) => {
  try {
    const { rating, title, content } = req.body;

    const review = await GameReview.findOne({
      _id: req.params.reviewId,
      userId: req.userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (rating) review.rating = parseInt(rating);
    if (title) review.title = title;
    if (content) review.content = content;

    review.updatedAt = new Date();
    await review.save();

    res.json({
      success: true,
      message: 'Review updated',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
});

// Delete review
router.delete('/delete/:reviewId', verifyToken, async (req, res) => {
  try {
    const result = await GameReview.deleteOne({
      _id: req.params.reviewId,
      userId: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.json({
      success: true,
      message: 'Review deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
});

// Mark review as helpful
router.put('/helpful/:reviewId', async (req, res) => {
  try {
    const review = await GameReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.helpful += 1;
    await review.save();

    res.json({
      success: true,
      helpful: review.helpful
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
});

// Mark review as not helpful
router.put('/not-helpful/:reviewId', async (req, res) => {
  try {
    const review = await GameReview.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.notHelpful += 1;
    await review.save();

    res.json({
      success: true,
      notHelpful: review.notHelpful
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review'
    });
  }
});

module.exports = router;
