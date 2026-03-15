import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken } from '../../../shared/middleware/auth';
import { requirePermission } from '../../../shared/middleware/rbac';
import { Permission } from '../../../shared/constants/permissions';

const router = Router();

router.use(authenticateToken); // Protect all user routes

router.post('/', requirePermission(Permission.USER_CREATE), userController.createUser.bind(userController));
router.get('/', requirePermission(Permission.USER_READ), userController.getAllUsers.bind(userController));
router.get('/:id', requirePermission(Permission.USER_READ), userController.getUser.bind(userController));
router.put('/:id', requirePermission(Permission.USER_UPDATE), userController.updateUser.bind(userController));
router.delete('/:id', requirePermission(Permission.USER_DELETE), userController.deleteUser.bind(userController));

export default router;
