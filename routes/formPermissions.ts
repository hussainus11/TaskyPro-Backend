import { Router } from 'express';
import {
  getSectionPermissions,
  updateSectionPermission,
  bulkUpdateSectionPermissions,
  getFieldPermissions,
  updateFieldPermission,
  bulkUpdateFieldPermissions,
} from '../controllers/formPermissionController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Section permissions
router.get('/sections/:sectionId', authenticate, getSectionPermissions);
router.put('/sections/:sectionId', authenticate, updateSectionPermission);
router.post('/sections/:sectionId/bulk', authenticate, bulkUpdateSectionPermissions);

// Field permissions
router.get('/fields/:fieldId', authenticate, getFieldPermissions);
router.put('/fields/:fieldId', authenticate, updateFieldPermission);
router.post('/fields/:fieldId/bulk', authenticate, bulkUpdateFieldPermissions);

export default router;










































