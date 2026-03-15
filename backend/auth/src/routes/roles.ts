import { Router } from 'express';
import { roleService } from '../services/roleService';
import { authenticateToken } from '../../../shared/middleware/auth';
import { requirePermission } from '../../../shared/middleware/rbac';
import { Permission } from '../../../shared/constants/permissions';

const router = Router();

router.use(authenticateToken);
router.use(requirePermission(Permission.USER_MANAGE_ROLES));

router.post('/', async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await roleService.createRole(name, description, permissions || []);
    res.status(201).json(role);
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    res.json(await roleService.getAllRoles());
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await roleService.getRoleById(req.params.id);
    if (!r) { res.status(404).json({ error: 'Role not found' }); return; }
    res.json(r);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    res.json(await roleService.updateRole(req.params.id, req.body));
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await roleService.deleteRole(req.params.id);
    res.status(204).send();
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

export default router;
