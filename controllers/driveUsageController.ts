import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Get drive usage statistics
export const getDriveUsage = async (req: AuthRequest, res: Response) => {
  try {
    const { companyId, branchId } = req.query;
    const userId = req.userId;

    // Get user to determine company/branch
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true, branchId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const filterCompanyId = companyId ? parseInt(companyId as string) : user.companyId;
    const filterBranchId = branchId ? parseInt(branchId as string) : user.branchId;

    const companyIdValue = filterCompanyId ?? null;
    const branchIdValue = filterBranchId ?? null;

    // Prisma doesn't allow `null` in compound-unique selectors reliably, so use findFirst.
    let storageQuota = await prisma.storageQuota.findFirst({
      where: {
        companyId: companyIdValue,
        branchId: branchIdValue,
      }
    });

    if (!storageQuota) {
      // Create default storage quota (10 GB)
      storageQuota = await prisma.storageQuota.create({
        data: {
          companyId: companyIdValue,
          branchId: branchIdValue,
          totalStorage: BigInt(10737418240), // 10 GB
          usedStorage: BigInt(0)
        }
      });
    }

    // Calculate actual usage from files
    const where: any = {};
    if (filterCompanyId) where.companyId = filterCompanyId;
    if (filterBranchId) {
      where.branchId = filterBranchId;
    } else if (filterCompanyId) {
      where.branchId = null;
    }

    const files = await prisma.file.findMany({
      where,
      select: {
        size: true,
        type: true,
        mimeType: true
      }
    });

    // Calculate total size and breakdown by type
    let totalSize = BigInt(0);
    const byType = {
      documents: { size: BigInt(0), count: 0 },
      images: { size: BigInt(0), count: 0 },
      videos: { size: BigInt(0), count: 0 },
      audio: { size: BigInt(0), count: 0 },
      archives: { size: BigInt(0), count: 0 },
      other: { size: BigInt(0), count: 0 }
    };

    files.forEach((file) => {
      const size = BigInt(file.size || 0);
      totalSize += size;

      const mimeType = (file.mimeType || '').toLowerCase();
      const fileType = file.type || 'OTHER';

      if (mimeType.startsWith('image/') || fileType === 'IMAGE') {
        byType.images.size += size;
        byType.images.count += 1;
      } else if (mimeType.startsWith('video/') || fileType === 'VIDEO') {
        byType.videos.size += size;
        byType.videos.count += 1;
      } else if (mimeType.startsWith('audio/') || fileType === 'AUDIO') {
        byType.audio.size += size;
        byType.audio.count += 1;
      } else if (
        mimeType.includes('zip') ||
        mimeType.includes('rar') ||
        mimeType.includes('tar') ||
        mimeType.includes('7z') ||
        fileType === 'ARCHIVE'
      ) {
        byType.archives.size += size;
        byType.archives.count += 1;
      } else if (
        mimeType.includes('pdf') ||
        mimeType.includes('document') ||
        mimeType.includes('text') ||
        mimeType.includes('word') ||
        mimeType.includes('excel') ||
        fileType === 'DOCUMENT'
      ) {
        byType.documents.size += size;
        byType.documents.count += 1;
      } else {
        byType.other.size += size;
        byType.other.count += 1;
      }
    });

    // Update storage quota with actual usage
    await prisma.storageQuota.update({
      where: { id: storageQuota.id },
      data: { usedStorage: totalSize }
    });

    const usagePercentage = Number((totalSize * BigInt(100)) / storageQuota.totalStorage);

    res.json({
      totalSize: storageQuota.totalStorage.toString(),
      usedSize: totalSize.toString(),
      availableSize: (storageQuota.totalStorage - totalSize).toString(),
      usagePercentage: Math.min(usagePercentage, 100),
      fileCount: files.length,
      byType: {
        documents: {
          size: byType.documents.size.toString(),
          count: byType.documents.count
        },
        images: {
          size: byType.images.size.toString(),
          count: byType.images.count
        },
        videos: {
          size: byType.videos.size.toString(),
          count: byType.videos.count
        },
        audio: {
          size: byType.audio.size.toString(),
          count: byType.audio.count
        },
        archives: {
          size: byType.archives.size.toString(),
          count: byType.archives.count
        },
        other: {
          size: byType.other.size.toString(),
          count: byType.other.count
        }
      }
    });
  } catch (error: any) {
    console.error('Get drive usage error:', error);
    res.status(500).json({ error: 'Failed to fetch drive usage', details: error.message });
  }
};

