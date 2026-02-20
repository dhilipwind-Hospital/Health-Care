/**
 * Symptom Checker Routes
 * 
 * API endpoints for the AI Symptom Chatbot feature.
 * Provides symptom analysis and doctor recommendations.
 * 
 * Created: February 4, 2026
 */

import { Router, Request, Response, NextFunction } from 'express';
import { symptomAnalyzerService, AnalysisResult } from '../services/symptom-analyzer.service';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { UserRole } from '../types/roles';

const router = Router();

/**
 * POST /api/symptom-checker/analyze
 * 
 * Analyze patient symptoms and recommend specialists
 */
router.post('/analyze', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { symptoms, organizationId } = req.body;

        if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide your symptoms'
            });
        }

        // Analyze symptoms using the service
        const analysis: AnalysisResult = symptomAnalyzerService.analyzeSymptoms(symptoms);

        // Try to find matching doctors from the organization
        let suggestedDoctors: any[] = [];

        if (organizationId && AppDataSource.isInitialized) {
            try {
                const userRepo = AppDataSource.getRepository(User);
                const deptRepo = AppDataSource.getRepository(Department);

                // Find the recommended department
                const department = await deptRepo
                    .createQueryBuilder('dept')
                    .where('LOWER(dept.name) LIKE :name', {
                        name: `%${analysis.recommendedDepartment.toLowerCase()}%`
                    })
                    .andWhere('dept.organizationId = :orgId', { orgId: organizationId })
                    .andWhere('dept.status = :status', { status: 'active' })
                    .getOne();

                if (department) {
                    // Find doctors in this department
                    const doctors = await userRepo
                        .createQueryBuilder('user')
                        .leftJoinAndSelect('user.department', 'department')
                        .where('user.role = :role', { role: UserRole.DOCTOR })
                        .andWhere('user.departmentId = :deptId', { deptId: department.id })
                        .andWhere('user.organizationId = :orgId', { orgId: organizationId })
                        .andWhere('user.isActive = :active', { active: true })
                        .select([
                            'user.id',
                            'user.firstName',
                            'user.lastName',
                            'user.specialization',
                            'user.qualification',
                            'user.experience',
                            'user.consultationFee',
                            'user.profileImage',
                            'user.availableFrom',
                            'user.availableTo',
                            'user.workingDays',
                            'department.id',
                            'department.name'
                        ])
                        .orderBy('user.experience', 'DESC')
                        .take(5)
                        .getMany();

                    suggestedDoctors = doctors.map(doc => ({
                        id: doc.id,
                        name: `Dr. ${doc.firstName} ${doc.lastName}`,
                        specialization: doc.specialization || analysis.doctorTypes[0],
                        qualification: doc.qualification,
                        experience: doc.experience,
                        consultationFee: doc.consultationFee,
                        profileImage: doc.profileImage,
                        department: doc.department?.name || analysis.recommendedDepartment,
                        availableFrom: doc.availableFrom,
                        availableTo: doc.availableTo,
                        workingDays: doc.workingDays
                    }));
                }
            } catch (dbError) {
                console.warn('Could not fetch doctors:', dbError);
                // Continue without doctor suggestions
            }
        }

        // Log the interaction for audit (optional)
        console.log(`[Symptom Checker] Analyzed: "${symptoms}" -> ${analysis.recommendedDepartment}`);

        return res.json({
            success: true,
            analysis: {
                ...analysis,
                suggestedDoctors
            }
        });

    } catch (error) {
        console.error('Symptom analysis error:', error);
        next(error);
    }
});

/**
 * GET /api/symptom-checker/departments
 * 
 * Get all departments that the symptom checker can recommend
 */
router.get('/departments', async (_req: Request, res: Response) => {
    try {
        const departments = symptomAnalyzerService.getAllDepartments();

        return res.json({
            success: true,
            departments
        });
    } catch (error) {
        console.error('Get departments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve departments'
        });
    }
});

/**
 * GET /api/symptom-checker/doctors/:department
 * 
 * Get doctors in a specific department for the current organization
 */
