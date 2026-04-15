import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { getSocketIO, setCallParticipants } from '../socket';

// Generate deterministic call ID based on participants
function generateCallId(participantIds: number[], type: 'direct' | 'group', groupId?: number): string {
  // Sort participant IDs for consistency
  const sortedIds = [...participantIds].sort((a, b) => a - b);
  
  if (type === 'direct' && sortedIds.length === 2) {
    // For 1-to-1 calls, use a hash of the two user IDs
    const hash = crypto.createHash('sha256')
      .update(`direct-${sortedIds[0]}-${sortedIds[1]}`)
      .digest('hex')
      .substring(0, 16);
    return `call-${hash}`;
  } else if (type === 'group' && groupId) {
    // For group calls, use group ID
    const hash = crypto.createHash('sha256')
      .update(`group-${groupId}`)
      .digest('hex')
      .substring(0, 16);
    return `call-group-${hash}`;
  } else if (type === 'group' && sortedIds.length > 2) {
    // For group calls without explicit group ID, use participant IDs
    const hash = crypto.createHash('sha256')
      .update(`group-${sortedIds.join('-')}`)
      .digest('hex')
      .substring(0, 16);
    return `call-group-${hash}`;
  }
  
  // Fallback
  const hash = crypto.createHash('sha256')
    .update(`call-${sortedIds.join('-')}-${Date.now()}`)
    .digest('hex')
    .substring(0, 16);
  return `call-${hash}`;
}

// Start a call (1-to-1 or group)
export const startCall = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { participantIds, type, chatId, workGroupId, isVideoCall } = req.body;
    const companyId = req.user?.companyId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'Participant IDs are required' });
    }

    // Ensure current user is included
    const allParticipantIds = [...new Set([userId, ...participantIds])];

    // Determine call type
    const callType = type || (allParticipantIds.length === 2 ? 'direct' : 'group');

    // Generate deterministic call ID
    let callId: string;
    let groupId: number | undefined;

    if (callType === 'direct' && allParticipantIds.length === 2) {
      callId = generateCallId(allParticipantIds, 'direct');
    } else if (workGroupId) {
      // Group call based on work group
      groupId = workGroupId;
      callId = generateCallId(allParticipantIds, 'group', workGroupId);
      
      // Verify user is member of work group
      const workGroupMember = await prisma.workGroupMember.findUnique({
        where: {
          workGroupId_userId: {
            workGroupId: workGroupId,
            userId: userId,
          },
        },
      });

      if (!workGroupMember) {
        return res.status(403).json({ error: 'You are not a member of this work group' });
      }
    } else if (chatId) {
      // Group call based on chat
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
            select: {
              userId: true,
            },
          },
        },
      });

      if (!chat) {
        return res.status(404).json({ error: 'Chat not found or access denied' });
      }

      const chatParticipantIds = chat.participants.map(p => p.userId);
      callId = generateCallId(chatParticipantIds, 'group', chatId);
      groupId = chatId;
    } else {
      // Group call with explicit participants
      callId = generateCallId(allParticipantIds, 'group');
    }

    // Verify all participants are in the same company/branch
    const participants = await prisma.user.findMany({
      where: {
        id: { in: allParticipantIds },
        ...(companyId && { companyId }),
        ...(branchId && { branchId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (participants.length !== allParticipantIds.length) {
      return res.status(403).json({ error: 'Some participants are not in your company/branch' });
    }

    // Notify other participants about the incoming call
    const io = getSocketIO();
    if (io) {
      const caller = participants.find(p => p.id === userId);
      const otherParticipants = participants.filter(p => p.id !== userId);
      
      // Store call participants for cancellation handling
      setCallParticipants(callId, participants.map(p => p.id));
      
      otherParticipants.forEach(participant => {
        // Find all socket connections for this participant
        const userSockets = Array.from(io.sockets.sockets.values()).filter(
          (socket: any) => (socket as any).userId === participant.id
        );

        userSockets.forEach((socket: any) => {
          socket.emit('incoming-call', {
            callId,
            caller: caller ? {
              id: caller.id,
              name: caller.name,
              email: caller.email,
              avatar: caller.image,
            } : null,
            type: callType,
            isVideoCall: isVideoCall || false,
          });
        });
      });
    }

    res.json({
      callId,
      type: callType,
      participants: participants.map(p => ({
        id: p.id,
        userId: p.id,
        name: p.name,
        email: p.email,
        avatar: p.image,
      })),
      groupId,
    });
  } catch (error: any) {
    console.error('Error starting call:', error);
    res.status(500).json({ error: 'Failed to start call', details: error.message });
  }
};

// Join an existing call
export const joinCall = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { callId } = req.params;
    const companyId = req.user?.companyId;
    const branchId = req.user?.branchId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!callId) {
      return res.status(400).json({ error: 'Call ID is required' });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        companyId: true,
        branchId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user has access (company/branch check)
    if (companyId && user.companyId !== companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (branchId && user.branchId !== branchId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      callId,
      user: {
        id: user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        avatar: user.image,
      },
    });
  } catch (error: any) {
    console.error('Error joining call:', error);
    res.status(500).json({ error: 'Failed to join call', details: error.message });
  }
};

// Get call info
export const getCallInfo = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { callId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // This would typically fetch call info from MiroTalk API
    // For now, we return basic info
    res.json({
      callId,
      status: 'active',
    });
  } catch (error: any) {
    console.error('Error getting call info:', error);
    res.status(500).json({ error: 'Failed to get call info', details: error.message });
  }
};


