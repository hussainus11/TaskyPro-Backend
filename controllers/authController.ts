import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../lib/email';
import { OAuth2Client } from 'google-auth-library';
import http from 'http';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export const login = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // TEMPORARY: Only require email, skip password validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Trim email to remove whitespace
    const trimmedEmail = email.trim();

    // Find user by email (exact match - emails should be stored consistently)
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: { company: true, branch: true },
    });

    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${trimmedEmail}`);
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if company trial has expired
    if (user.company && user.company.plan === 'Free' && user.company.trialEndDate) {
      const now = new Date();
      const trialEnd = new Date(user.company.trialEndDate);
      if (now > trialEnd) {
        return res.status(403).json({ 
          error: 'Trial expired',
          message: 'Your trial account has been expired. Please upgrade your plan to continue.',
          trialExpired: true
        });
      }
    }

    // TEMPORARY: Skip all password validations
    console.log(`⚠️ TEMPORARY: Login successful for user: ${user.email} (password validation bypassed)`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save login history with geolocation
    let { latitude, longitude, city, region, country, timezone, ipAddress, userAgent, device, browser, os } = req.body;
    
    // Get IP address from request if not provided
    const clientIp = ipAddress || req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null;
    
    // If location data is missing, try to get it from IP geolocation on backend
    if ((!city && !country) || (!latitude && !longitude)) {
      try {
        // Use ip-api.com for IP geolocation (free, no API key needed, works from server)
        const url = `http://ip-api.com/json/${clientIp}?fields=status,country,regionName,city,lat,lon,timezone`;
        
        const ipGeoData: any = await new Promise((resolve, reject) => {
          http.get(url, (res: any) => {
            let data = '';
            res.on('data', (chunk: string) => { data += chunk; });
            res.on('end', () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          }).on('error', reject).setTimeout(3000, () => {
            reject(new Error('Timeout'));
          });
        });
        
        if (ipGeoData && ipGeoData.status === 'success') {
          // Use the IP geolocation data if frontend didn't provide it
          if (!city) city = ipGeoData.city;
          if (!region) region = ipGeoData.regionName;
          if (!country) country = ipGeoData.country;
          if (!latitude) latitude = ipGeoData.lat;
          if (!longitude) longitude = ipGeoData.lon;
          if (!timezone) timezone = ipGeoData.timezone;
        }
      } catch (ipGeoError) {
        console.log('Backend IP geolocation failed (non-critical):', ipGeoError);
      }
    }
    
    // Debug log to see what we're receiving
    console.log('Login geolocation data:', { latitude, longitude, city, region, country, timezone, ipAddress: clientIp });
    
    try {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          branchId: user.branchId,
          latitude: latitude != null && latitude !== '' ? (typeof latitude === 'number' ? latitude : parseFloat(String(latitude))) : null,
          longitude: longitude != null && longitude !== '' ? (typeof longitude === 'number' ? longitude : parseFloat(String(longitude))) : null,
          city: city || null,
          region: region || null,
          country: country || null,
          timezone: timezone || null,
          ipAddress: clientIp,
          userAgent: userAgent || req.headers['user-agent'] || null,
          device: device || null,
          browser: browser || null,
          os: os || null,
        },
      });
      console.log('Login history saved successfully');
    } catch (historyError: any) {
      // Log error but don't fail login if history save fails
      console.error('Failed to save login history:', historyError);
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
        company: user.company,
        branch: user.branch,
        mustChangePassword: user.mustChangePassword || false,
      },
      mustChangePassword: user.mustChangePassword || false,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If current password is provided, verify it
    if (currentPassword && user.password) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear mustChangePassword flag
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        branchId: true,
        mustChangePassword: true,
      },
    });

    res.json({
      message: 'Password changed successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password', details: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, country, role, companyId, branchId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        mustChangePassword: false, // User set their own password
        country: country || 'US',
        role: role || 'employee',
        image: '/images/avatars/default.png',
        status: 'active',
        plan_name: 'Basic',
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      include: { company: true, branch: true },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
        company: user.company,
        branch: user.branch,
        mustChangePassword: false,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register', details: error.message });
  }
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { company: true, branch: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
        company: user.company,
        branch: user.branch,
        mustChangePassword: user.mustChangePassword || false,
      },
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (user) {
      // Invalidate any existing unused reset tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Store token in database
      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt,
          used: false,
        },
      });

      // Generate reset link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetLink = `${frontendUrl}/dashboard/reset-password?token=${resetToken}`;

      // Send email with reset link (non-blocking - response returns immediately)
      sendPasswordResetEmail(user.email, user.name, resetLink).catch((emailError: any) => {
        console.error('Failed to send password reset email:', emailError.message);
      });
      
      // In development, also log the reset link for easy testing
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Password reset link for ${email}: ${resetLink}`);
      }
    }

    res.json({
      message: 'If an account with that email exists, we have sent password reset instructions.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    // Still return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, we have sent password reset instructions.',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find the reset token in database
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetTokenRecord) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token has been used
    if (resetTokenRecord.used) {
      return res.status(401).json({ error: 'This reset token has already been used' });
    }

    // Check if token has expired
    if (resetTokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: 'This reset token has expired' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear mustChangePassword flag
    await prisma.user.update({
      where: { id: resetTokenRecord.userId },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: { used: true },
    });

    res.json({
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password', details: error.message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google OAuth not configured' });
    }

    // Verify Google ID token
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (error: any) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token payload' });
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Missing email or Google ID' });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId },
        ],
      },
      include: { company: true, branch: true },
    });

    if (user) {
      // Update user if they don't have googleId set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            image: picture || user.image,
            name: name || user.name,
          },
          include: { company: true, branch: true },
        });
      } else if (picture && user.image !== picture) {
        // Update image if changed
        user = await prisma.user.update({
          where: { id: user.id },
          data: { image: picture },
          include: { company: true, branch: true },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          googleId,
          password: null, // No password for OAuth users
          mustChangePassword: false, // OAuth users don't need to change password
          country: 'US',
          role: 'employee',
          image: picture || '/images/avatars/default.png',
          status: 'active',
          plan_name: 'Basic',
        },
        include: { company: true, branch: true },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save login history with geolocation for Google login
    const { latitude, longitude, city, region, country, timezone, ipAddress, userAgent, device, browser, os } = req.body;
    try {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          branchId: user.branchId,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          city: city || null,
          region: region || null,
          country: country || null,
          timezone: timezone || null,
          ipAddress: ipAddress || req.ip || req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
          userAgent: userAgent || req.headers['user-agent'] || null,
          device: device || null,
          browser: browser || null,
          os: os || null,
        },
      });
    } catch (historyError: any) {
      // Log error but don't fail login if history save fails
      console.error('Failed to save login history:', historyError);
    }

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        branchId: user.branchId,
        company: user.company,
        branch: user.branch,
        mustChangePassword: false,
      },
      mustChangePassword: false,
    });
  } catch (error: any) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google', details: error.message });
  }
};
