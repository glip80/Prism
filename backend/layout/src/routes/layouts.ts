import { Router, Request, Response } from 'express';
import { LayoutController } from '../controllers/layoutController';
import { layoutService } from '../services/layoutService';
import { authenticateToken } from '../../../shared/middleware/auth';
import { requirePermission } from '../../../shared/middleware/rbac';
import { Permission } from '../../../shared/constants/permissions';

const layoutController = new LayoutController();
const router = Router();

router.use(authenticateToken as any);

// List all layouts (uses layoutService directly)
router.get('/', requirePermission(Permission.LAYOUT_READ) as any, async (req: Request, res: Response) => {
  try {
    const layouts = await layoutService.getLayouts();
    res.json(layouts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single layout (uses existing controller)
router.get('/:layoutId', requirePermission(Permission.LAYOUT_READ) as any, layoutController.getLayout.bind(layoutController));

// Create layout
router.post('/', requirePermission(Permission.LAYOUT_CREATE) as any, async (req: Request, res: Response) => {
  try {
    const layout = await layoutService.createLayout(req.body);
    res.status(201).json(layout);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update layout (uses existing controller)
router.put('/:layoutId', requirePermission(Permission.LAYOUT_UPDATE) as any, layoutController.updateLayout.bind(layoutController));

// Publish snapshot
router.post('/:layoutId/snapshot', requirePermission(Permission.LAYOUT_PUBLISH) as any, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const layout = await layoutService.publishSnapshot(req.params.layoutId as string, userId);
    res.json(layout);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete layout
router.delete('/:layoutId', requirePermission(Permission.LAYOUT_DELETE) as any, async (req: Request, res: Response) => {
  try {
    const deleted = await layoutService.deleteLayout(req.params.layoutId as string);
    if (!deleted) {
      res.status(404).json({ error: 'Layout not found' });
      return;
    }
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
