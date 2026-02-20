
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { LabOrder } from '../models/LabOrder';
import { LabOrderItem } from '../models/LabOrderItem';
import { LabTest } from '../models/LabTest';

export class LabOrderController {
  // Generate order number
  private static async generateOrderNumber(orgId: string): Promise<string> {
    const labOrderRepo = AppDataSource.getRepository(LabOrder);
    const year = new Date().getFullYear();

    const lastOrder = await labOrderRepo
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :pattern', { pattern: `LAB-${year}-%` })
      .andWhere('order.organizationId = :orgId', { orgId })
      .orderBy('order.createdAt', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `LAB-${year}-${sequence.toString().padStart(4, '0')}`;
  }

  // Create a new lab order (for doctors)
  static createLabOrder = async (req: Request, res: Response) => {
    try {
      const { patientId, tests, clinicalNotes, diagnosis, isUrgent } = req.body;
      const doctorId = (req as any).user.id;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Repositories
      const labOrderRepo = AppDataSource.getRepository(LabOrder);
      const labOrderItemRepo = AppDataSource.getRepository(LabOrderItem);
      const labTestRepo = AppDataSource.getRepository(LabTest);

      // Generate order number
      const orderNumber = await LabOrderController.generateOrderNumber(orgId);

      // Create lab order
      const labOrder = await labOrderRepo.save({
        orderNumber,
        doctorId,
        patientId,
        organizationId: orgId,
        orderDate: new Date(),
        clinicalNotes,
        diagnosis,
        isUrgent: isUrgent || false,
        status: 'ordered'
      });

      // Create order items
      const orderItems = [];
      for (const testId of tests) {
        const test = await labTestRepo.findOne({ where: { id: testId, organization: { id: orgId } } });
        if (test) {
          const item = await labOrderItemRepo.save({
            labOrderId: labOrder.id,
            labTestId: testId,
            status: 'ordered',
            organizationId: orgId
          });
          orderItems.push(item);
        }
      }

      // Fetch complete order with relations
      const completeOrder = await labOrderRepo.findOne({
        where: { id: labOrder.id, organization: { id: orgId } },
        relations: ['doctor', 'patient', 'items', 'items.labTest']
      });

      res.status(201).json(completeOrder);
    } catch (error) {
      console.error('Error creating lab order:', error);
      res.status(500).json({ message: 'Error creating lab order' });
    }
  };

  // Get lab orders by patient
  static getPatientLabOrders = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.query; // Changed from params to query if checking query params based on logs
      const pId = patientId || req.params.patientId; // Handle both

      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);

      const orders = await labOrderRepo.find({
        where: { patient: { id: String(pId) }, organization: { id: orgId } },
        relations: ['doctor', 'patient', 'items', 'items.labTest'], // Removed items.result if it causes issues, assuming standard relations
        order: { createdAt: 'DESC' }
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching patient lab orders:', error);
      res.status(500).json({ message: 'Error fetching patient lab orders' });
    }
  };

  // Get lab orders by doctor
  static getDoctorLabOrders = async (req: Request, res: Response) => {
    try {
      const doctorId = (req as any).user.id;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);

      const orders = await labOrderRepo.find({
        where: { doctor: { id: doctorId }, organization: { id: orgId } },
        relations: ['doctor', 'patient', 'items', 'items.labTest'],
        order: { createdAt: 'DESC' }
      });

      res.json(orders);
    } catch (error) {
      console.error('Error fetching doctor lab orders:', error);
      res.status(500).json({ message: 'Error fetching doctor lab orders' });
    }
  };

  // Get pending lab orders (for lab technicians)
  static getPendingLabOrders = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);

      const orders = await labOrderRepo
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.doctor', 'doctor')
        .leftJoinAndSelect('order.patient', 'patient')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.labTest', 'labTest')
        // .leftJoinAndSelect('items.sample', 'sample') // Commenting out generic relations that might not exist in simple setup
        .where('order.organizationId = :orgId', { orgId })
        .andWhere('order.status IN (:...statuses)', {
          statuses: ['ordered', 'sample_collected', 'in_progress']
        })
        .orderBy('order.isUrgent', 'DESC')
        .addOrderBy('order.createdAt', 'ASC')
        .getMany();

      res.json(orders);
    } catch (error) {
      console.error('Error fetching pending lab orders:', error);
      res.status(500).json({ message: 'Error fetching pending lab orders' });
    }
  };

  // Get all lab orders (admin) - This was the one throwing TypeError
  static getAllLabOrders = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20, status = '', patientId } = req.query; // Added patientId support
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);

      const whereConditions: any = {
        organization: { id: orgId }
      };

      if (status) {
        whereConditions.status = status;
      }

      // Critical Fix: Support filtering by patientId if provided in query
      if (patientId) {
        whereConditions.patient = { id: patientId };
      }

      const [orders, total] = await labOrderRepo.findAndCount({
        where: whereConditions,
        relations: ['doctor', 'patient', 'items', 'items.labTest', 'items.result'],
        order: { createdAt: 'DESC' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      });

      res.json({
        orders, // Return as object property expected by frontend? Or array? 
        // Frontend Service `getLabTests` expects array? 
        // Actually frontend logs show request to `/api/lab/orders?patientId=...`
        // If this returns { orders: [], ... }, frontend `getLabTests` needs to handle it.
        // Service usually returns data directly.
        data: orders, // Adding 'data' alias just in case
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      console.error('Error fetching all lab orders:', error);
      res.status(500).json({ message: 'Error fetching all lab orders' });
    }
  };

  // Get single lab order by ID
  static getLabOrderById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);

      const order = await labOrderRepo.findOne({
        where: { id, organization: { id: orgId } },
        relations: ['doctor', 'patient', 'items', 'items.labTest']
      });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching lab order:', error);
      res.status(500).json({ message: 'Error fetching lab order' });
    }
  };

  // Update lab order status
  static updateLabOrderStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);

      const order = await labOrderRepo.findOne({ where: { id, organization: { id: orgId } } });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      order.status = status;
      const updatedOrder = await labOrderRepo.save(order);

      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating lab order status:', error);
      res.status(500).json({ message: 'Error updating lab order status' });
    }
  };

  // Cancel lab order
  static cancelLabOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = (req as any).user;
      const orgId = (req as any).tenant?.id || user?.organizationId;

      if (!orgId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      const labOrderRepo = AppDataSource.getRepository(LabOrder);
      const labOrderItemRepo = AppDataSource.getRepository(LabOrderItem);

      const order = await labOrderRepo.findOne({
        where: { id, organization: { id: orgId } },
        relations: ['items']
      });

      if (!order) {
        return res.status(404).json({ message: 'Lab order not found' });
      }

      // Update order status
      order.status = 'cancelled';
      await labOrderRepo.save(order);

      // Update all items status
      for (const item of order.items) {
        item.status = 'cancelled';
        if (reason) {
          item.notes = `Cancelled: ${reason}`;
        }
        await labOrderItemRepo.save(item);
      }

      res.json({ message: 'Lab order cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling lab order:', error);
      res.status(500).json({ message: 'Error cancelling lab order' });
    }
  };
}
