import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { authenticateSocket } from './middleware/socketAuth';

interface SocketUser {
  userId: number;
  socketId: string;
  callId?: string;
}

// Store active users and their socket connections
const activeUsers = new Map<number, Set<string>>(); // userId -> Set of socketIds
const socketToUser = new Map<string, SocketUser>(); // socketId -> SocketUser
const callRooms = new Map<string, Set<string>>(); // callId -> Set of socketIds
const callParticipants = new Map<string, number[]>(); // callId -> Array of participant userIds

let socketIOInstance: SocketIOServer | null = null;

export function getSocketIO(): SocketIOServer | null {
  return socketIOInstance;
}

export function setCallParticipants(callId: string, participantIds: number[]) {
  callParticipants.set(callId, participantIds);
}

export function getCallParticipants(callId: string): number[] | undefined {
  return callParticipants.get(callId);
}

export function initializeSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  socketIOInstance = io;

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      if (user) {
        (socket as any).userId = user.userId;
        (socket as any).user = user;
        next();
      } else {
        next(new Error('Authentication failed'));
      }
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = (socket as any).userId;
    const user = (socket as any).user;

    console.log(`User ${userId} connected with socket ${socket.id}`);

    // Track user connection
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId)!.add(socket.id);

    socketToUser.set(socket.id, {
      userId,
      socketId: socket.id,
    });

    // Join user's personal room for notifications
    socket.join(`user-${userId}`);

    // Join a call room
    socket.on('join-call', async (data: { callId: string }) => {
      const { callId } = data;
      
      if (!callId) {
        socket.emit('error', { message: 'Call ID is required' });
        return;
      }

      // Join the room
      socket.join(callId);
      
      // Track socket in call room
      if (!callRooms.has(callId)) {
        callRooms.set(callId, new Set());
      }
      callRooms.get(callId)!.add(socket.id);

      // Update user's call info
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        userInfo.callId = callId;
      }

      // Notify others in the room
      socket.to(callId).emit('user-joined', {
        userId,
        socketId: socket.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      });

      // Send list of existing participants to the new joiner with full user info
      const roomSockets = await io.in(callId).fetchSockets();
      const participants = await Promise.all(
        roomSockets
          .filter(s => s.id !== socket.id)
          .map(async (s) => {
            const u = socketToUser.get(s.id);
            if (u) {
              // Fetch user details from database
              const userDetails = await prisma.user.findUnique({
                where: { id: u.userId },
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              });
              return userDetails ? {
                userId: u.userId,
                socketId: s.id,
                user: {
                  id: userDetails.id,
                  name: userDetails.name,
                  email: userDetails.email,
                  image: userDetails.image,
                },
              } : null;
            }
            return null;
          })
      );

      socket.emit('call-participants', { participants: participants.filter(Boolean) });

      console.log(`User ${userId} joined call ${callId}`);
    });

    // Leave a call room
    socket.on('leave-call', (data: { callId: string }) => {
      const { callId } = data;
      
      socket.leave(callId);
      
      // Remove from call room tracking
      if (callRooms.has(callId)) {
        callRooms.get(callId)!.delete(socket.id);
        if (callRooms.get(callId)!.size === 0) {
          callRooms.delete(callId);
        }
      }

      // Notify others
      socket.to(callId).emit('user-left', {
        userId,
        socketId: socket.id,
      });

      // Update user's call info
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        userInfo.callId = undefined;
      }

      console.log(`User ${userId} left call ${callId}`);
    });

    // WebRTC signaling: Offer
    socket.on('webrtc-offer', (data: { offer: RTCSessionDescriptionInit; targetSocketId: string; callId: string }) => {
      const { offer, targetSocketId, callId } = data;
      socket.to(targetSocketId).emit('webrtc-offer', {
        offer,
        fromSocketId: socket.id,
        fromUserId: userId,
        callId,
      });
    });

    // WebRTC signaling: Answer
    socket.on('webrtc-answer', (data: { answer: RTCSessionDescriptionInit; targetSocketId: string; callId: string }) => {
      const { answer, targetSocketId, callId } = data;
      socket.to(targetSocketId).emit('webrtc-answer', {
        answer,
        fromSocketId: socket.id,
        fromUserId: userId,
        callId,
      });
    });

    // WebRTC signaling: ICE Candidate
    socket.on('webrtc-ice-candidate', (data: { candidate: RTCIceCandidateInit; targetSocketId: string; callId: string }) => {
      const { candidate, targetSocketId, callId } = data;
      socket.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate,
        fromSocketId: socket.id,
        fromUserId: userId,
        callId,
      });
    });

    // Handle user actions (mute, video toggle, etc.)
    socket.on('user-action', (data: { action: string; value: any; callId: string }) => {
      const { action, value, callId } = data;
      socket.to(callId).emit('user-action', {
        userId,
        action,
        value,
        socketId: socket.id,
      });
    });

    // Handle call rejection
    socket.on('call-rejected', (data: { callId: string }) => {
      const { callId } = data;
      // Notify all participants in the call that it was rejected
      socket.to(callId).emit('call-rejected', {
        userId,
        callId,
      });
    });

    // Handle call cancellation (caller cancelled before anyone joined)
    socket.on('call-cancelled', (data: { callId: string }) => {
      const { callId } = data;
      
      // Get participant IDs for this call
      const participantIds = callParticipants.get(callId);
      
      if (participantIds) {
        // Notify all participants directly (they might not have joined the call room yet)
        participantIds.forEach(participantId => {
          if (participantId !== userId) {
            // Find all socket connections for this participant
            const userSockets = Array.from(io.sockets.sockets.values()).filter(
              (s: any) => (s as any).userId === participantId
            );
            
            userSockets.forEach((s: any) => {
              s.emit('call-cancelled', {
                userId,
                callId,
              });
            });
          }
        });
      }
      
      // Also notify participants in the call room (if any have joined)
      socket.to(callId).emit('call-cancelled', {
        userId,
        callId,
      });
      
      // Clean up
      callParticipants.delete(callId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected (socket ${socket.id})`);

      // Remove from active users
      const userSockets = activeUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeUsers.delete(userId);
        }
      }

      // Remove from socket mapping
      const userInfo = socketToUser.get(socket.id);
      if (userInfo && userInfo.callId) {
        // Notify others in the call
        socket.to(userInfo.callId).emit('user-left', {
          userId,
          socketId: socket.id,
        });

        // Remove from call room
        if (callRooms.has(userInfo.callId)) {
          callRooms.get(userInfo.callId)!.delete(socket.id);
        }
      }

      socketToUser.delete(socket.id);
    });
  });

  return io;
}

