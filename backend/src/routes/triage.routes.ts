import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { Triage } from '../models/Triage';
import { Visit } from '../models/Visit';
import { QueueItem, QueueStage, QueuePriority, QueueStatus } from '../models/QueueItem';
import { VisitCounter } from '../models/VisitCounter';

const router = Router();
router.use(authenticate as any);
router.use(tenantContext as any);

const enabled = () => String(process.env.ENABLE_TRIAGE || 'false').toLowerCase() === 'true';

const yyyymmdd = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
};

const toOrgCode = (sub?: string) => String(sub || 'ORG').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

const nextTokenNumber = async (organizationId: string, subdomain?: string) => {
  const today = yyyymmdd();
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(VisitCounter);
    let counter = await repo.findOne({
      where: { organizationId, dateKey: today },
      lock: { mode: 'pessimistic_write' },
    });
    if (!counter) {
      counter = repo.create({ organizationId, dateKey: today, nextVisitSeq: 1, nextTokenSeq: 1 });
    }
    const tokenSeq = counter.nextTokenSeq;
    counter.nextTokenSeq = tokenSeq + 1;
    await repo.save(counter);
    const orgCode = toOrgCode(subdomain);
    return `T-${orgCode}-${today.slice(2)}-${String(tokenSeq).padStart(4, '0')}`;
  });
};

// Upsert triage by visit + advance to doctor queue
router.patch('/:visitId', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Triage module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organizationId;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const { visitId } = req.params;
    const { vitals, symptoms, allergies, currentMeds, painScale, priority, notes, advanceToDoctor } = req.body || {};
    if (!visitId) return res.status(400).json({ message: 'visitId is required' });
    const repo = AppDataSource.getRepository(Triage);
    let t = await repo.findOne({ where: { visitId, organizationId: orgId } });
    if (!t) {
      t = repo.create({ visitId, organizationId: orgId });
    }
    (t as any).vitals = vitals ?? (t as any).vitals;
    (t as any).symptoms = symptoms ?? (t as any).symptoms;
    (t as any).allergies = allergies ?? (t as any).allergies;
    (t as any).currentMeds = currentMeds ?? (t as any).currentMeds;
    (t as any).painScale = painScale ?? (t as any).painScale;
    (t as any).priority = priority ?? (t as any).priority;
    (t as any).notes = notes ?? (t as any).notes;
    await repo.save(t);

    // Advance visit to doctor stage and create doctor queue item (non-blocking)
    let doctorQueueItem: any = null;
    if (advanceToDoctor !== false) {
      try {
        // Update visit status
        const visitRepo = AppDataSource.getRepository(Visit);
        const visit = await visitRepo.findOne({ where: { id: visitId, organizationId: orgId } });
        if (visit) {
          visit.status = 'with_doctor' as any;
          await visitRepo.save(visit);
        }

        // Mark triage queue item as served
        const qRepo = AppDataSource.getRepository(QueueItem);
        const triageQI = await qRepo.findOne({
          where: { visitId, stage: 'triage' as QueueStage, organizationId: orgId, status: 'called' as QueueStatus },
        });
        if (triageQI) {
          triageQI.status = 'served' as QueueStatus;
          await qRepo.save(triageQI);
        }

        // Create doctor queue item with triage priority
        const triagePriority = priority || (t as any).priority || 'standard';
        const priorityMap: Record<string, QueuePriority> = {
          critical: 'emergency' as QueuePriority,
          urgent: 'urgent' as QueuePriority,
          high: 'urgent' as QueuePriority,
          normal: 'standard' as QueuePriority,
          standard: 'standard' as QueuePriority,
          low: 'standard' as QueuePriority,
        };
        const queuePriority = priorityMap[String(triagePriority).toLowerCase()] || 'standard' as QueuePriority;

        const tokenNumber = await nextTokenNumber(orgId, tenant?.subdomain);
        const doctorQI = qRepo.create({
          organizationId: orgId,
          visitId,
          stage: 'doctor' as QueueStage,
          priority: queuePriority,
          tokenNumber,
          status: 'waiting' as QueueStatus,
        });
        doctorQueueItem = await qRepo.save(doctorQI);
      } catch (advErr) {
        console.error('Triage advance to doctor failed (non-blocking):', advErr);
      }
    }

    return res.json({ success: true, data: t, ...(doctorQueueItem && { doctorQueueItem }) });
  } catch (e) {
    console.error('PATCH /api/triage/:visitId error:', e);
    return res.status(500).json({ message: 'Failed to save triage' });
  }
});

// Get triage by visit
router.get('/:visitId', async (req, res) => {
  try {
    if (!enabled()) return res.status(404).json({ message: 'Triage module disabled' });
    const tenant = (req as any).tenant;
    const orgId: string = tenant?.id || (req as any).user?.organizationId;
    if (!orgId) return res.status(409).json({ code: 'ORG_REQUIRED', message: 'Please select a hospital to continue' });
    const { visitId } = req.params;
    const repo = AppDataSource.getRepository(Triage);
    const t = await repo.findOne({ where: { visitId, organizationId: orgId } });
    return res.json({ success: true, data: t || null });
  } catch (e) {
    console.error('GET /api/triage/:visitId error:', e);
    return res.status(500).json({ message: 'Failed to get triage' });
  }
});

export default router;
