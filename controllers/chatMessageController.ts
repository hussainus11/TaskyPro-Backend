import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

// Get messages for a chat
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    const userId = req.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify user is a participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: userId,
      },
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this chat' });
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId: chatId,
        ...(cursor && { id: { lt: cursor } }),
      },
      take: limit,
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
    });

    // Transform messages
    const transformedMessages = messages.reverse().map((msg) => {
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

      // Check if message was edited (updatedAt is different from createdAt)
      const isEdited = msg.updatedAt.getTime() !== msg.createdAt.getTime();

      // Include system message data if present
      if (msg.data && typeof msg.data === 'object') {
        const data = msg.data as any;
        if (data.systemMessage) {
          messageData.systemMessage = data.systemMessage;
          messageData.action = data.action;
          messageData.addedUserId = data.addedUserId;
          messageData.addedUserName = data.addedUserName;
          messageData.addedByUserId = data.addedByUserId;
          messageData.addedByName = data.addedByName;
          messageData.shareHistory = data.shareHistory;
        }
      }

      return {
        id: msg.id,
        content: msg.content || undefined,
        type: msg.type.toLowerCase(),
        own_message: isOwnMessage,
        read: msg.status === 'READ',
        data: Object.keys(messageData).length > 0 ? messageData : undefined,
        createdAt: msg.createdAt ? msg.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: msg.updatedAt ? msg.updatedAt.toISOString() : undefined,
        isEdited: isEdited,
      };
    });

    // Update last read time
    await prisma.chatParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    res.json(transformedMessages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages', message: error.message });
  }
};

// Send a message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    const senderId = req.userId;
    const { content, type, data } = req.body;
    const companyId = req.user?.companyId || undefined;
    const branchId = req.user?.branchId || undefined;

    if (!senderId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!chatId) {
      return res.status(400).json({ error: 'Chat ID is required' });
    }

    // Verify sender is a participant
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: chatId,
        userId: senderId,
      },
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this chat' });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        chatId: chatId,
        senderId: senderId,
        content: content || null,
        type: type?.toUpperCase() || 'TEXT',
        data: data || null,
        status: 'SENT',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update chat's last message and updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessageId: message.id,
        updatedAt: new Date(),
      },
    });

    // Mark as delivered for other participants
    await prisma.chatParticipant.updateMany({
      where: {
        chatId: chatId,
        userId: { not: senderId },
      },
      data: {
        lastReadAt: null, // Reset to show unread
      },
    });

    // Transform message for response
    const messageData: any = {};
    if (message.data) {
      const msgData = message.data as any;
      if (message.type === 'IMAGE') {
        messageData.images = Array.isArray(msgData.images) ? msgData.images : [msgData.path || msgData.cover];
      } else if (message.type === 'VIDEO') {
        messageData.cover = msgData.cover || msgData.path;
        messageData.duration = msgData.duration;
      } else if (message.type === 'FILE') {
        messageData.file_name = msgData.file_name || msgData.path?.split('/').pop();
        messageData.path = msgData.path;
        messageData.size = msgData.size;
      } else if (message.type === 'AUDIO' || message.type === 'SOUND') {
        messageData.path = msgData.path;
        messageData.duration = msgData.duration;
      }
    }

    res.status(201).json({
      id: message.id,
      content: message.content || undefined,
      type: message.type.toLowerCase(),
      own_message: true,
      read: false,
      data: Object.keys(messageData).length > 0 ? messageData : undefined,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      isEdited: false,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', message: error.message });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const chatId = parseInt(req.params.chatId);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update message statuses
    await prisma.chatMessage.updateMany({
      where: {
        chatId: chatId,
        senderId: { not: userId },
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
      },
    });

    // Update participant's last read time
    await prisma.chatParticipant.updateMany({
      where: {
        chatId: chatId,
        userId: userId,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read', message: error.message });
  }
};

// Update a message
export const updateMessage = async (req: AuthRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = req.userId;
    const { content } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Get message and verify ownership
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    // Only text messages can be edited
    if (message.type !== 'TEXT') {
      return res.status(400).json({ error: 'Only text messages can be edited' });
    }

    // Update message
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content: content || null,
        updatedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if message was edited
    const isEdited = updatedMessage.updatedAt.getTime() !== updatedMessage.createdAt.getTime();

    res.json({
      id: updatedMessage.id,
      content: updatedMessage.content || undefined,
      type: updatedMessage.type.toLowerCase(),
      own_message: true,
      read: updatedMessage.status === 'READ',
      createdAt: updatedMessage.createdAt.toISOString(),
      updatedAt: updatedMessage.updatedAt.toISOString(),
      isEdited: isEdited,
    });
  } catch (error: any) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message', message: error.message });
  }
};

// Delete a message
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Get message and verify ownership
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    // Delete message
    await prisma.chatMessage.delete({
      where: { id: messageId },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message', message: error.message });
  }
};

// Star/Unstar a message
export const starMessage = async (req: AuthRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = req.userId;
    const { starred } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    // Get message
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Update message data with starred status
    const currentData = (message.data as any) || {};
    const updatedData = {
      ...currentData,
      starred: starred === true || starred === 'true',
    };

    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        data: updatedData,
      },
    });

    res.json({ success: true, starred: updatedData.starred });
  } catch (error: any) {
    console.error('Error starring message:', error);
    res.status(500).json({ error: 'Failed to star message', message: error.message });
  }
};

