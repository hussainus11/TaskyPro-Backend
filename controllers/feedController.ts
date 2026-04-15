import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { createNotification } from './notificationController';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Get all feed posts
export const getFeedPosts = async (req: Request, res: Response) => {
  try {
    const { companyId, branchId, userId } = req.query;
    
    const where: any = {};
    if (companyId) where.companyId = parseInt(companyId as string);
    if (branchId) where.branchId = parseInt(branchId as string);
    if (userId) where.userId = parseInt(userId as string);
    
    const posts = await prisma.feedPost.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(posts);
  } catch (error: any) {
    console.error('Failed to fetch feed posts:', error);
    res.status(500).json({ error: 'Failed to fetch feed posts', details: error.message });
  }
};

// Get a single feed post by ID
export const getFeedPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await prisma.feedPost.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: 'Feed post not found' });
    }
  } catch (error: any) {
    console.error('Failed to fetch feed post:', error);
    res.status(500).json({ error: 'Failed to fetch feed post', details: error.message });
  }
};

// Create a new feed post
export const createFeedPost = async (req: Request, res: Response) => {
  try {
    const { content, image, userId, companyId, branchId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user details for notification and activity logging
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { companyId: true, branchId: true, name: true }
    });

    const finalCompanyId = companyId ? parseInt(companyId) : (user?.companyId || null);
    const finalBranchId = branchId ? parseInt(branchId) : (user?.branchId || null);

    const post = await prisma.feedPost.create({
      data: {
        content,
        image: image || null,
        userId: parseInt(userId),
        companyId: finalCompanyId,
        branchId: finalBranchId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Log activity for post creation
    await logActivity({
      type: 'post_created',
      message: `${user?.name || 'User'} created a new post`,
      userId: parseInt(userId),
      companyId: finalCompanyId || undefined,
      branchId: finalBranchId || undefined,
      entityType: 'FEED_POST',
      entityId: post.id,
    });

    // Create notifications for users in the same company and branch (except the creator)
    if (finalCompanyId || finalBranchId) {
      const where: any = {};
      if (finalCompanyId) where.companyId = finalCompanyId;
      if (finalBranchId) where.branchId = finalBranchId;
      where.id = { not: parseInt(userId) }; // Exclude the post creator

      const usersToNotify = await prisma.user.findMany({
        where,
        select: { id: true }
      });

      // Create notifications for each user
      for (const userToNotify of usersToNotify) {
        try {
          await createNotification({
            type: 'POST_CREATED',
            title: 'New Post',
            message: `${user?.name || 'Someone'} created a new post`,
            userId: userToNotify.id,
            actorId: parseInt(userId),
            postId: post.id,
            companyId: finalCompanyId || undefined,
            branchId: finalBranchId || undefined,
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
          // Continue with other notifications even if one fails
        }
      }
    }
    
    res.status(201).json(post);
  } catch (error: any) {
    console.error('Failed to create feed post:', error);
    res.status(500).json({ error: 'Failed to create feed post', details: error.message });
  }
};

// Update a feed post
export const updateFeedPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, image } = req.body;

    const existingPost = await prisma.feedPost.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Feed post not found' });
    }

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (image !== undefined) updateData.image = image;

    // Get user context for activity logging
    const userContext = existingPost.userId ? await getUserContext(existingPost.userId) : null;

    const post = await prisma.feedPost.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        branch: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Log activity for post update
    if (userContext) {
      await logActivity({
        type: 'post_updated',
        message: `${userContext.name || 'User'} updated a post`,
        userId: userContext.id,
        companyId: userContext.companyId || undefined,
        branchId: userContext.branchId || undefined,
        entityType: 'FEED_POST',
        entityId: post.id,
      });
    }
    
    res.json(post);
  } catch (error: any) {
    console.error('Failed to update feed post:', error);
    res.status(500).json({ error: 'Failed to update feed post', details: error.message });
  }
};

