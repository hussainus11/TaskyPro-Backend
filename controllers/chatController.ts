import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { formatDateTime } from '../utils/dateTime';

// Get all chats for a user (filtered by companyId and branchId)
export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const companyId = req.user?.companyId || undefined;
    const branchId = req.user?.branchId || undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all chats where user is a participant
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: {
            userId: userId,
          },
        },
        ...(companyId && { companyId }),
        ...(branchId && { branchId }),
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                status: true,
              },
            },
          },
        },
        lastMessage: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get chat access permissions for current user
    // User A can chat with User B only if User B has granted access to User A
    // (i.e., there's a ChatAccess record where userId=B, targetUserId=A)
    const whereAccess: any = {};
    if (companyId) {
      whereAccess.companyId = companyId;
    }
    if (branchId) {
      whereAccess.branchId = branchId;
    } else if (companyId) {
      whereAccess.branchId = null;
    }

    // Get users who have granted access to current user (they can chat with us)
    // Also get users we've granted access to (we can chat with them)
    const chatAccessList = await prisma.chatAccess.findMany({
      where: {
        ...whereAccess,
        OR: [
          { targetUserId: userId }, // Users who granted access to current user (we can chat with them)
          { userId: userId } // Users we granted access to (they can chat with us, but we can't necessarily chat with them)
        ]
      }
    });

    // Create set of user IDs that current user can chat with
    // (only users who have granted access to current user)
    const accessibleUserIds = new Set<number>();
    chatAccessList.forEach(access => {
      // If targetUserId is current user, then userId granted access to us, so we can chat with them
      if (access.targetUserId === userId) {
        accessibleUserIds.add(access.userId);
      }
    });

    // Transform to match frontend format
    const transformedChats = chats
      .filter((chat) => {
        // For group chats, always allow (group chats don't need individual access)
        if (chat.type === 'GROUP') {
          return true;
        }
        // For direct chats, check if the other participant has access
        const otherParticipant = chat.participants.find((p) => p.userId !== userId)?.user;
        if (!otherParticipant) {
          return false;
        }
        // Check if current user has access to chat with other participant
        return accessibleUserIds.has(otherParticipant.id);
      })
      .map((chat) => {
      // For direct chats, get the other participant
      // For group chats, user will be null and we'll use chat.name
      const otherParticipant = chat.type === 'DIRECT' 
        ? chat.participants.find((p) => p.userId !== userId)?.user
        : null;
      const currentUserParticipant = chat.participants.find((p) => p.userId === userId);

      // Get last message
      const lastMessage = chat.lastMessage || chat.messages[0];
      const lastMessageContent = lastMessage
        ? lastMessage.type === 'TEXT'
          ? lastMessage.content
          : lastMessage.type === 'IMAGE'
            ? '📷 Image'
            : lastMessage.type === 'VIDEO'
              ? '🎥 Video'
              : lastMessage.type === 'FILE'
                ? '📄 File'
                : lastMessage.type === 'AUDIO' || lastMessage.type === 'SOUND'
                  ? '🔊 Audio'
                  : 'Message'
        : '';

      // Determine message status
      let status: 'sent' | 'read' | 'forwarded' = 'sent';
      if (lastMessage) {
        if (lastMessage.status === 'READ') {
          status = 'read';
        } else if (lastMessage.status === 'DELIVERED') {
          status = 'sent';
        }
      }

      // Calculate relative time
      const now = new Date();
      const updated = new Date(chat.updatedAt);
      const diffMs = now.getTime() - updated.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let date = '';
      if (diffMins < 1) {
        date = 'Just now';
      } else if (diffMins < 60) {
        date = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        date = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      } else if (diffDays === 1) {
        date = 'Yesterday';
      } else if (diffDays < 7) {
        date = `${diffDays} days`;
      } else {
        date = formatDateTime(updated);
      }

      // For group chats, create a placeholder user object with chat name
      const userForGroup = chat.type === 'GROUP' && chat.name
        ? {
            id: 0, // Placeholder ID for group
            name: chat.name,
            avatar: null,
            email: '',
            online_status: 'success' as const,
            last_seen: '',
          }
        : otherParticipant
          ? {
              id: otherParticipant.id,
              name: otherParticipant.name,
              avatar: otherParticipant.image || null,
              email: otherParticipant.email,
              online_status: otherParticipant.status === 'active' ? 'success' as const : 'danger' as const,
              last_seen: '2 minute ago',
            }
          : null;

      return {
        id: chat.id,
        user_id: otherParticipant?.id || userId,
        user: userForGroup,
        last_message: lastMessageContent,
        date: date,
        status: status,
        is_archive: chat.isArchived,
        messages: [], // Will be loaded separately
        type: chat.type, // Include chat type (DIRECT or GROUP)
        name: chat.name, // Include chat name for group chats
      };
    });

    res.json(transformedChats);
  } catch (error: any) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats', message: error.message });
  }
};

