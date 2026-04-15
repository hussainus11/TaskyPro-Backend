import { Router } from 'express';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems
} from '../controllers/menuItemsController';

const router = Router();

// Get all menu items (grouped by group, ordered)
router.get('/', getMenuItems);

// Create a new menu item
router.post('/', createMenuItem);

// Update a menu item
router.put('/:id', updateMenuItem);

// Delete a menu item
router.delete('/:id', deleteMenuItem);

// Reorder menu items
router.post('/reorder', reorderMenuItems);

export default router;





















