// Delete a feed post
export const deleteFeedPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get post details before deleting for activity logging
    const post = await prisma.feedPost.findUnique({
      where: { id: parseInt(id) },
      select: { userId: true, companyId: true, branchId: true }
    });

    if (post && post.userId) {
      const userContext = await getUserContext(post.userId);
      
      // Log activity for post deletion
      if (userContext) {
        await logActivity({
          type: 'post_deleted',
          message: `${userContext.name || 'User'} deleted a post`,
          userId: userContext.id,
          companyId: post.companyId || undefined,
          branchId: post.branchId || undefined,
          entityType: 'FEED_POST',
          entityId: parseInt(id),
        });
      }
    }

    await prisma.feedPost.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to delete feed post:', error);
    res.status(500).json({ error: 'Failed to delete feed post', details: error.message });
  }
};

// Like a feed post
export const likeFeedPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if like already exists
    const existingLike = await prisma.feedLike.findUnique({
      where: {
        postId_userId: {
          postId: parseInt(postId),
          userId: parseInt(userId)
        }
      }
    });

    if (existingLike) {
      // Unlike - delete the like
      await prisma.feedLike.delete({
        where: {
          postId_userId: {
            postId: parseInt(postId),
            userId: parseInt(userId)
          }
        }
      });
      res.json({ liked: false });
    } else {
      // Like - create the like
      await prisma.feedLike.create({
        data: {
          postId: parseInt(postId),
          userId: parseInt(userId)
        }
      });

      // Get post details for notification
      const post = await prisma.feedPost.findUnique({
        where: { id: parseInt(postId) },
        select: { 
          id: true,
          userId: true,
          companyId: true,
          branchId: true
        }
      });

      // Get actor (user who liked) details
      const actor = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { id: true, name: true }
      });

      // Notify the post creator if it's not the same user
      if (post && post.userId !== parseInt(userId) && actor) {
        try {
          await createNotification({
            type: 'POST_LIKED',
            title: 'Post Liked',
            message: `${actor.name} liked your post`,
            userId: post.userId,
            actorId: parseInt(userId),
            postId: parseInt(postId),
            companyId: post.companyId || undefined,
            branchId: post.branchId || undefined,
          });
        } catch (notifError) {
          console.error('Failed to create like notification:', notifError);
        }
      }

      res.json({ liked: true });
    }
  } catch (error: any) {
    console.error('Failed to toggle like:', error);
    res.status(500).json({ error: 'Failed to toggle like', details: error.message });
  }
};

// Add a comment to a feed post
export const addFeedComment = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { text, userId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const comment = await prisma.feedComment.create({
      data: {
        text,
        postId: parseInt(postId),
        userId: parseInt(userId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    // Get post details for notification
    const post = await prisma.feedPost.findUnique({
      where: { id: parseInt(postId) },
      include: {
        user: {
          select: { id: true, name: true, companyId: true, branchId: true }
        },
        comments: {
          select: { userId: true }
        }
      }
    });

    // Get actor (user who commented) details
    const actor = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, name: true }
    });

    if (post && actor) {
      // Notify the post creator if it's not the same user
      if (post.userId !== parseInt(userId)) {
        try {
          await createNotification({
            type: 'POST_COMMENTED',
            title: 'New Comment',
            message: `${actor.name} commented on your post: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
            userId: post.userId,
            actorId: parseInt(userId),
            postId: parseInt(postId),
            companyId: post.companyId || undefined,
            branchId: post.branchId || undefined,
          });
        } catch (notifError) {
          console.error('Failed to create comment notification for post creator:', notifError);
        }
      }

      // Notify other commenters (who commented before) if it's not the same user
      const uniqueCommenterIds = new Set(
        post.comments
          .map(c => c.userId)
          .filter(id => id !== parseInt(userId) && id !== post.userId)
      );

      for (const commenterId of uniqueCommenterIds) {
        try {
          await createNotification({
            type: 'POST_COMMENTED',
            title: 'New Comment',
            message: `${actor.name} also commented on a post you commented on`,
            userId: commenterId,
            actorId: parseInt(userId),
            postId: parseInt(postId),
            companyId: post.companyId || undefined,
            branchId: post.branchId || undefined,
          });
        } catch (notifError) {
          console.error('Failed to create comment notification for commenter:', notifError);
        }
      }
    }
    
    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
};

// Delete a comment
export const deleteFeedComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.feedComment.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    res.status(500).json({ error: 'Failed to delete comment', details: error.message });
  }
};

