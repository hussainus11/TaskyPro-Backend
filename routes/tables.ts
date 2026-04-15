import { Router } from 'express';
import {
  getTableCategories,
  getTableCategoryById,
  createTableCategory,
  updateTableCategory,
  deleteTableCategory,
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable
} from '../controllers/tableController';

const router = Router();

// Table Category routes
router.get('/categories', getTableCategories);
router.get('/categories/:id', getTableCategoryById);
router.post('/categories', createTableCategory);
router.put('/categories/:id', updateTableCategory);
router.delete('/categories/:id', deleteTableCategory);

// Table routes
router.get('/', getTables);
router.get('/:id', getTableById);
router.post('/', createTable);
router.put('/:id', updateTable);
router.delete('/:id', deleteTable);

export default router;