// Get a single chat by ID
export const getChatById = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                status: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Transform messages
    const transformedMessages = chat.messages.map((msg) => {
      const isOwnMessage = msg.senderId === userId;
      const messageData: any = {};

      if (msg.data) {
        const data = msg.data as any;
        if (msg.type === 'IMAGE') {
          messageData.images = Array.isArray(data.images) ? data.images : [data.path || data.cover];
        } else if (msg.type === 'VIDEO') {
          messageData.cover = data.cover || data.path;
          messageData.duration = data.duration;
        } else if (msg.type === 'FILE') {
          messageData.file_name = data.file_name || data.path?.split('/').pop();
          messageData.path = data.path;
          messageData.size = data.size;
        } else if (msg.type === 'AUDIO' || msg.type === 'SOUND') {
          messageData.path = data.path;
          messageData.duration = data.duration;
        }
      }

      return {
        id: msg.id,
        content: msg.content || undefined,
        type: msg.type.toLowerCase(),
        own_message: isOwnMessage,
        read: msg.status === 'READ',
        data: Object.keys(messageData).length > 0 ? messageData : undefined,
      };
    });

    // Get other participant for direct chats
    const otherParticipant = chat.participants.find((p) => p.userId !== userId)?.user;

    res.json({
      id: chat.id,
      user_id: otherParticipant?.id || userId,
      user: otherParticipant
        ? {
            id: otherParticipant.id,
            name: otherParticipant.name,
            avatar: otherParticipant.image || null,
            email: otherParticipant.email,
            online_status: otherParticipant.status === 'active' ? 'success' : 'danger',
            last_seen: '2 minute ago',
          }
        : null,
      messages: transformedMessages,
    });
  } catch (error: any) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Failed to fetch chat', message: error.message });
  }
};

// Create a new chat (direct or group)
export const createChat = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { participantIds, type, name } = req.body;
    const companyId = req.user?.companyId || undefined;
    const branchId = req.user?.branchId || undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'Participant IDs are required' });
    }

    // For direct chats, check chat access permissions
    if (type === 'DIRECT' && participantIds.length === 1) {
      const targetUserId = participantIds[0];
      
      // Check if target user has granted access to current user
      // User A can chat with User B only if User B has granted access to User A
      // (i.e., there's a ChatAccess record where userId=B, targetUserId=A)
      const whereAccess: any = {
        userId: targetUserId, // Target user granted access
        targetUserId: userId   // To current user
      };
      if (companyId) {
        whereAccess.companyId = companyId;
      }
      if (branchId) {
        whereAccess.branchId = branchId;
      } else if (companyId) {
        whereAccess.branchId = null;
      }

      const hasAccess = await prisma.chatAccess.findFirst({
        where: whereAccess
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'You do not have permission to chat with this user. They need to grant you chat access first.' 
        });
      }

      // Check if chat already exists
      const existingChat = await prisma.chat.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [userId, participantIds[0]],
              },
            },
          },
          AND: [
            {
              participants: {
                some: {
                  userId: userId,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: participantIds[0],
                },
              },
            },
          ],
        },
      });

      if (existingChat) {
        return res.json(existingChat);
      }
    }

    // Create chat with participants
    const allParticipantIds = [userId, ...participantIds];
    const chat = await prisma.chat.create({
      data: {
        type: type || 'DIRECT',
        name: type === 'GROUP' ? name : null,
        companyId: companyId,
        branchId: branchId,
        participants: {
          create: allParticipantIds.map((id) => ({
            userId: id,
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                status: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(chat);
  } catch (error: any) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat', message: error.message });
  }
};

// Archive/unarchive a chat
export const updateChat = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.id);
    const { isArchived } = req.body;

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        isArchived: isArchived !== undefined ? isArchived : undefined,
      },
    });

    res.json(chat);
  } catch (error: any) {
    console.error('Error updating chat:', error);
    res.status(500).json({ error: 'Failed to update chat', message: error.message });
  }
};

