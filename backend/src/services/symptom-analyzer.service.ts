/**
 * Symptom Analyzer Service
 * 
 * Analyzes patient symptoms and recommends appropriate specialists.
 * This is a rule-based system that can be upgraded to ML in the future.
 * 
 * Created: February 4, 2026
 */

export interface SymptomMapping {
    keywords: RegExp;
    department: string;
    doctorTypes: string[];
    reasoning: string;
    urgencyLevel: 'normal' | 'moderate' | 'urgent' | 'emergency';
    followUpQuestions: string[];
}

export interface AnalysisResult {
    detectedSymptoms: string[];
    recommendedDepartment: string;
    doctorTypes: string[];
    reasoning: string;
    urgencyLevel: 'normal' | 'moderate' | 'urgent' | 'emergency';
    followUpQuestions: string[];
    isEmergency: boolean;
    emergencyMessage?: string;
    disclaimer: string;
}

// Emergency keywords that should trigger immediate medical attention
const EMERGENCY_KEYWORDS = /\b(severe chest pain|can't breathe|cannot breathe|difficulty breathing|unconscious|heavy bleeding|stroke|heart attack|seizure|overdose|suicidal|poisoning|choking)\b/i;

// Symptom to specialist mappings
const SYMPTOM_MAPPINGS: SymptomMapping[] = [
    // Orthopedics / Physiotherapy
    {
        keywords: /\b(shoulder pain|shoulder ache|shoulder hurts?|pain in shoulder|shoulder injury|rotator cuff|frozen shoulder)\b/i,
        department: 'Orthopedics',
        doctorTypes: ['Orthopedic Surgeon', 'Physiotherapist', 'Sports Medicine Specialist'],
        reasoning: 'Shoulder pain typically requires evaluation by an Orthopedic Specialist or Physiotherapist. They can assess for rotator cuff injuries, frozen shoulder, arthritis, or muscle strain and recommend appropriate treatment including physical therapy.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'How long have you had this shoulder pain?',
            'Did the pain start after an injury or gradually?',
            'Is the pain constant or does it come and go?',
            'Can you raise your arm above your head?'
        ]
    },
    {
        keywords: /\b(knee pain|knee hurts?|knee injury|knee swelling|acl|mcl|meniscus|knee cap)\b/i,
        department: 'Orthopedics',
        doctorTypes: ['Orthopedic Surgeon', 'Sports Medicine Specialist'],
        reasoning: 'Knee pain requires orthopedic evaluation to check for ligament injuries (ACL/MCL), meniscus tears, arthritis, or other joint problems. Early diagnosis prevents further damage.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'Did the knee pain start after an injury?',
            'Is there any swelling in your knee?',
            'Does your knee lock or give way?',
            'Do you have difficulty walking?'
        ]
    },
    {
        keywords: /\b(back pain|backache|spine pain|lower back|upper back|slipped disc|sciatica|herniated)\b/i,
        department: 'Orthopedics',
        doctorTypes: ['Orthopedic Surgeon', 'Spine Specialist', 'Physiotherapist'],
        reasoning: 'Back pain can be caused by muscle strain, disc problems, or spinal issues. A specialist can perform proper diagnosis and recommend treatment ranging from physical therapy to intervention if needed.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'Where exactly is the pain - upper, middle, or lower back?',
            'Does the pain radiate to your legs?',
            'Do you have numbness or tingling?',
            'How long have you had this back pain?'
        ]
    },
    {
        keywords: /\b(fracture|broken bone|bone pain|joint pain|arthritis|rheumatoid|osteoporosis)\b/i,
        department: 'Orthopedics',
        doctorTypes: ['Orthopedic Surgeon', 'Rheumatologist'],
        reasoning: 'Bone and joint conditions require specialist evaluation. Fractures need immediate attention, while chronic conditions like arthritis benefit from rheumatology care.',
        urgencyLevel: 'moderate',
        followUpQuestions: [
            'Was there an injury or accident?',
            'Is the pain in one joint or multiple joints?',
            'Is there visible swelling or deformity?',
            'Can you move the affected area?'
        ]
    },

    // Cardiology
    {
        keywords: /\b(chest pain|chest discomfort|heart pain|palpitation|irregular heartbeat|racing heart|high blood pressure|bp high|hypertension)\b/i,
        department: 'Cardiology',
        doctorTypes: ['Cardiologist', 'Cardiac Surgeon'],
        reasoning: 'Chest pain and heart symptoms require prompt cardiac evaluation. A cardiologist can perform ECG, echocardiogram, and other tests to rule out heart conditions.',
        urgencyLevel: 'urgent',
        followUpQuestions: [
            'Is the chest pain severe or mild?',
            'Does the pain radiate to your arm, jaw, or back?',
            'Are you experiencing shortness of breath?',
            'Do you have a history of heart problems?'
        ]
    },

    // General Medicine
    {
        keywords: /\b(fever|cold|cough|flu|viral|infection|body ache|fatigue|tiredness|weakness|general checkup|health checkup)\b/i,
        department: 'General Medicine',
        doctorTypes: ['General Physician', 'Internal Medicine Specialist'],
        reasoning: 'General symptoms like fever, cold, and fatigue are best evaluated by an Internal Medicine specialist who can diagnose the underlying cause and provide appropriate treatment.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'How high is your fever?',
            'How long have you had these symptoms?',
            'Do you have any other symptoms like sore throat or body ache?',
            'Have you been in contact with sick individuals?'
        ]
    },
    {
        keywords: /\b(headache|migraine|head pain|tension headache)\b/i,
        department: 'General Medicine',
        doctorTypes: ['General Physician', 'Neurologist'],
        reasoning: 'Headaches can have various causes. A general physician can evaluate and treat most headaches, while chronic or severe cases may need neurological consultation.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'How often do you get headaches?',
            'Where is the headache located?',
            'Do you have sensitivity to light or sound?',
            'Have you had any recent head injury?'
        ]
    },

    // Gynecology
    {
        keywords: /\b(pregnancy|pregnant|period pain|menstrual|irregular periods|pcos|endometriosis|women health|gynaec|gynec)\b/i,
        department: 'Gynecology',
        doctorTypes: ['Gynecologist', 'Obstetrician'],
        reasoning: "Women's health concerns require specialized gynecological care. Early consultation ensures proper diagnosis and treatment for reproductive health issues.",
        urgencyLevel: 'normal',
        followUpQuestions: [
            'When was your last menstrual period?',
            'Are you experiencing any unusual discharge?',
            'Do you have severe pain during periods?',
            'Are you trying to conceive?'
        ]
    },

    // Dermatology
    {
        keywords: /\b(skin rash|rash|acne|pimple|eczema|psoriasis|skin infection|itching|skin itch|dermatitis|hives)\b/i,
        department: 'Dermatology',
        doctorTypes: ['Dermatologist', 'Skin Specialist'],
        reasoning: 'Skin conditions require dermatological evaluation for proper diagnosis. A dermatologist can identify the condition and prescribe appropriate topical or systemic treatments.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'How long have you had this skin condition?',
            'Is the rash spreading?',
            'Is there itching or pain?',
            'Have you used any new products or medications?'
        ]
    },

    // Pediatrics
    {
        keywords: /\b(child sick|baby fever|kid illness|infant|toddler sick|child cough|baby cold|pediatric)\b/i,
        department: 'Pediatrics',
        doctorTypes: ['Pediatrician', 'Child Specialist'],
        reasoning: 'Children require specialized pediatric care as their symptoms and treatments differ from adults. A pediatrician understands child-specific health concerns.',
        urgencyLevel: 'moderate',
        followUpQuestions: [
            'How old is the child?',
            'What are the main symptoms?',
            'Does the child have a fever? How high?',
            'Is the child eating and drinking normally?'
        ]
    },

    // Psychiatry / Mental Health
    {
        keywords: /\b(anxiety|depression|stress|mental health|panic attack|insomnia|sleep problem|mood swing|bipolar)\b/i,
        department: 'Psychiatry',
        doctorTypes: ['Psychiatrist', 'Psychologist', 'Mental Health Counselor'],
        reasoning: 'Mental health concerns are just as important as physical health. A psychiatrist or psychologist can provide proper evaluation, therapy, and medication if needed.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'How long have you been feeling this way?',
            'Is this affecting your daily activities?',
            'Do you have thoughts of self-harm?',
            'Have you sought help before?'
        ]
    },

    // Neurology
    {
        keywords: /\b(numbness|tingling|seizure|epilepsy|vertigo|dizziness|memory loss|stroke symptoms|paralysis|tremor)\b/i,
        department: 'Neurology',
        doctorTypes: ['Neurologist', 'Neurosurgeon'],
        reasoning: 'Neurological symptoms like numbness, seizures, or dizziness require specialist evaluation to rule out serious conditions affecting the brain and nervous system.',
        urgencyLevel: 'urgent',
        followUpQuestions: [
            'When did these symptoms start?',
            'Is the numbness/tingling on one side or both?',
            'Have you had any falls or injuries?',
            'Do you have slurred speech or vision problems?'
        ]
    },

    // Gastroenterology
    {
        keywords: /\b(stomach pain|abdominal pain|digestion|acidity|gastric|ulcer|liver|nausea|vomiting|diarrhea|constipation|bloating)\b/i,
        department: 'Gastroenterology',
        doctorTypes: ['Gastroenterologist', 'General Physician'],
        reasoning: 'Digestive issues can range from minor to serious conditions. A gastroenterologist can properly diagnose issues like ulcers, IBS, or liver problems.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'Where is the stomach pain located?',
            'Is the pain related to eating?',
            'Do you have any blood in stool?',
            'How long have you had these symptoms?'
        ]
    },

    // Pulmonology
    {
        keywords: /\b(breathing problem|shortness of breath|asthma|wheezing|chronic cough|lung|bronchitis|pneumonia)\b/i,
        department: 'Pulmonology',
        doctorTypes: ['Pulmonologist', 'Respiratory Specialist'],
        reasoning: 'Respiratory symptoms require specialized lung evaluation. A pulmonologist can perform breathing tests and imaging to diagnose conditions like asthma or COPD.',
        urgencyLevel: 'moderate',
        followUpQuestions: [
            'Do you have shortness of breath at rest or with activity?',
            'Do you smoke or have you smoked?',
            'Is the cough dry or producing phlegm?',
            'Do you have any allergies?'
        ]
    },

    // Ophthalmology
    {
        keywords: /\b(eye pain|vision problem|blurry vision|eye infection|conjunctivitis|cataract|glaucoma|eye redness)\b/i,
        department: 'Ophthalmology',
        doctorTypes: ['Ophthalmologist', 'Eye Specialist'],
        reasoning: 'Eye problems require specialized ophthalmic evaluation. Early detection of eye conditions can prevent vision loss.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'How long have you had this eye problem?',
            'Is the vision problem in one eye or both?',
            'Do you have pain or redness?',
            'When was your last eye examination?'
        ]
    },

    // ENT
    {
        keywords: /\b(ear pain|hearing problem|sore throat|tonsil|sinus|nasal congestion|nose bleed|ear infection)\b/i,
        department: 'ENT',
        doctorTypes: ['ENT Specialist', 'Otolaryngologist'],
        reasoning: 'Ear, nose, and throat problems require ENT specialist evaluation for proper diagnosis and treatment of conditions like infections, hearing issues, or sinus problems.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'How long have you had these symptoms?',
            'Do you have fever along with these symptoms?',
            'Is there any discharge from ear or nose?',
            'Do you have difficulty swallowing?'
        ]
    },

    // Urology
    {
        keywords: /\b(kidney pain|urinary problem|blood in urine|kidney stone|prostate|bladder|frequent urination|painful urination)\b/i,
        department: 'Urology',
        doctorTypes: ['Urologist', 'Nephrologist'],
        reasoning: 'Urinary and kidney issues require urological evaluation to diagnose stones, infections, or other conditions affecting the urinary system.',
        urgencyLevel: 'moderate',
        followUpQuestions: [
            'Do you have pain while urinating?',
            'Is there blood in your urine?',
            'How often do you need to urinate?',
            'Do you have fever or back pain?'
        ]
    },

    // Dentistry
    {
        keywords: /\b(tooth pain|toothache|dental|cavity|gum pain|bleeding gums|tooth decay)\b/i,
        department: 'Dentistry',
        doctorTypes: ['Dentist', 'Dental Surgeon'],
        reasoning: 'Dental problems require professional dental care. A dentist can treat cavities, gum disease, and other oral health issues.',
        urgencyLevel: 'normal',
        followUpQuestions: [
            'How long have you had this tooth pain?',
            'Is the pain constant or triggered by hot/cold?',
            'Are your gums swollen or bleeding?',
            'When was your last dental checkup?'
        ]
    },

    // Oncology
    {
        keywords: /\b(cancer|tumor|lump|growth|oncology|chemotherapy)\b/i,
        department: 'Oncology',
        doctorTypes: ['Oncologist', 'Cancer Specialist'],
        reasoning: 'Any suspected cancer symptoms require specialized oncological evaluation. Early detection significantly improves treatment outcomes.',
        urgencyLevel: 'urgent',
        followUpQuestions: [
            'Where is the lump or growth located?',
            'How long have you noticed this?',
            'Is it growing in size?',
            'Do you have a family history of cancer?'
        ]
    }
];

