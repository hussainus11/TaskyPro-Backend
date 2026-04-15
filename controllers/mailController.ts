import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { logActivity, getUserContext } from '../utils/activityLogger';
import nodemailer from 'nodemailer';

/**
 * Get all mails for a user
 */
export const getMails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { folder, isRead, isStarred, search, page = 1, limit = 50 } = req.query;
    
    const where: any = {
      userId: userId
    };

    if (folder) {
      where.folder = folder;
    }

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (isStarred !== undefined) {
      where.isStarred = isStarred === 'true';
    }

    if (search) {
      where.OR = [
        { subject: { contains: search as string, mode: 'insensitive' } },
        { body: { contains: search as string, mode: 'insensitive' } },
        { fromEmail: { contains: search as string, mode: 'insensitive' } },
        { toEmail: { contains: search as string, mode: 'insensitive' } },
        { fromName: { contains: search as string, mode: 'insensitive' } },
        { toName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const [mails, total] = await Promise.all([
      prisma.mail.findMany({
        where,
        orderBy: [
          { isStarred: 'desc' },
          { receivedAt: 'desc' },
          { sentAt: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.mail.count({ where })
    ]);

    res.json({
      mails,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error: any) {
    console.error("Error fetching mails:", error);
    res.status(500).json({ error: "Failed to fetch mails", details: error.message });
  }
};

/**
 * Get a single mail by ID
 */
export const getMailById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    // Skip if id is a special route like "counts" or "accounts"
    if (id === 'counts' || id === 'accounts' || id === 'send' || id === 'draft' || id === 'bulk-update') {
      return res.status(404).json({ error: "Route not found" });
    }
    
    const mailId = parseInt(id);

    if (isNaN(mailId)) {
      return res.status(400).json({ error: "Invalid mail ID" });
    }

    const mail = await prisma.mail.findFirst({
      where: {
        id: mailId,
        userId: userId
      },
      include: {
        parentMail: true,
        replies: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!mail) {
      return res.status(404).json({ error: "Mail not found" });
    }

    // Mark as read if not already read
    if (!mail.isRead) {
      await prisma.mail.update({
        where: { id: mailId },
        data: { isRead: true }
      });
    }

    res.json(mail);
  } catch (error: any) {
    console.error("Error fetching mail:", error);
    res.status(500).json({ error: "Failed to fetch mail", details: error.message });
  }
};

/**
 * Send an email
 */
export const sendMail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { toEmail, toName, subject, body, cc, bcc, replyTo, smtpSettingId, inReplyTo } = req.body;

    if (!toEmail || !subject || !body) {
      return res.status(400).json({ error: "toEmail, subject, and body are required" });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get SMTP setting
    let smtpSetting;
    if (smtpSettingId) {
      smtpSetting = await prisma.smtpSetting.findFirst({
        where: {
          id: smtpSettingId,
          isActive: true,
          companyId: user.companyId || null,
          branchId: user.branchId || null
        }
      });
    } else {
      // Get default or active SMTP setting
      smtpSetting = await prisma.smtpSetting.findFirst({
        where: {
          isActive: true,
          isDefault: true,
          companyId: user.companyId || null,
          branchId: user.branchId || null
        }
      });

      if (!smtpSetting) {
        smtpSetting = await prisma.smtpSetting.findFirst({
          where: {
            isActive: true,
            companyId: user.companyId || null,
            branchId: user.branchId || null
          }
        });
      }
    }

    if (!smtpSetting) {
      return res.status(400).json({ error: "No active SMTP setting found. Please configure SMTP settings first." });
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpSetting.host,
      port: smtpSetting.port,
      secure: smtpSetting.secure,
      auth: {
        user: smtpSetting.username,
        pass: smtpSetting.password
      }
    });

    // Prepare email options
    const mailOptions: any = {
      from: smtpSetting.fromName 
        ? `${smtpSetting.fromName} <${smtpSetting.fromEmail}>`
        : smtpSetting.fromEmail,
      to: toName ? `${toName} <${toEmail}>` : toEmail,
      subject: subject,
      html: body,
      text: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    if (replyTo) mailOptions.replyTo = replyTo;
    if (inReplyTo) {
      const parentMail = await prisma.mail.findUnique({ where: { id: inReplyTo } });
      if (parentMail) {
        mailOptions.inReplyTo = parentMail.headers?.messageId || undefined;
        mailOptions.references = parentMail.headers?.messageId || undefined;
      }
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Save to database
    const mail = await prisma.mail.create({
      data: {
        subject,
        body,
        fromEmail: smtpSetting.fromEmail,
        fromName: smtpSetting.fromName || user.name,
        toEmail,
        toName: toName || null,
        cc: cc || null,
        bcc: bcc || null,
        replyTo: replyTo || null,
        folder: 'SENT',
        isRead: true,
        sentAt: new Date(),
        userId,
        companyId: user.companyId || null,
        branchId: user.branchId || null,
        smtpSettingId: smtpSetting.id,
        inReplyTo: inReplyTo || null,
        headers: {
          messageId: info.messageId,
          ...info.response
        } as any
      }
    });

    // Log activity
    if (userId) {
      const userContext = await getUserContext(userId);
      if (userContext) {
        await logActivity({
          type: 'mail_sent',
          message: `${userContext.name || 'User'} sent an email to ${toEmail}`,
          userId: userContext.id,
          companyId: user.companyId || userContext.companyId || undefined,
          branchId: user.branchId || userContext.branchId || undefined,
          entityType: 'MAIL',
          entityId: mail.id,
        });
      }
    }

    res.status(201).json(mail);
  } catch (error: any) {
    console.error("Error sending mail:", error);
    res.status(500).json({ error: "Failed to send mail", details: error.message });
  }
};

/**
 * Save draft email
 */
export const saveDraft = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id, toEmail, toName, subject, body, cc, bcc, replyTo, inReplyTo } = req.body;

    if (!subject && !body) {
      return res.status(400).json({ error: "Subject or body is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let mail;
    if (id) {
      // Update existing draft
      mail = await prisma.mail.update({
        where: { id: parseInt(id) },
        data: {
          subject: subject || '',
          body: body || '',
          toEmail: toEmail || '',
          toName: toName || null,
          cc: cc || null,
          bcc: bcc || null,
          replyTo: replyTo || null,
          inReplyTo: inReplyTo || null,
          folder: 'DRAFT',
          updatedAt: new Date()
        }
      });
    } else {
      // Create new draft
      mail = await prisma.mail.create({
        data: {
          subject: subject || '',
          body: body || '',
          fromEmail: user.email,
          fromName: user.name,
          toEmail: toEmail || '',
          toName: toName || null,
          cc: cc || null,
          bcc: bcc || null,
          replyTo: replyTo || null,
          folder: 'DRAFT',
          userId,
          companyId: user.companyId || null,
          branchId: user.branchId || null,
          inReplyTo: inReplyTo || null
        }
      });
    }

    res.json(mail);
  } catch (error: any) {
    console.error("Error saving draft:", error);
    res.status(500).json({ error: "Failed to save draft", details: error.message });
  }
};

/**
 * Delete mail
 */
export const deleteMail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const mailId = parseInt(id);

    if (isNaN(mailId)) {
      return res.status(400).json({ error: "Invalid mail ID" });
    }

    const mail = await prisma.mail.findFirst({
      where: {
        id: mailId,
        userId: userId
      }
    });

    if (!mail) {
      return res.status(404).json({ error: "Mail not found" });
    }

    // If already in trash, permanently delete
    if (mail.folder === 'TRASH') {
      await prisma.mail.delete({
        where: { id: mailId }
      });
    } else {
      // Move to trash
      await prisma.mail.update({
        where: { id: mailId },
        data: { folder: 'TRASH' }
      });
    }

    // Log activity
    if (userId) {
      const userContext = await getUserContext(userId);
      if (userContext) {
        await logActivity({
          type: 'mail_deleted',
          message: `${userContext.name || 'User'} deleted an email`,
          userId: userContext.id,
          companyId: mail.companyId || userContext.companyId || undefined,
          branchId: mail.branchId || userContext.branchId || undefined,
          entityType: 'MAIL',
          entityId: mailId,
        });
      }
    }

    res.json({ message: "Mail deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting mail:", error);
    res.status(500).json({ error: "Failed to delete mail", details: error.message });
  }
};

/**
 * Update mail (mark as read/unread, star, archive, etc.)
 */
export const updateMail = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { isRead, isStarred, isImportant, folder, labels } = req.body;
    const mailId = parseInt(id);

    if (isNaN(mailId)) {
      return res.status(400).json({ error: "Invalid mail ID" });
    }

    const mail = await prisma.mail.findFirst({
      where: {
        id: mailId,
        userId: userId
      }
    });

    if (!mail) {
      return res.status(404).json({ error: "Mail not found" });
    }

    const updateData: any = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isStarred !== undefined) updateData.isStarred = isStarred;
    if (isImportant !== undefined) updateData.isImportant = isImportant;
    if (folder) updateData.folder = folder;
    if (labels !== undefined) updateData.labels = labels;

    const updatedMail = await prisma.mail.update({
      where: { id: mailId },
      data: updateData
    });

    res.json(updatedMail);
  } catch (error: any) {
    console.error("Error updating mail:", error);
    res.status(500).json({ error: "Failed to update mail", details: error.message });
  }
};

/**
 * Bulk update mails
 */
export const bulkUpdateMails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { mailIds, isRead, isStarred, folder, labels } = req.body;

    if (!mailIds || !Array.isArray(mailIds) || mailIds.length === 0) {
      return res.status(400).json({ error: "mailIds array is required" });
    }

    const updateData: any = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isStarred !== undefined) updateData.isStarred = isStarred;
    if (folder) updateData.folder = folder;
    if (labels !== undefined) updateData.labels = labels;

    const result = await prisma.mail.updateMany({
      where: {
        id: { in: mailIds.map((id: any) => parseInt(id)) },
        userId: userId
      },
      data: updateData
    });

    res.json({ message: `${result.count} mails updated successfully` });
  } catch (error: any) {
    console.error("Error bulk updating mails:", error);
    res.status(500).json({ error: "Failed to update mails", details: error.message });
  }
};