// Add users to a group chat
export const addUsersToGroup = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = req.userId;
    const { userIds, shareHistory } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs are required' });
    }

    // Verify chat exists and is a group chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: true,
      },
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (chat.type !== 'GROUP') {
      return res.status(400).json({ error: 'Can only add users to group chats' });
    }

    // Verify user is a participant
    const isParticipant = chat.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant in this chat' });
    }

    // Get current user info for system message
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    // Filter out users who are already participants
    const existingUserIds = chat.participants.map((p) => p.userId);
    const newUserIds = userIds.filter((id: number) => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return res.status(400).json({ error: 'All selected users are already in the group' });
    }

    // Get user details for the new users
    const newUsers = await prisma.user.findMany({
      where: { id: { in: newUserIds } },
      select: { id: true, name: true },
    });

    // Add new participants
    await prisma.chatParticipant.createMany({
      data: newUserIds.map((id: number) => ({
        chatId: chatId,
        userId: id,
      })),
      skipDuplicates: true,
    });

    // Create system message(s) for each new user
    const systemMessages = await Promise.all(
      newUsers.map(async (newUser) => {
        const messageContent = shareHistory
          ? `${newUser.name} has been added by ${currentUser?.name || 'Admin'} and shared history`
          : `${newUser.name} has been added by ${currentUser?.name || 'Admin'}`;

        return await prisma.chatMessage.create({
          data: {
            chatId: chatId,
            senderId: userId, // System message sent by the user who added
            content: messageContent,
            type: 'TEXT',
            status: 'SENT',
            data: {
              systemMessage: true,
              action: 'user_added',
              addedUserId: newUser.id,
              addedUserName: newUser.name,
              addedByUserId: userId,
              addedByName: currentUser?.name || 'Admin',
              shareHistory: shareHistory || false,
            },
          },
        });
      })
    );

    // Update chat's updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        lastMessageId: systemMessages[systemMessages.length - 1]?.id || undefined,
      },
    });

    // Get updated chat with all participants
    const updatedChat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Emit Socket.io event to notify all participants
    const { getSocketIO } = require('../socket');
    const io = getSocketIO();
    
    if (io) {
      // Notify all participants in the group
      const allParticipantIds = updatedChat?.participants.map((p) => p.userId) || [];
      allParticipantIds.forEach((participantId) => {
        io.to(`user-${participantId}`).emit('group-user-added', {
          chatId: chatId,
          addedUsers: newUsers.map((u) => ({
            id: u.id,
            name: u.name,
          })),
          addedBy: {
            id: userId,
            name: currentUser?.name || 'Admin',
          },
          shareHistory: shareHistory || false,
          systemMessages: systemMessages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt.toISOString(),
          })),
        });
      });
    }

    res.json({
      success: true,
      chat: updatedChat,
      addedUsers: newUsers,
      systemMessages: systemMessages,
    });
  } catch (error: any) {
    console.error('Error adding users to group:', error);
    res.status(500).json({ error: 'Failed to add users to group', message: error.message });
  }
};

