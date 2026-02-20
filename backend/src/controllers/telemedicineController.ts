import { Request, Response } from 'express';
import TelemedicineSession from '../models/TelemedicineSession';
import { AppDataSource } from '../config/database';
import { Like, FindOptionsWhere } from 'typeorm';

export const createTelemedicineSession = async (req: Request, res: Response) => {
  try {
    const {
      patientName,
      doctorName,
      appointmentDate,
      appointmentTime,
      duration,
      sessionType,
      reason,
      patientId,
      doctorId,
      followUpRequired,
      recordingAvailable,
    } = req.body;

    // Validation
    if (!patientName || !doctorName || !appointmentDate || !appointmentTime || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: patientName, doctorName, appointmentDate, appointmentTime, reason',
      });
    }

    const repo = AppDataSource.getRepository(TelemedicineSession);

    const session = repo.create({
      patientId: patientId || Date.now().toString(),
      patientName,
      doctorId: doctorId || Date.now().toString(),
      doctorName,
      appointmentDate,
      appointmentTime,
      duration: duration || 30,
      sessionType: sessionType || 'Video',
      reason,
      status: 'Scheduled',
      followUpRequired: followUpRequired || false,
      recordingAvailable: recordingAvailable || false,
      sessionId: `TM-${Date.now()}-${Math.floor(Math.random() * 1000)}` // Ensure session ID is generated if not handled by BeforeInsert
    });

    await repo.save(session);

    res.status(201).json({
      success: true,
      message: 'Telemedicine session created successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error creating telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create telemedicine session',
      error: error.message,
    });
  }
};

export const getAllTelemedicineSessions = async (req: Request, res: Response) => {
  try {
    const { status, date, doctorName, patientName } = req.query;

    const whereClause: FindOptionsWhere<TelemedicineSession> = {};

    if (status) {
      whereClause.status = status as any;
    }

    if (date) {
      whereClause.appointmentDate = date as string;
    }

    if (doctorName) {
      whereClause.doctorName = Like(`%${doctorName}%`);
    }

    if (patientName) {
      whereClause.patientName = Like(`%${patientName}%`);
    }

    const repo = AppDataSource.getRepository(TelemedicineSession);
    const sessions = await repo.find({
      where: whereClause,
      order: {
        appointmentDate: 'DESC',
        appointmentTime: 'DESC'
      }
    });

    res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    console.error('Error fetching telemedicine sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine sessions',
      error: error.message,
    });
  }
};

export const getTelemedicineSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(TelemedicineSession);
    const session = await repo.findOneBy({ id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Error fetching telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine session',
      error: error.message,
    });
  }
};

export const updateTelemedicineSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const repo = AppDataSource.getRepository(TelemedicineSession);

    const session = await repo.findOneBy({ id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    repo.merge(session, updates);
    await repo.save(session);

    res.status(200).json({
      success: true,
      message: 'Telemedicine session updated successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error updating telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update telemedicine session',
      error: error.message,
    });
  }
};

export const deleteTelemedicineSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(TelemedicineSession);
    const session = await repo.findOneBy({ id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    await repo.remove(session);

    res.status(200).json({
      success: true,
      message: 'Telemedicine session deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting telemedicine session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete telemedicine session',
      error: error.message,
    });
  }
};

export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const repo = AppDataSource.getRepository(TelemedicineSession);
    const session = await repo.findOneBy({ id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    session.status = status;
    await repo.save(session);

    res.status(200).json({
      success: true,
      message: 'Session status updated successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error updating session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session status',
      error: error.message,
    });
  }
};

export const addSessionNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, prescriptions } = req.body;

    const repo = AppDataSource.getRepository(TelemedicineSession);
    const session = await repo.findOneBy({ id });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
      });
    }

    if (notes) session.notes = notes;
    if (prescriptions) session.prescriptions = prescriptions;

    await repo.save(session);

    res.status(200).json({
      success: true,
      message: 'Session notes added successfully',
      data: session,
    });
  } catch (error: any) {
    console.error('Error adding session notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add session notes',
      error: error.message,
    });
  }
};