class SymptomAnalyzerService {
    private mappings: SymptomMapping[] = SYMPTOM_MAPPINGS;

    /**
     * Analyze symptoms and return recommendations
     */
    analyzeSymptoms(symptomText: string): AnalysisResult {
        const text = symptomText.toLowerCase().trim();

        // Check for emergency keywords first
        if (EMERGENCY_KEYWORDS.test(text)) {
            return this.createEmergencyResult(text);
        }

        // Find matching symptom mappings
        const matched = this.mappings.find(m => m.keywords.test(text));

        if (matched) {
            return {
                detectedSymptoms: this.extractSymptoms(text, matched.keywords),
                recommendedDepartment: matched.department,
                doctorTypes: matched.doctorTypes,
                reasoning: matched.reasoning,
                urgencyLevel: matched.urgencyLevel,
                followUpQuestions: matched.followUpQuestions,
                isEmergency: false,
                disclaimer: 'This is an AI-based suggestion, not a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.'
            };
        }

        // Default response when no specific match found
        return {
            detectedSymptoms: [symptomText],
            recommendedDepartment: 'General Medicine',
            doctorTypes: ['General Physician', 'Internal Medicine Specialist'],
            reasoning: 'Based on your symptoms, we recommend starting with a General Physician who can evaluate your condition and refer you to a specialist if needed.',
            urgencyLevel: 'normal',
            followUpQuestions: [
                'How long have you had these symptoms?',
                'Are the symptoms getting worse?',
                'Do you have any other symptoms?',
                'Are you taking any medications?'
            ],
            isEmergency: false,
            disclaimer: 'This is an AI-based suggestion, not a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.'
        };
    }

