# 🤖 AI Symptom Chatbot - Implementation Plan

## Overview
A chatbot AI integrated into the Patient Portal that:
1. Takes symptom input from patients
2. Analyzes symptoms against medical categories
3. Recommends appropriate specialists from the patient's available doctors
4. Provides reasoning for the recommendation

## Implementation Date: February 4, 2026

---

## 📁 Files Created (NEW - No Existing Code Modified)

### Backend
- `backend/src/routes/symptom-checker.routes.ts` - New API endpoints
- `backend/src/services/symptom-analyzer.service.ts` - Symptom analysis logic

### Frontend
- `frontend/src/pages/portal/SymptomChecker.tsx` - Main chatbot component
- `frontend/src/components/SymptomChatbot.tsx` - Floating chatbot widget

---

## 🔗 Integration Points (Minimal Changes)

1. **Backend server.ts** - Add one line to register new routes
2. **Frontend App.tsx** - Add one route for the symptom checker page
3. **PatientDashboard.tsx** - Add one card to access symptom checker

---

## 🩺 Symptom to Specialist Mapping

| Symptom Keywords | Department | Doctor Type | Reasoning |
|------------------|------------|-------------|-----------|
| shoulder pain, shoulder ache, shoulder hurt | Orthopedics | Orthopedic Surgeon / Physiotherapist | Joint/muscle evaluation |
| knee pain, knee injury | Orthopedics | Orthopedic Surgeon | Ligament/joint issues |
| back pain, spine pain | Orthopedics | Spine Specialist / Physiotherapist | Disc/muscle issues |
| chest pain, heart pain | Cardiology | Cardiologist | Heart evaluation (URGENT) |
| headache, migraine | General Medicine / Neurology | General Physician / Neurologist | Primary evaluation |
| fever, cold, cough, flu | General Medicine | General Physician | Infection treatment |
| skin rash, acne, eczema | Dermatology | Dermatologist | Skin conditions |
| anxiety, depression, stress | Psychiatry | Psychiatrist / Psychologist | Mental health |
| pregnancy, period issues | Gynecology | Gynecologist | Women's health |
| child sick, baby fever | Pediatrics | Pediatrician | Child healthcare |
| eye pain, vision issues | Ophthalmology | Ophthalmologist | Eye care |
| toothache, dental | Dentistry | Dentist | Dental care |
| stomach pain, digestion | Gastroenterology | Gastroenterologist | Digestive issues |
| breathing difficulty | Pulmonology | Pulmonologist | Respiratory issues |

---

## 📋 API Endpoints

### POST /api/symptom-checker/analyze
**Request:**
```json
{
  "symptoms": "I have shoulder pain",
  "patientId": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "detectedSymptoms": ["shoulder pain"],
    "recommendedDepartment": "Orthopedics",
    "reasoning": "Shoulder pain typically requires evaluation by an Orthopedic Specialist or Physiotherapist for joint/muscle issues.",
    "urgencyLevel": "normal", // normal, moderate, urgent, emergency
    "suggestedDoctors": [
      {
        "id": "uuid",
        "name": "Dr. Rajesh Kumar",
        "specialization": "Orthopedic Surgeon",
        "department": "Orthopedics",
        "available": true,
        "nextSlot": "2026-02-05T10:00:00"
      }
    ],
    "followUpQuestions": [
      "How long have you had this pain?",
      "Is the pain constant or does it come and go?"
    ],
    "disclaimer": "This is not a medical diagnosis. Please consult a doctor for proper evaluation."
  }
}
```

---

## 🎨 UI Components

### 1. Floating Chatbot Widget
- Fixed position bottom-right
- Expandable chat interface
- Pink theme consistent with app

### 2. Full Page Symptom Checker
- Accessible from Patient Dashboard
- Chat-style interface
- Doctor recommendation cards
- One-click appointment booking

---

## ⚠️ Safety Features

1. **Emergency Detection**
   - Keywords: "severe", "can't breathe", "chest pain", "unconscious", "bleeding heavily"
   - Action: Show emergency alert, suggest calling emergency services

2. **Disclaimer**
   - Every response includes: "This is not a medical diagnosis"
   - Recommend professional consultation

3. **Logging**
   - All interactions logged for audit
   - Organization-scoped data isolation

---

## 🔒 Security Considerations

- Patient data stays within organization scope
- No symptom data sent to external AI services (rule-based initially)
- HIPAA-compliant data handling
- Audit trail for all recommendations

---

## Status: ✅ Implementation Complete + Bug Fixes Applied

### Files Created:
- ✅ `backend/src/services/symptom-analyzer.service.ts`
- ✅ `backend/src/routes/symptom-checker.routes.ts`
- ✅ `frontend/src/pages/portal/SymptomChecker.tsx`

### Files Modified (Minimal Changes):
- ✅ `backend/src/server.ts` - Added route registration (8 lines)
- ✅ `frontend/src/App.tsx` - Added import + route (2 lines)
- ✅ `frontend/src/pages/portal/PatientDashboard.tsx` - Added card (20 lines)

### Bug Fixes Applied (February 4, 2026):

#### 1. ✅ "View Doctors" Button Fixed
- **Before**: Navigated to public `/doctors` page showing all doctors
- **After**: Opens a modal showing only doctors from the patient's organization, filtered by the recommended department
- Added new API endpoint: `GET /api/symptom-checker/doctors/:department`

#### 2. ✅ "Describe more symptoms" Button Fixed
- **Before**: Did nothing or sent the button label as a message
- **After**: Focuses on the input field and shows a helpful message prompting the user to type more symptoms

#### 3. ✅ User Message Display Fixed
- **Before**: User messages showed incorrectly with HTML parsing
- **After**: User messages display as plain text, assistant messages have markdown formatting

#### 4. ✅ Enhanced Doctor Modal
- Shows doctor cards with name, specialization, experience, and consultation fee
- "Book" button next to each doctor for easy appointment booking
- Empty state with option to book a general appointment

### How to Test:
1. Login as a patient
2. Go to Patient Portal → Click "AI Symptom Checker" card
3. OR navigate directly to `/portal/symptom-checker`
4. Type symptoms like "I have shoulder pain" and see the recommendation
5. Click "View Doctors" to see filtered doctors in a modal
6. Click "Describe more symptoms" to continue the conversation
