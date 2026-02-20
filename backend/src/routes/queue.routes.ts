import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { QueueItem } from '../models/QueueItem';
import { Appointment } from '../models/Appointment';

const router = Router();
router.use(authenticate as any);
router.use(tenantContext as any);

const enabled = () => String(process.env.ENABLE_QUEUE || 'false').toLowerCase() === 'true';
const tvEnabled = () => String(process.env.ENABLE_TV_DISPLAY || process.env.ENABLE_QUEUE || 'false').toLowerCase() === 'true';

// GET /api/queue?stage=triage|doctor&doctorId=
router.get('/', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organizationId;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const stage = String(req.query.stage || '').toLowerCase();
    const doctorId = String(req.query.doctorId || '') || undefined;
    if (!stage) return res.status(400).json({ message: 'stage is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    const history = String(req.query.history || '') === 'true';
    const qb = repo.createQueryBuilder('q')
      .where('q.organizationId = :orgId', { orgId })
      .andWhere('q.stage = :stage', { stage });

    if (history) {
      qb.andWhere('q.status IN (:...st)', { st: ['served', 'skipped'] })
        .orderBy('q.updatedAt', 'DESC')
        .take(50);
    } else {
      qb.andWhere('q.status IN (:...st)', { st: ['waiting', 'called'] })
        .orderBy('q.priority = :emergency', 'DESC')
        .addOrderBy('q.priority = :urgent', 'DESC')
        .addOrderBy('q.createdAt', 'ASC');
    }
    qb.setParameters({ emergency: 'emergency', urgent: 'urgent' });
    // Join visit and patient to expose patient name for UI
    qb.leftJoinAndSelect('q.visit', 'v')
      .leftJoinAndSelect('v.patient', 'p');
    if (stage === 'doctor' && doctorId) {
      qb.andWhere('(q.assignedDoctorId IS NULL OR q.assignedDoctorId = :doc)', { doc: doctorId });
    }
    const items = await qb.getMany();

    // Attach appointment info
    const visitIds = items.map(i => i.visitId).filter(Boolean);
    if (visitIds.length > 0) {
      const apptRepo = AppDataSource.getRepository(Appointment);
      const appts = await apptRepo.createQueryBuilder('a')
        .where('a.visitId IN (:...ids)', { ids: visitIds })
        .getMany();
      items.forEach((item: any) => {
        const appt = appts.find((a: any) => a.visitId === item.visitId);
        if (appt) item.appointment = appt;
      });
    }

    return res.json({ success: true, data: items });
  } catch (e) {
    console.error('GET /api/queue error:', e);
    return res.status(500).json({ message: 'Failed to fetch queue' });
  }
});

// POST /api/queue/call-next?stage=triage|doctor&doctorId=
router.post('/call-next', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organizationId;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const stage = String(req.query.stage || '').toLowerCase();
    const doctorId = String(req.query.doctorId || '') || undefined;
    if (!stage) return res.status(400).json({ message: 'stage is required' });

    console.log('[Queue] call-next start', { orgId, stage, doctorId });
    const result = await AppDataSource.transaction(async (manager) => {
      const repo = manager.getRepository(QueueItem);
      // 1) Pick next waiting id (ordered by priority then created_at)
      const next = await repo.createQueryBuilder('q')
        .select(['q.id'])
        .where('q.organizationId = :orgId', { orgId })
        .andWhere('q.stage = :stage', { stage })
        .andWhere('q.status = :waiting', { waiting: 'waiting' })
        .orderBy('q.priority = :emergency', 'DESC')
        .addOrderBy('q.priority = :urgent', 'DESC')
        .addOrderBy('q.createdAt', 'ASC')
        .setParameters({ emergency: 'emergency', urgent: 'urgent' })
        .getOne();

      if (!next) return null;
      console.log('[Queue] call-next picked', { id: (next as any).id });

      // 2) Atomic conditional update to transition waiting -> called
      const payload: any = { status: 'called' };
      if (stage === 'doctor' && doctorId) payload.assignedDoctorId = doctorId;

      const upd = await manager.createQueryBuilder()
        .update(QueueItem)
        .set(payload)
        .where('id = :id', { id: (next as any).id })
        .andWhere('organizationId = :orgId', { orgId })
        .andWhere('stage = :stage', { stage })
        .andWhere('status = :waiting', { waiting: 'waiting' })
        .returning('*')
        .execute();

      const row = (upd.raw && upd.raw[0]) || null;
      if (!row) return null;
      console.log('[Queue] call-next updated', { id: row.id, status: row.status });

      // Use the ID from the raw row to fetch the clean entity (handles property mapping)
      const entityId = row.id;
      const entity = await repo.findOne({ where: { id: entityId } });

      if (entity) {
        // Attach appointment if exists
        const apptRepo = manager.getRepository(Appointment);
        const appt = await apptRepo.findOne({ where: { visitId: entity.visitId } });
        if (appt) (entity as any).appointment = appt;
      }

      return entity as any;
    });

    if (!result) return res.json({ success: true, data: null, message: 'No items' });
    return res.json({ success: true, data: result });
  } catch (e) {
    console.error('POST /api/queue/call-next error:', (e as any)?.message || e);
    return res.status(500).json({ message: 'Failed to call next' });
  }
});