/**
 * Get mail accounts (SMTP settings) for the user - returns only email addresses
 */
export const getMailAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true, email: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const smtpSettings = await prisma.smtpSetting.findMany({
      where: {
        isActive: true,
        companyId: user.companyId || null,
        branchId: user.branchId || null
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        fromEmail: true
      }
    });

    // Return emails with their SMTP setting IDs
    const accounts = smtpSettings.map(setting => ({
      email: setting.fromEmail,
      smtpSettingId: setting.id
    }));

    res.json(accounts);
  } catch (error: any) {
    console.error("Error fetching mail accounts:", error);
    res.status(500).json({ error: "Failed to fetch mail accounts", details: error.message });
  }
};

/**
 * Get mail counts by folder and labels
 */
export const getMailCounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get counts for each folder
    const [inboxCount, draftsCount, sentCount, junkCount, trashCount, archiveCount] = await Promise.all([
      prisma.mail.count({
        where: {
          userId,
          folder: 'INBOX',
          isRead: false
        }
      }),
      prisma.mail.count({
        where: {
          userId,
          folder: 'DRAFT'
        }
      }),
      prisma.mail.count({
        where: {
          userId,
          folder: 'SENT'
        }
      }),
      prisma.mail.count({
        where: {
          userId,
          folder: 'SPAM',
          isRead: false
        }
      }),
      prisma.mail.count({
        where: {
          userId,
          folder: 'TRASH'
        }
      }),
      prisma.mail.count({
        where: {
          userId,
          folder: 'ARCHIVE'
        }
      })
    ]);

    // Get counts for labels (categories)
    const labelCounts = await prisma.mail.groupBy({
      by: ['labels'],
      where: {
        userId,
        folder: 'INBOX',
        isRead: false
      },
      _count: {
        id: true
      }
    });

    // Process label counts - labels is an array, so we need to flatten
    const labelMap: Record<string, number> = {};
    labelCounts.forEach(item => {
      if (item.labels && Array.isArray(item.labels)) {
        item.labels.forEach((label: string) => {
          if (label) {
            labelMap[label.toLowerCase()] = (labelMap[label.toLowerCase()] || 0) + item._count.id;
          }
        });
      }
    });

    res.json({
      folders: {
        inbox: inboxCount,
        drafts: draftsCount,
        sent: sentCount,
        junk: junkCount,
        trash: trashCount,
        archive: archiveCount
      },
      labels: {
        social: labelMap['social'] || 0,
        updates: labelMap['updates'] || 0,
        forums: labelMap['forums'] || 0,
        shopping: labelMap['shopping'] || 0,
        promotions: labelMap['promotions'] || 0
      }
    });
  } catch (error: any) {
    console.error("Error fetching mail counts:", error);
    res.status(500).json({ error: "Failed to fetch mail counts", details: error.message });
  }
};

