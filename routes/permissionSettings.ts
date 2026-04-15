import express from 'express';
import {
  getPermissionSettings,
  getPermissionSettingsMatrix,
  upsertPermissionSettings,
  deletePermissionSetting,
  getHierarchicalPermissions,
  upsertHierarchicalPermissions,
  checkResourcePermission
} from '../controllers/permissionSettingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getPermissionSettings);
router.get('/matrix', getPermissionSettingsMatrix);
router.get('/hierarchical', getHierarchicalPermissions);
router.get('/check', checkResourcePermission);
router.post('/upsert', upsertPermissionSettings);
router.post('/hierarchical/upsert', upsertHierarchicalPermissions);
router.delete('/:id', deletePermissionSetting);

export default router;











