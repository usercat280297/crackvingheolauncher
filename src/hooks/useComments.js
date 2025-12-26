import { useState, useEffect } from 'react';

export const useComments = (gameId) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentRecommend, setCommentRecommend] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);

  // Fetch comments
  const fetchComments = async (page = 1) => {
    setLoadingComments(true);
    try {
      const response = await fetch(`http://localhost:3000/api/comments/${gameId}?page=${page}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) {
          setComments(data.comments);
        } else {
          setComments(prev => [...prev, ...data.comments]);
        }
        setHasMoreComments(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Post comment
  const postComment = async () => {
    if (!commentText.trim()) return;

    const user = JSON.parse(localStorage.getItem('user') || '{"name":"Guest"}');

    try {
      const response = await fetch(`http://localhost:3000/api/comments/${gameId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText,
          recommended: commentRecommend,
          user
        })
      });

      const data = await response.json();
      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setCommentText('');
        setCommentRecommend(null);
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  // Like comment
  const likeComment = async (commentId) => {
    const userId = JSON.parse(localStorage.getItem('user') || '{}')._id || '000000000000000000000000';

    try {
      const response = await fetch(`http://localhost:3000/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        setComments(prev => prev.map(c => 
          c._id === commentId ? { ...c, likes: data.likes, dislikes: data.dislikes } : c
        ));
      }
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  // Dislike comment
  const dislikeComment = async (commentId) => {
    const userId = JSON.parse(localStorage.getItem('user') || '{}')._id || '000000000000000000000000';

    try {
      const response = await fetch(`http://localhost:3000/api/comments/${commentId}/dislike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        setComments(prev => prev.map(c => 
          c._id === commentId ? { ...c, likes: data.likes, dislikes: data.dislikes } : c
        ));
      }
    } catch (error) {
      console.error('Failed to dislike comment:', error);
    }
  };

  // Load initial comments
  useEffect(() => {
    if (gameId) {
      fetchComments(1);
    }
  }, [gameId]);

  return {
    comments,
    commentText,
    setCommentText,
    commentRecommend,
    setCommentRecommend,
    loadingComments,
    hasMoreComments,
    postComment,
    likeComment,
    dislikeComment,
    loadMore: () => {
      const nextPage = commentPage + 1;
      setCommentPage(nextPage);
      fetchComments(nextPage);
    }
  };
};