    /**
     * Create emergency result for critical symptoms
     */
    private createEmergencyResult(text: string): AnalysisResult {
        return {
            detectedSymptoms: [text],
            recommendedDepartment: 'Emergency',
            doctorTypes: ['Emergency Physician', 'Critical Care Specialist'],
            reasoning: 'Your symptoms indicate a potentially serious condition that requires immediate medical attention.',
            urgencyLevel: 'emergency',
            followUpQuestions: [],
            isEmergency: true,
            emergencyMessage: '⚠️ URGENT: Please call emergency services (108/112) immediately or visit the nearest Emergency Room. Do not delay seeking medical care.',
            disclaimer: 'This is a medical emergency. Please seek immediate professional medical help.'
        };
    }

    /**
     * Extract matched symptom keywords from text
     */
    private extractSymptoms(text: string, pattern: RegExp): string[] {
        const matches = text.match(pattern);
        return matches ? [matches[0]] : [text];
    }

    /**
     * Get all available departments
     */
    getAllDepartments(): string[] {
        const departments = new Set(this.mappings.map(m => m.department));
        return Array.from(departments);
    }

    /**
     * Get symptom examples for a department
     */
    getExamplesForDepartment(department: string): string[] {
        const mapping = this.mappings.find(m => m.department.toLowerCase() === department.toLowerCase());
        if (mapping) {
            // Extract some example keywords from the regex
            const regexStr = mapping.keywords.source;
            const examples = regexStr
                .replace(/\\b|\(|\)|\|/g, ' ')
                .split(' ')
                .filter(s => s.length > 3)
                .slice(0, 5);
            return examples;
        }
        return [];
    }
}

// Export singleton instance
export const symptomAnalyzerService = new SymptomAnalyzerService();
export default symptomAnalyzerService;
