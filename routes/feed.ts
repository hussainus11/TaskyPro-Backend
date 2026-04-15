import { Router } from 'express';
import {
  getFeedPosts,
  getFeedPostById,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  likeFeedPost,
  addFeedComment,
  deleteFeedComment
} from '../controllers/feedController';

const router = Router();

// Feed post routes
router.get('/', getFeedPosts);
router.get('/:id', getFeedPostById);
router.post('/', createFeedPost);
router.put('/:id', updateFeedPost);
router.delete('/:id', deleteFeedPost);

// Like routes
router.post('/:postId/like', likeFeedPost);

// Comment routes
router.post('/:postId/comments', addFeedComment);
router.delete('/comments/:id', deleteFeedComment);

export default router;

































































