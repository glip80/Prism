import { Router } from 'express';
import { widgetController } from '../controllers/widgetController';
import { authenticateToken } from '../../../shared/middleware/auth';
import { requirePermission } from '../../../shared/middleware/rbac';
import { Permission } from '../../../shared/constants/permissions';

const router = Router();

router.use(authenticateToken);

// Execute connector fetches for widget data
router.post('/:widgetId/data', requirePermission(Permission.WIDGET_READ), widgetController.getWidgetData.bind(widgetController));

// Trigger background refresh 
router.post('/:widgetId/refresh', requirePermission(Permission.WIDGET_REFRESH), widgetController.triggerRefresh.bind(widgetController));

export default router;
