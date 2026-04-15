import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { prisma } from '../lib/prisma';

interface MailFetcherConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  userId: number;
  companyId?: number | null;
  branchId?: number | null;
  smtpSettingId: number;
}

/**
 * Fetch emails from IMAP server and store in database
 */
export async function fetchEmailsFromImap(config: MailFetcherConfig): Promise<number> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.secure,
      tlsOptions: { rejectUnauthorized: false }
    });

    let fetchedCount = 0;

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Fetch all emails from the last 90 days (not just unread)
        // First try to get all emails, then we'll filter for ones not in database
        const searchDate = new Date();
        searchDate.setDate(searchDate.getDate() - 90); // Last 90 days
        
        console.log(`Searching for emails since ${searchDate.toISOString()}`);
        console.log(`INBOX has ${box.messages.total} total messages`);
        
        // Define processResults function first
        const processResults = (results: number[]) => {
          if (!results || results.length === 0) {
            console.log('No emails found in IMAP inbox');
            imap.end();
            return resolve(0);
          }

          console.log(`Found ${results.length} emails in IMAP inbox`);
          
          // Limit to last 100 emails to avoid overwhelming the system
          const uids = results.slice(-100);
          console.log(`Processing last ${uids.length} emails`);

          const fetch = imap.fetch(uids, {
            bodies: '',
            struct: true
          });

          const emailPromises: Promise<void>[] = [];
          let messageCount = 0;

          fetch.on('message', (msg, seqno) => {
            messageCount++;
            msg.on('body', (stream, info) => {
              const emailPromise = new Promise<void>((resolve) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err);
                    resolve();
                    return;
                  }

                  try {
                    // Check if email already exists
                    const messageId = parsed.messageId || parsed.headers.get('message-id')?.[0] || null;
                    const fromEmail = parsed.from?.value[0]?.address || '';
                    const subject = parsed.subject || '';
                    const receivedDate = parsed.date || new Date();
                    
                    // First check by messageId if available (most reliable)
                    // Check across all SMTP settings for this user (email might be fetched from different accounts)
                    let existingMail = null;
                    if (messageId) {
                      // Check if any mail has this messageId in headers for this user
                      const allMails = await prisma.mail.findMany({
                        where: {
                          userId: config.userId
                        },
                        select: { id: true, headers: true, subject: true, fromEmail: true, receivedAt: true }
                      });
                      
                      existingMail = allMails.find(mail => {
                        const headers = mail.headers as any;
                        return headers?.messageId === messageId;
                      });
                    }
                    
                    // If not found by messageId, check by subject + from + received date (within 5 minute tolerance)
                    // This handles cases where messageId might be missing
                    if (!existingMail && subject && fromEmail) {
                      const dateTolerance = new Date(receivedDate.getTime() - 5 * 60000); // 5 minutes before
                      const dateToleranceEnd = new Date(receivedDate.getTime() + 5 * 60000); // 5 minutes after
                      
                      existingMail = await prisma.mail.findFirst({
                        where: {
                          userId: config.userId,
                          subject: subject,
                          fromEmail: fromEmail,
                          receivedAt: {
                            gte: dateTolerance,
                            lte: dateToleranceEnd
                          }
                        }
                      });
                    }

                    if (existingMail) {
                      console.log(`Skipping duplicate email: ${subject}`);
                      resolve();
                      return; // Skip if already exists
                    }
                    
                    console.log(`Processing new email: ${subject} from ${fromEmail}`);

                    // Extract email addresses (already extracted above, but keep for clarity)
                    const fromName = parsed.from?.value[0]?.name || '';
                    const toEmail = parsed.to?.value[0]?.address || '';
                    const toName = parsed.to?.value[0]?.name || '';
                    
                    // Extract CC and BCC
                    const cc = parsed.cc ? parsed.cc.value.map((addr: any) => addr.address).join(', ') : null;
                    const bcc = parsed.bcc ? parsed.bcc.value.map((addr: any) => addr.address).join(', ') : null;
                    
                    // Get email body (prefer HTML, fallback to text)
                    const body = parsed.html || parsed.text || '';
                    
                    // Extract labels from headers or subject
                    const labels: string[] = [];
                    if (parsed.subject) {
                      const subjectLower = parsed.subject.toLowerCase();
                      if (subjectLower.includes('social') || subjectLower.includes('facebook') || subjectLower.includes('twitter')) {
                        labels.push('social');
                      }
                      if (subjectLower.includes('update') || subjectLower.includes('notification')) {
                        labels.push('updates');
                      }
                      if (subjectLower.includes('forum') || subjectLower.includes('discussion')) {
                        labels.push('forums');
                      }
                      if (subjectLower.includes('shopping') || subjectLower.includes('order') || subjectLower.includes('purchase')) {
                        labels.push('shopping');
                      }
                      if (subjectLower.includes('promotion') || subjectLower.includes('sale') || subjectLower.includes('discount')) {
                        labels.push('promotions');
                      }
                    }

                    // Store email in database
                    const savedMail = await prisma.mail.create({
                      data: {
                        subject: subject,
                        body: body,
                        fromEmail: fromEmail,
                        fromName: fromName || null,
                        toEmail: toEmail || config.username,
                        toName: toName || null,
                        cc: cc,
                        bcc: bcc,
                        replyTo: parsed.replyTo?.value[0]?.address || null,
                        folder: 'INBOX',
                        isRead: false,
                        receivedAt: receivedDate,
                        userId: config.userId,
                        companyId: config.companyId || null,
                        branchId: config.branchId || null,
                        smtpSettingId: config.smtpSettingId,
                        labels: labels,
                        headers: {
                          messageId: messageId,
                          date: receivedDate.toISOString(),
                          inReplyTo: parsed.inReplyTo,
                          references: parsed.references
                        } as any
                      }
                    });

                    console.log(`Saved email with ID: ${savedMail.id}, Subject: ${subject}`);
                    fetchedCount++;
                  } catch (dbError) {
                    console.error('Error saving email to database:', dbError);
                  } finally {
                    resolve();
                  }
                });
              });
              emailPromises.push(emailPromise);
            });
          });

          fetch.once('error', (err) => {
            imap.end();
            reject(err);
          });

          fetch.once('end', async () => {
            console.log(`Finished fetching ${messageCount} messages, processing...`);
            // Wait for all emails to be processed
            if (emailPromises.length > 0) {
              await Promise.all(emailPromises);
            }
            console.log(`Successfully saved ${fetchedCount} new emails to database`);
            imap.end();
            resolve(fetchedCount);
          });
        };

        // Try to get all emails first (no date restriction for initial fetch)
        // We'll limit the number instead
        imap.search(['ALL'], (err, results) => {
          if (err) {
            console.error('IMAP search error:', err);
            // If ALL fails, try with date restriction
            imap.search([['SINCE', searchDate]], (err2, results2) => {
              if (err2) {
                imap.end();
                return reject(err2);
              }
              processResults(results2 || []);
            });
            return;
          }

          processResults(results || []);
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP connection error:', err);
      reject(err);
    });

    console.log(`Connecting to IMAP server: ${config.host}:${config.port} for user: ${config.username}`);
    imap.connect();
  });
}

/**
 * Get IMAP configuration from SMTP settings
 */
export function getImapConfigFromSmtp(smtpSetting: any): { host: string; port: number; secure: boolean } {
  // Gmail IMAP settings
  if (smtpSetting.host.includes('gmail.com') || smtpSetting.host.includes('google')) {
    return {
      host: 'imap.gmail.com',
      port: 993,
      secure: true
    };
  }

  // Outlook/Hotmail IMAP settings
  if (smtpSetting.host.includes('outlook.com') || smtpSetting.host.includes('hotmail.com') || smtpSetting.host.includes('live.com')) {
    return {
      host: 'outlook.office365.com',
      port: 993,
      secure: true
    };
  }

  // Yahoo IMAP settings
  if (smtpSetting.host.includes('yahoo.com')) {
    return {
      host: 'imap.mail.yahoo.com',
      port: 993,
      secure: true
    };
  }

  // Default: try to use same host with IMAP port
  // For custom SMTP servers, user might need to configure IMAP separately
  return {
    host: smtpSetting.host.replace('smtp.', 'imap.').replace('mail.', 'imap.'),
    port: smtpSetting.secure ? 993 : 143,
    secure: smtpSetting.secure
  };
}

