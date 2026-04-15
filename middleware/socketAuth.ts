import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface DecodedToken {
  userId: number;
  email: string;
}

export async function authenticateSocket(socket: Socket): Promise<any | null> {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (!decoded || !decoded.userId) {
      return null;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      return null;
    }

    return {
      userId: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      companyId: user.companyId,
      branchId: user.branchId,
    };
  } catch (error) {
    console.error('Socket authentication error:', error);
    return null;
  }
}