// POST /api/queue/:id/serve -> mark queue item served
router.post('/:id/serve', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organizationId;
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    const item = await repo.findOne({ where: { id } });
    if (!item || (item as any).organizationId !== orgId) return res.status(404).json({ message: 'Queue item not found' });
    (item as any).status = 'served';
    await repo.save(item);
    return res.json({ success: true, data: item });
  } catch (e) {
    console.error('POST /api/queue/:id/serve error:', e);
    return res.status(500).json({ message: 'Failed to mark served' });
  }
});

// POST /api/queue/:id/skip -> mark queue item skipped
router.post('/:id/skip', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organizationId;
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    const item = await repo.findOne({ where: { id } });
    if (!item || (item as any).organizationId !== orgId) return res.status(404).json({ message: 'Queue item not found' });
    (item as any).status = 'skipped';
    await repo.save(item);
    return res.json({ success: true, data: item });
  } catch (e) {
    console.error('POST /api/queue/:id/skip error:', e);
    return res.status(500).json({ message: 'Failed to mark skipped' });
  }
});

// GET /api/queue/board?stage=triage|doctor (for TV display)
router.get('/board', async (req, res) => {
  try {
    if (!tvEnabled()) return res.status(404).json({ message: 'TV display disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organizationId;
    const stage = String(req.query.stage || '').toLowerCase();
    if (!stage) return res.status(400).json({ message: 'stage is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    const items = await repo.createQueryBuilder('q')
      .where('q.organizationId = :orgId', { orgId })
      .andWhere('q.stage = :stage', { stage })
      .andWhere('q.status IN (:...st)', { st: ['waiting', 'called'] })
      .orderBy('q.priority = :emergency', 'DESC')
      .addOrderBy('q.priority = :urgent', 'DESC')
      .addOrderBy('q.createdAt', 'ASC')
      .setParameters({ emergency: 'emergency', urgent: 'urgent' })
      .getMany();
    return res.json({ success: true, data: items });
  } catch (e) {
    console.error('GET /api/queue/board error:', e);
    return res.status(500).json({ message: 'Failed to fetch queue board' });
  }
});

// POST /api/queue/:id/call -> mark queue item as called (explicit selection)
router.post('/:id/call', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Queue module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organizationId;
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id is required' });
    const repo = AppDataSource.getRepository(QueueItem);
    // Update atomically and return row
    const upd = await AppDataSource.createQueryBuilder()
      .update(QueueItem)
      .set({ status: 'called' } as any)
      .where('id = :id', { id })
      .andWhere('organizationId = :orgId', { orgId })
      .returning('*')
      .execute();

    const row = (upd.raw && upd.raw[0]) || null;
    if (!row) return res.status(404).json({ message: 'Queue item not found' });

    // Fetch the entity properly to ensure decorators and camelCase are applied
    const entity = await repo.findOne({ where: { id: row.id } });
    return res.json({ success: true, data: entity });
  } catch (e) {
    console.error('POST /api/queue/:id/call error:', e);
    return res.status(500).json({ message: 'Failed to mark called' });
  }
});

export default router;