// Forward a message
export const forwardMessage = async (req: AuthRequest, res: Response) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = req.userId;
    const { targetChatId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID is required' });
    }

    if (!targetChatId) {
      return res.status(400).json({ error: 'Target chat ID is required' });
    }

    // Get original message
    const originalMessage = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!originalMessage) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify user is participant in target chat
    const targetParticipant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: targetChatId,
        userId: userId,
      },
    });

    if (!targetParticipant) {
      return res.status(403).json({ error: 'You are not a participant in the target chat' });
    }

    // Create forwarded message
    const forwardedData = originalMessage.data ? {
      ...(originalMessage.data as any),
      forwarded: true,
      originalMessageId: originalMessage.id,
      originalSender: originalMessage.sender.name,
    } : {
      forwarded: true,
      originalMessageId: originalMessage.id,
      originalSender: originalMessage.sender.name,
    };

    const forwardedMessage = await prisma.chatMessage.create({
      data: {
        chatId: targetChatId,
        senderId: userId,
        content: originalMessage.content || null,
        type: originalMessage.type,
        data: forwardedData,
        status: 'SENT',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update target chat's last message
    await prisma.chat.update({
      where: { id: targetChatId },
      data: {
        lastMessageId: forwardedMessage.id,
        updatedAt: new Date(),
      },
    });

    // Mark as delivered for other participants
    await prisma.chatParticipant.updateMany({
      where: {
        chatId: targetChatId,
        userId: { not: userId },
      },
      data: {
        lastReadAt: null,
      },
    });

    // Transform message for response
    const messageData: any = {};
    if (forwardedMessage.data) {
      const msgData = forwardedMessage.data as any;
      if (forwardedMessage.type === 'IMAGE') {
        messageData.images = Array.isArray(msgData.images) ? msgData.images : [msgData.path || msgData.cover];
      } else if (forwardedMessage.type === 'VIDEO') {
        messageData.cover = msgData.cover || msgData.path;
        messageData.duration = msgData.duration;
      } else if (forwardedMessage.type === 'FILE') {
        messageData.file_name = msgData.file_name || msgData.path?.split('/').pop();
        messageData.path = msgData.path;
        messageData.size = msgData.size;
      } else if (forwardedMessage.type === 'AUDIO' || forwardedMessage.type === 'SOUND') {
        messageData.path = msgData.path;
        messageData.duration = msgData.duration;
      }
      messageData.forwarded = msgData.forwarded;
      messageData.originalSender = msgData.originalSender;
    }

    // Check if message was edited
    const isEdited = forwardedMessage.updatedAt.getTime() !== forwardedMessage.createdAt.getTime();

    res.status(201).json({
      id: forwardedMessage.id,
      content: forwardedMessage.content || undefined,
      type: forwardedMessage.type.toLowerCase(),
      own_message: true,
      read: false,
      data: Object.keys(messageData).length > 0 ? messageData : undefined,
      createdAt: forwardedMessage.createdAt.toISOString(),
      updatedAt: forwardedMessage.updatedAt.toISOString(),
      isEdited: isEdited,
    });
  } catch (error: any) {
    console.error('Error forwarding message:', error);
    res.status(500).json({ error: 'Failed to forward message', message: error.message });
  }
};

