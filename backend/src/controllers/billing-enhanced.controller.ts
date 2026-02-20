import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { BillingPackage } from '../models/BillingPackage';
import { Deposit } from '../models/Deposit';
import { Bill } from '../models/Bill';

export class BillingEnhancedController {

  // ===== PACKAGES =====
  static listPackages = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BillingPackage);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const category = req.query.category as string;
      const where: any = { isActive: true };
      if (orgId) where.organizationId = orgId;
      if (category) where.category = category;

      const data = await repo.find({ where, order: { name: 'ASC' } });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createPackage = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BillingPackage);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const pkg = new BillingPackage();
      Object.assign(pkg, req.body);
      pkg.organizationId = orgId;
      const saved = await repo.save(pkg);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updatePackage = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BillingPackage);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const pkgW: any = { id: req.params.id };
      if (orgId) pkgW.organizationId = orgId;
      const pkg = await repo.findOne({ where: pkgW });
      if (!pkg) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(pkg, req.body);
      const saved = await repo.save(pkg);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== DEPOSITS =====
  static listDeposits = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Deposit);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const status = req.query.status as string;
      const patientId = req.query.patientId as string;

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (status) where.status = status;
      if (patientId) where.patientId = patientId;

      const [data, total] = await repo.findAndCount({
        where,
        relations: ['patient', 'receivedByUser'],
        order: { receivedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static receiveDeposit = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Deposit);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const depCW: any = {};
      if (orgId) depCW.organizationId = orgId;
      const count = await repo.count({ where: depCW });
      const year = new Date().getFullYear();
      const receiptNumber = `DEP-${year}-${String(count + 1).padStart(4, '0')}`;

      const deposit = new Deposit();
      Object.assign(deposit, req.body);
      deposit.organizationId = orgId;
      deposit.receiptNumber = receiptNumber;
      deposit.receivedBy = (req as any).user?.id;
      deposit.receivedAt = new Date();

      const saved = await repo.save(deposit);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static adjustDeposit = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Deposit);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const dw1: any = { id: req.params.id };
      if (orgId) dw1.organizationId = orgId;
      const deposit = await repo.findOne({ where: dw1 });
      if (!deposit) return res.status(404).json({ success: false, message: 'Not found' });

      const adjustAmount = parseFloat(req.body.amount);
      if (adjustAmount > (deposit.amount - deposit.adjustedAmount - deposit.refundedAmount)) {
        return res.status(400).json({ success: false, message: 'Adjustment amount exceeds available balance' });
      }

      deposit.adjustedAmount = Number(deposit.adjustedAmount) + adjustAmount;
      deposit.adjustedToBillId = req.body.billId;
      if (deposit.adjustedAmount >= deposit.amount) {
        deposit.status = 'adjusted' as any;
      }

      const saved = await repo.save(deposit);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static refundDeposit = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Deposit);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const dw2: any = { id: req.params.id };
      if (orgId) dw2.organizationId = orgId;
      const deposit = await repo.findOne({ where: dw2 });
      if (!deposit) return res.status(404).json({ success: false, message: 'Not found' });

      const refundAmount = parseFloat(req.body.amount);
      const available = deposit.amount - Number(deposit.adjustedAmount) - Number(deposit.refundedAmount);
      if (refundAmount > available) {
        return res.status(400).json({ success: false, message: 'Refund amount exceeds available balance' });
      }

      deposit.refundedAmount = Number(deposit.refundedAmount) + refundAmount;
      deposit.refundDate = new Date() as any;
      deposit.refundReason = req.body.reason;
      deposit.refundApprovedBy = (req as any).user?.id;

      if (Number(deposit.adjustedAmount) + Number(deposit.refundedAmount) >= deposit.amount) {
        deposit.status = 'refunded' as any;
      } else {
        deposit.status = 'partially_refunded' as any;
      }

      const saved = await repo.save(deposit);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== ENHANCED BILL OPERATIONS =====
  static applyDiscount = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Bill);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const bw1: any = { id: req.params.id };
      if (orgId) bw1.organizationId = orgId;
      const bill = await repo.findOne({ where: bw1 });
      if (!bill) return res.status(404).json({ success: false, message: 'Not found' });

      bill.discountAmount = req.body.amount || 0;
      bill.discountPercent = req.body.percent;
      bill.discountReason = req.body.reason;
      bill.discountApprovedBy = (req as any).user?.id;

      // Recalculate balance
      const grandTotal = Number(bill.grandTotal || bill.amount);
      bill.balanceDue = grandTotal - Number(bill.paidAmount) - Number(bill.depositAmount || 0) - Number(bill.discountAmount) - Number(bill.waiverAmount || 0);

      const saved = await repo.save(bill);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static applyWaiver = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Bill);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const bw2: any = { id: req.params.id };
      if (orgId) bw2.organizationId = orgId;
      const bill = await repo.findOne({ where: bw2 });
      if (!bill) return res.status(404).json({ success: false, message: 'Not found' });

      bill.waiverAmount = req.body.amount || 0;
      bill.waiverReason = req.body.reason;
      bill.waiverApprovedBy = (req as any).user?.id;

      const grandTotal = Number(bill.grandTotal || bill.amount);
      bill.balanceDue = grandTotal - Number(bill.paidAmount) - Number(bill.depositAmount || 0) - Number(bill.discountAmount || 0) - Number(bill.waiverAmount);

      const saved = await repo.save(bill);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static recordPayment = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Bill);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const bw3: any = { id: req.params.id };
      if (orgId) bw3.organizationId = orgId;
      const bill = await repo.findOne({ where: bw3 });
      if (!bill) return res.status(404).json({ success: false, message: 'Not found' });

      const payAmount = parseFloat(req.body.amount);
      bill.paidAmount = Number(bill.paidAmount) + payAmount;
      bill.paymentMethod = req.body.paymentMethod;
      if (req.body.transactionId) bill.transactionId = req.body.transactionId;
      if (req.body.paymentGateway) bill.paymentGateway = req.body.paymentGateway;

      const grandTotal = Number(bill.grandTotal || bill.amount);
      const totalPaid = Number(bill.paidAmount) + Number(bill.depositAmount || 0) + Number(bill.discountAmount || 0) + Number(bill.waiverAmount || 0);
      bill.balanceDue = grandTotal - totalPaid;

      if (bill.balanceDue <= 0) {
        bill.status = 'paid' as any;
        bill.paidDate = new Date() as any;
      } else if (Number(bill.paidAmount) > 0) {
        bill.status = 'partially_paid' as any;
      }

      const saved = await repo.save(bill);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static processRefund = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Bill);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const bw4: any = { id: req.params.id };
      if (orgId) bw4.organizationId = orgId;
      const bill = await repo.findOne({ where: bw4 });
      if (!bill) return res.status(404).json({ success: false, message: 'Not found' });

      bill.refundAmount = req.body.amount;
      bill.refundDate = new Date() as any;
      bill.refundReason = req.body.reason;
      bill.status = 'refunded' as any;

      const saved = await repo.save(bill);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== GST REPORTS =====
  static gstSummary = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Bill);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const qb = repo.createQueryBuilder('b')
        .select('SUM(b.subtotal)', 'totalSubtotal')
        .addSelect('SUM(b.cgstAmount)', 'totalCGST')
        .addSelect('SUM(b.sgstAmount)', 'totalSGST')
        .addSelect('SUM(b.igstAmount)', 'totalIGST')
        .addSelect('SUM(b.totalTax)', 'totalTax')
        .addSelect('SUM(b.grandTotal)', 'totalGrand')
        .addSelect('COUNT(*)', 'invoiceCount');
      if (orgId) qb.where('b.organization_id = :orgId', { orgId });
      qb.andWhere('b.status != :cancelled', { cancelled: 'cancelled' });

      if (startDate) qb.andWhere('b.billDate >= :startDate', { startDate });
      if (endDate) qb.andWhere('b.billDate <= :endDate', { endDate });

      const summary = await qb.getRawOne();
      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static revenueReport = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Bill);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const groupBy = req.query.groupBy as string || 'date';

      let selectField = 'DATE(b.billDate)';
      if (groupBy === 'type') selectField = 'b.billType';
      else if (groupBy === 'method') selectField = 'b.paymentMethod';

      const rvQb = repo.createQueryBuilder('b')
        .select(selectField, 'group')
        .addSelect('SUM(b.amount)', 'totalAmount')
        .addSelect('SUM(b.paidAmount)', 'totalPaid')
        .addSelect('COUNT(*)', 'count');
      if (orgId) rvQb.where('b.organization_id = :orgId', { orgId });
      const data = await rvQb
        .andWhere('b.status != :cancelled', { cancelled: 'cancelled' })
        .groupBy(selectField)
        .orderBy(selectField, 'DESC')
        .limit(100)
        .getRawMany();

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static outstandingReport = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Bill);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const outWhere = orgId ? [
          { organizationId: orgId, status: 'pending' as any },
          { organizationId: orgId, status: 'overdue' as any },
          { organizationId: orgId, status: 'partially_paid' as any },
          { organizationId: orgId, status: 'credit' as any },
        ] : [
          { status: 'pending' as any },
          { status: 'overdue' as any },
          { status: 'partially_paid' as any },
          { status: 'credit' as any },
        ];
      const data = await repo.find({
        where: outWhere,
        relations: ['patient'],
        order: { billDate: 'ASC' },
      });

      const totalOutstanding = data.reduce((sum, b) => sum + Number(b.amount) - Number(b.paidAmount), 0);

      res.json({ success: true, data, meta: { totalOutstanding, count: data.length } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
