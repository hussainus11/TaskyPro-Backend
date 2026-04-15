import express from 'express';
import {
  getDealPipelines,
  getDealPipeline,
  createDealPipeline,
  updateDealPipeline,
  deleteDealPipeline,
  reorderDealPipelines
} from '../controllers/dealPipelineController';
import {
  getPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  deletePipelineStage,
  reorderPipelineStages
} from '../controllers/pipelineStageController';
import {
  getPipelineConnections,
  createPipelineConnection,
  deletePipelineConnection
} from '../controllers/pipelineConnectionController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// Pipeline routes
router.get('/', getDealPipelines);
router.get('/:id', getDealPipeline);
router.post('/', createDealPipeline);
router.put('/:id', updateDealPipeline);
router.delete('/:id', deleteDealPipeline);
router.post('/reorder', reorderDealPipelines);

// Stage routes (nested under pipeline)
router.get('/:pipelineId/stages', getPipelineStages);
router.post('/:pipelineId/stages', createPipelineStage);
router.put('/:pipelineId/stages/:stageId', updatePipelineStage);
router.delete('/:pipelineId/stages/:stageId', deletePipelineStage);
router.post('/:pipelineId/stages/reorder', reorderPipelineStages);

// Connection routes (nested under pipeline)
router.get('/:pipelineId/connections', getPipelineConnections);
router.post('/:pipelineId/connections', createPipelineConnection);
router.delete('/:pipelineId/connections/:connectionId', deletePipelineConnection);

export default router;








































