router.get('/doctors/:department', async (req: Request, res: Response) => {
    try {
        const { department } = req.params;
        const organizationId = req.query.organizationId as string;

        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Department name is required'
            });
        }

        let doctors: any[] = [];

        if (AppDataSource.isInitialized) {
            const userRepo = AppDataSource.getRepository(User);
            const deptRepo = AppDataSource.getRepository(Department);

            // Build query for departments
            let deptQuery = deptRepo
                .createQueryBuilder('dept')
                .where('LOWER(dept.name) LIKE :name', {
                    name: `%${department.toLowerCase()}%`
                });

            // Filter by organization if provided
            if (organizationId) {
                deptQuery = deptQuery.andWhere('dept.organizationId = :orgId', { orgId: organizationId });
            }

            const matchingDepts = await deptQuery.getMany();

            if (matchingDepts.length > 0) {
                const deptIds = matchingDepts.map(d => d.id);

                // Find doctors in these departments
                let doctorQuery = userRepo
                    .createQueryBuilder('user')
                    .leftJoinAndSelect('user.department', 'department')
                    .where('user.role = :role', { role: UserRole.DOCTOR })
                    .andWhere('user.departmentId IN (:...deptIds)', { deptIds })
                    .andWhere('user.isActive = :active', { active: true });

                if (organizationId) {
                    doctorQuery = doctorQuery.andWhere('user.organizationId = :orgId', { orgId: organizationId });
                }

                doctors = await doctorQuery
                    .select([
                        'user.id',
                        'user.firstName',
                        'user.lastName',
                        'user.specialization',
                        'user.qualification',
                        'user.experience',
                        'user.consultationFee',
                        'user.profileImage',
                        'user.availableFrom',
                        'user.availableTo',
                        'user.workingDays',
                        'department.id',
                        'department.name'
                    ])
                    .orderBy('user.experience', 'DESC')
                    .getMany();
            }
        }

        return res.json({
            success: true,
            department,
            doctors: doctors.map(doc => ({
                id: doc.id,
                firstName: doc.firstName,
                lastName: doc.lastName,
                name: `Dr. ${doc.firstName} ${doc.lastName}`,
                specialization: doc.specialization,
                qualification: doc.qualification,
                experience: doc.experience,
                consultationFee: doc.consultationFee,
                profileImage: doc.profileImage,
                department: doc.department,
                availableFrom: doc.availableFrom,
                availableTo: doc.availableTo,
                workingDays: doc.workingDays
            })),
            count: doctors.length
        });

    } catch (error) {
        console.error('Get doctors by department error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve doctors'
        });
    }
});

/**
 * GET /api/symptom-checker/examples/:department
 * 
 * Get example symptoms for a specific department
 */
router.get('/examples/:department', async (req: Request, res: Response) => {
    try {
        const { department } = req.params;
        const examples = symptomAnalyzerService.getExamplesForDepartment(department);

        return res.json({
            success: true,
            department,
            examples
        });
    } catch (error) {
        console.error('Get examples error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve examples'
        });
    }
});

/**
 * POST /api/symptom-checker/chat
 * 
 * Chat-style endpoint for conversation flow
 */
router.post('/chat', async (req: Request, res: Response) => {
    try {
        const { message, sessionId, conversationHistory } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Please provide a message'
            });
        }

        const text = message.toLowerCase().trim();

        // Greeting responses
        if (/^(hi|hello|hey|good morning|good afternoon|good evening)/.test(text)) {
            return res.json({
                success: true,
                reply: "Hello! I'm your AI Health Assistant. I can help you understand your symptoms and recommend the right specialist. Please describe what symptoms you're experiencing.",
                suggestions: [
                    { label: 'I have shoulder pain', action: 'symptom' },
                    { label: 'I have headache', action: 'symptom' },
                    { label: 'I need a general checkup', action: 'symptom' }
                ],
                sessionId
            });
        }

        // Thank you responses
        if (/^(thank|thanks|thank you)/.test(text)) {
            return res.json({
                success: true,
                reply: "You're welcome! Take care of your health. If you have any more symptoms or questions, feel free to ask anytime.",
                sessionId
            });
        }

        // Bye responses
        if (/^(bye|goodbye|see you)/.test(text)) {
            return res.json({
                success: true,
                reply: "Goodbye! Remember, if your symptoms worsen or you feel unwell, please seek medical attention immediately. Stay healthy!",
                sessionId
            });
        }

        // Analyze as symptoms
        const analysis = symptomAnalyzerService.analyzeSymptoms(message);

        let reply = '';
        if (analysis.isEmergency) {
            reply = `🚨 **EMERGENCY ALERT**\n\n${analysis.emergencyMessage}\n\n${analysis.disclaimer}`;
        } else {
            reply = `Based on your symptoms, I recommend consulting a **${analysis.doctorTypes[0]}** from the **${analysis.recommendedDepartment}** department.\n\n**Why this recommendation:**\n${analysis.reasoning}\n\n`;

            if (analysis.followUpQuestions.length > 0) {
                reply += `**To help the doctor better, consider:**\n${analysis.followUpQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n`;
            }

            reply += `⚠️ *${analysis.disclaimer}*`;
        }

        return res.json({
            success: true,
            reply,
            analysis: {
                department: analysis.recommendedDepartment,
                doctorTypes: analysis.doctorTypes,
                urgencyLevel: analysis.urgencyLevel,
                isEmergency: analysis.isEmergency
            },
            suggestions: [
                { label: '📅 Book Appointment', action: 'book', department: analysis.recommendedDepartment },
                { label: '👨‍⚕️ View Doctors', action: 'doctors', department: analysis.recommendedDepartment },
                { label: '💬 Describe more symptoms', action: 'continue' }
            ],
            sessionId
        });

    } catch (error) {
        console.error('Chat error:', error);
        return res.json({
            success: true,
            reply: "I'm sorry, I couldn't process that. Could you please describe your symptoms in a different way?",
            sessionId: req.body.sessionId
        });
    }
});

export default router;
