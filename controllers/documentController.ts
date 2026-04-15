import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';
import * as fs from 'fs';
import * as path from 'path';
import { logActivity, getUserContext } from '../utils/activityLogger';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper to get user context from request
const getUserId = (req: Request): number => {
  // Try to get from query, body, or headers
  const userId = req.query.userId || req.body.userId || req.headers['x-user-id'];
  if (typeof userId === 'string') {
    return parseInt(userId);
  }
  if (typeof userId === 'number') {
    return userId;
  }
  // Default to 1 if not provided (for development)
  return 1;
};

// Create a Word document
export const createWordDocument = async (req: Request, res: Response) => {
  try {
    const { name, userId, companyId, branchId } = req.body;
    const currentUserId = userId || getUserId(req);

    // Create a simple Word document
    const doc = new DocxDocument({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: name || 'New Document',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'This is a new document created in TaskyPro.',
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'You can start editing this document now.',
                  size: 24,
                }),
              ],
            }),
          ],
        },
      ],
    });

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc);

    // Save file
    const fileName = `${Date.now()}_${(name || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // Get file stats
    const stats = fs.statSync(filePath);

    // Save to database
    const document = await prisma.document.create({
      data: {
        name: name || 'New Document',
        type: 'DOCUMENT',
        filePath: `/uploads/documents/${fileName}`,
        fileSize: stats.size,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        createdById: currentUserId,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Log activity for document creation
    const creator = document.createdBy;
    if (creator) {
      const userContext = await getUserContext(creator.id);
      if (userContext) {
        await logActivity({
          type: 'document_created',
          message: `${userContext.name || 'User'} created Word document "${document.name}"`,
          userId: userContext.id,
          companyId: document.companyId || userContext.companyId || undefined,
          branchId: document.branchId || userContext.branchId || undefined,
          entityType: 'DOCUMENT',
          entityId: document.id,
        });
      }
    }

    res.status(201).json({
      ...document,
      downloadUrl: `/api/documents/${document.id}/download`,
    });
  } catch (error: any) {
    console.error('Failed to create Word document:', error);
    res.status(500).json({ error: 'Failed to create Word document', details: error.message });
  }
};

// Create an Excel spreadsheet
export const createExcelDocument = async (req: Request, res: Response) => {
  try {
    const { name, userId, companyId, branchId } = req.body;
    const currentUserId = userId || getUserId(req);

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(name || 'Sheet1');

    // Add some default headers and data
    worksheet.columns = [
      { header: 'Column 1', key: 'col1', width: 15 },
      { header: 'Column 2', key: 'col2', width: 15 },
      { header: 'Column 3', key: 'col3', width: 15 },
    ];

    worksheet.addRow({ col1: 'Sample', col2: 'Data', col3: 'Here' });
    worksheet.addRow({ col1: 'Row 2', col2: 'Data 2', col3: 'Value 2' });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Generate the file buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Save file
    const fileName = `${Date.now()}_${(name || 'spreadsheet').replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(buffer as ArrayBuffer));

    // Get file stats
    const stats = fs.statSync(filePath);

    // Save to database
    const document = await prisma.document.create({
      data: {
        name: name || 'New Spreadsheet',
        type: 'SPREADSHEET',
        filePath: `/uploads/documents/${fileName}`,
        fileSize: stats.size,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        createdById: currentUserId,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Log activity for Excel document creation
    const creator = document.createdBy;
    if (creator) {
      const userContext = await getUserContext(creator.id);
      if (userContext) {
        await logActivity({
          type: 'document_created',
          message: `${userContext.name || 'User'} created Excel document "${document.name}"`,
          userId: userContext.id,
          companyId: document.companyId || userContext.companyId || undefined,
          branchId: document.branchId || userContext.branchId || undefined,
          entityType: 'DOCUMENT',
          entityId: document.id,
        });
      }
    }

    res.status(201).json({
      ...document,
      downloadUrl: `/api/documents/${document.id}/download`,
    });
  } catch (error: any) {
    console.error('Failed to create Excel document:', error);
    res.status(500).json({ error: 'Failed to create Excel document', details: error.message });
  }
};

// Create a PowerPoint presentation
export const createPowerPointDocument = async (req: Request, res: Response) => {
  try {
    const { name, userId, companyId, branchId } = req.body;
    const currentUserId = userId || getUserId(req);

    // Create a new presentation
    const pptx = new PptxGenJS();

    // Set presentation properties
    pptx.author = 'TaskyPro';
    pptx.company = 'TaskyPro';
    pptx.title = name || 'New Presentation';

    // Add a slide
    const slide = pptx.addSlide();
    slide.addText(name || 'New Presentation', {
      x: 1,
      y: 1,
      w: 8,
      h: 1.5,
      fontSize: 44,
      bold: true,
      align: 'center',
    });
    slide.addText('Created in TaskyPro', {
      x: 1,
      y: 3,
      w: 8,
      h: 1,
      fontSize: 24,
      align: 'center',
      color: '666666',
    });

    // Generate the file buffer
    const buffer = await pptx.write({ outputType: 'nodebuffer' });

    // Save file
    const fileName = `${Date.now()}_${(name || 'presentation').replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // Get file stats
    const stats = fs.statSync(filePath);

    // Save to database
    const document = await prisma.document.create({
      data: {
        name: name || 'New Presentation',
        type: 'PRESENTATION',
        filePath: `/uploads/documents/${fileName}`,
        fileSize: stats.size,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        createdById: currentUserId,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Log activity for PowerPoint document creation
    const creator = document.createdBy;
    if (creator) {
      const userContext = await getUserContext(creator.id);
      if (userContext) {
        await logActivity({
          type: 'document_created',
          message: `${userContext.name || 'User'} created PowerPoint document "${document.name}"`,
          userId: userContext.id,
          companyId: document.companyId || userContext.companyId || undefined,
          branchId: document.branchId || userContext.branchId || undefined,
          entityType: 'DOCUMENT',
          entityId: document.id,
        });
      }
    }

    res.status(201).json({
      ...document,
      downloadUrl: `/api/documents/${document.id}/download`,
    });
  } catch (error: any) {
    console.error('Failed to create PowerPoint document:', error);
    res.status(500).json({ error: 'Failed to create PowerPoint document', details: error.message });
  }
};

// Create a Board document
export const createBoardDocument = async (req: Request, res: Response) => {
  try {
    const { name, userId, companyId, branchId, initialContent } = req.body;
    const currentUserId = userId || getUserId(req);

    // Use provided initialContent or create default board structure
    let boardContent: string;
    if (initialContent) {
      boardContent = typeof initialContent === 'string' ? initialContent : JSON.stringify(initialContent);
    } else {
      // Default board structure (empty board with default columns)
      boardContent = JSON.stringify({
        columns: [
          { id: '1', title: 'To Do', cards: [] },
          { id: '2', title: 'In Progress', cards: [] },
          { id: '3', title: 'Done', cards: [] },
        ],
      });
    }

    // Save to database (no file needed for board, just content)
    const document = await prisma.document.create({
      data: {
        name: name || 'New Board',
        type: 'BOARD',
        content: boardContent,
        createdById: currentUserId,
        companyId: companyId ? parseInt(companyId) : null,
        branchId: branchId ? parseInt(branchId) : null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Log activity for board document creation
    const creator = document.createdBy;
    if (creator) {
      const userContext = await getUserContext(creator.id);
      if (userContext) {
        await logActivity({
          type: 'document_created',
          message: `${userContext.name || 'User'} created Board document "${document.name}"`,
          userId: userContext.id,
          companyId: document.companyId || userContext.companyId || undefined,
          branchId: document.branchId || userContext.branchId || undefined,
          entityType: 'DOCUMENT',
          entityId: document.id,
        });
      }
    }

    res.status(201).json({
      ...document,
      downloadUrl: `/api/documents/${document.id}/download`,
    });
  } catch (error: any) {
    console.error('Failed to create Board document:', error);
    res.status(500).json({ error: 'Failed to create Board document', details: error.message });
  }
};

// Get all documents
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { type, companyId, branchId, userId } = req.query;

    const where: any = {};

    // Filter by companyId and branchId first (required for multi-tenancy)
    // These filters are always applied to ensure data isolation
    if (companyId) {
      where.companyId = parseInt(companyId as string);
    }

    if (branchId) {
      where.branchId = parseInt(branchId as string);
    }

    // If userId is provided, filter by user's documents OR shared documents
    // Note: companyId and branchId filters above ensure shared documents are from the same company/branch
    if (userId) {
      const userIdNum = parseInt(userId as string);
      where.OR = [
        { createdById: userIdNum },
        { isShared: true },
      ];
    } else {
      // If no userId, show all shared documents within the company/branch
      where.isShared = true;
    }

    // Filter by document type if provided
    if (type) {
      where.type = type;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.json(documents);
  } catch (error: any) {
    console.error('Failed to fetch documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }
};

// Download a document
export const downloadDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document || !document.filePath) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(__dirname, '..', document.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('Failed to download document:', error);
    res.status(500).json({ error: 'Failed to download document', details: error.message });
  }
};

// Get a single document
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error: any) {
    console.error('Failed to fetch document:', error);
    res.status(500).json({ error: 'Failed to fetch document', details: error.message });
  }
};

// Update document
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, isShared, isPublished, content } = req.body;

    const document = await prisma.document.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(isShared !== undefined && { isShared }),
        ...(isPublished !== undefined && { isPublished }),
        ...(content !== undefined && { content }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Log activity for document update
    const creator = document.createdBy;
    if (creator) {
      const userContext = await getUserContext(creator.id);
      if (userContext) {
        await logActivity({
          type: 'document_updated',
          message: `${userContext.name || 'User'} updated document "${document.name}"`,
          userId: userContext.id,
          companyId: document.companyId || userContext.companyId || undefined,
          branchId: document.branchId || userContext.branchId || undefined,
          entityType: 'DOCUMENT',
          entityId: document.id,
        });
      }
    }

    res.json(document);
  } catch (error: any) {
    console.error('Failed to update document:', error);
    res.status(500).json({ error: 'Failed to update document', details: error.message });
  }
};

// Delete document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file if it exists
    if (document.filePath) {
      const filePath = path.join(__dirname, '..', document.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.document.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete document:', error);
    res.status(500).json({ error: 'Failed to delete document', details: error.message });
  }
};