/**
 * Fetch emails from IMAP server for a specific SMTP setting
 */
export const fetchEmails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { smtpSettingId } = req.body;

    if (!smtpSettingId) {
      return res.status(400).json({ error: "smtpSettingId is required" });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get SMTP setting
    const smtpSetting = await prisma.smtpSetting.findFirst({
      where: {
        id: smtpSettingId,
        isActive: true,
        companyId: user.companyId || null,
        branchId: user.branchId || null
      }
    });

    if (!smtpSetting) {
      return res.status(404).json({ error: "SMTP setting not found or inactive" });
    }

    // Import mail fetcher
    const { fetchEmailsFromImap, getImapConfigFromSmtp } = await import('../services/mailFetcher');
    
    // Get IMAP configuration
    const imapConfig = getImapConfigFromSmtp(smtpSetting);
    
    console.log(`Fetching emails for SMTP setting ${smtpSetting.id} (${smtpSetting.fromEmail})`);
    console.log(`IMAP Config: ${imapConfig.host}:${imapConfig.port}, secure: ${imapConfig.secure}`);

    // Fetch emails
    try {
      const fetchedCount = await fetchEmailsFromImap({
        host: imapConfig.host,
        port: imapConfig.port,
        secure: imapConfig.secure,
        username: smtpSetting.username,
        password: smtpSetting.password,
        userId: userId,
        companyId: user.companyId || null,
        branchId: user.branchId || null,
        smtpSettingId: smtpSetting.id
      });

      console.log(`Email fetch completed. Fetched ${fetchedCount} new emails.`);

      res.json({ 
        message: `Successfully fetched ${fetchedCount} new emails`,
        count: fetchedCount 
      });
    } catch (fetchError: any) {
      console.error('Error during email fetch:', fetchError);
      // Provide more helpful error messages
      let errorMessage = fetchError.message || 'Failed to fetch emails';
      if (errorMessage.includes('Invalid credentials') || errorMessage.includes('authentication')) {
        errorMessage = 'Invalid email credentials. Please check your username and password. For Gmail, you may need to use an App Password.';
      } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
        errorMessage = 'Could not connect to email server. Please check your internet connection and SMTP settings.';
      }
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ 
      error: "Failed to fetch emails", 
      details: error.message 
    });
  }
};

/**
 * Test IMAP connection for an SMTP setting
 */
export const testImapConnection = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { smtpSettingId } = req.body;

    if (!smtpSettingId) {
      return res.status(400).json({ error: "smtpSettingId is required" });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get SMTP setting
    const smtpSetting = await prisma.smtpSetting.findFirst({
      where: {
        id: smtpSettingId,
        isActive: true,
        companyId: user.companyId || null,
        branchId: user.branchId || null
      }
    });

    if (!smtpSetting) {
      return res.status(404).json({ error: "SMTP setting not found or inactive" });
    }

    // Import mail fetcher
    const { getImapConfigFromSmtp } = await import('../services/mailFetcher');
    const Imap = (await import('imap')).default;
    
    // Get IMAP configuration
    const imapConfig = getImapConfigFromSmtp(smtpSetting);

    // Test connection
    return new Promise((resolve) => {
      const imap = new Imap({
        user: smtpSetting.username,
        password: smtpSetting.password,
        host: imapConfig.host,
        port: imapConfig.port,
        tls: imapConfig.secure,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 10000
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            imap.end();
            return resolve(res.status(400).json({ 
              error: "Failed to open INBOX", 
              details: err.message 
            }));
          }

          // Get total message count
          const totalMessages = box.messages.total;
          
          imap.end();
          resolve(res.json({ 
            success: true,
            message: "IMAP connection successful",
            totalMessages: totalMessages,
            imapConfig: imapConfig
          }));
        });
      });

      imap.once('error', (err: any) => {
        imap.end();
        let errorMessage = err.message || 'IMAP connection failed';
        if (errorMessage.includes('Invalid credentials') || errorMessage.includes('authentication')) {
          errorMessage = 'Invalid email credentials. For Gmail, you need to use an App Password instead of your regular password.';
        }
        resolve(res.status(400).json({ 
          error: "IMAP connection failed", 
          details: errorMessage 
        }));
      });

      imap.connect();
    });
  } catch (error: any) {
    console.error("Error testing IMAP connection:", error);
    res.status(500).json({ 
      error: "Failed to test IMAP connection", 
      details: error.message 
    });
  }
};

