# 🔄 Hospital Management System - Application Flowcharts

## 📋 Table of Contents
1. [High-Level System Architecture](#high-level-system-architecture)
2. [User Journey Flowcharts](#user-journey-flowcharts)
3. [Module Interaction Flowcharts](#module-interaction-flowcharts)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Authentication & Authorization Flow](#authentication--authorization-flow)
6. [Multi-Tenant Architecture Flow](#multi-tenant-architecture-flow)

---

## 🏗️ High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser] --> B[React Frontend]
        C[Mobile Browser] --> B
        D[Tablet] --> B
    end
    
    subgraph "Application Layer"
        B --> E[Express.js API Server]
        E --> F[Authentication Middleware]
        E --> G[Tenant Middleware]
        E --> H[Controllers]
        E --> I[Services]
    end
    
    subgraph "Business Logic Layer"
        H --> J[User Management]
        H --> K[Patient Management]
        H --> L[Appointment System]
        H --> M[Clinical Workflows]
        H --> N[Pharmacy & Lab]
        H --> O[Billing System]
    end
    
    subgraph "Data Layer"
        I --> P[TypeORM]
        P --> Q[PostgreSQL Database]
    end
    
    subgraph "External Services"
        E --> R[Firebase Auth]
        E --> S[Email Service]
        E --> T[File Storage]
    end
    
    style A fill:#e1f5fe
    style B fill:#e3f2fd
    style E fill:#f3e5f5
    style Q fill:#e8f5e8
    style R fill:#fff3e0
```

---

## 👥 User Journey Flowcharts

### 1. Patient Registration & Login Flow

```mermaid
flowchart TD
    Start([Start]) --> A{New User?}
    
    A -->|Yes| B[Visit Registration Page]
    A -->|No| C[Visit Login Page]
    
    B --> D{Choose Auth Method}
    D -->|Email| E[Enter Email + Password]
    D -->|Phone| F[Enter Phone Number]
    
    E --> G[Submit Registration]
    G --> H[Create User Account]
    H --> I[Choose Organization]
    I --> J[Login Automatically]
    
    F --> K[Send OTP via Firebase]
    K --> L[Enter OTP Code]
    L --> M[Verify OTP]
    M --> N[Create Phone User]
    N --> O[Login Automatically]
    
    C --> P{Choose Auth Method}
    P -->|Email| Q[Enter Email + Password]
    P -->|Phone| R[Enter Phone Number]
    
    Q --> S[Verify Credentials]
    S --> T[Generate JWT Tokens]
    
    R --> U[Send OTP via Firebase]
    U --> V[Enter OTP Code]
    V --> W[Verify OTP]
    W --> X[Generate JWT Tokens]
    
    J --> Y[Access Patient Dashboard]
    O --> Y
    T --> Y
    X --> Y
    
    Y --> Z[Book Appointment / View Records / etc.]
    
    style Start fill:#4caf50,color:#fff
    style Y fill:#2196f3,color:#fff
    style Z fill:#9c27b0,color:#fff
```

### 2. Doctor Workflow Flowchart

```mermaid
flowchart TD
    Start([Doctor Login]) --> A[Access Doctor Dashboard]
    
    A --> B{Select Action}
    
    B -->|View Schedule| C[Manage Availability]
    B -->|View Queue| D[Check Patient Queue]
    B -->|My Patients| E[View Patient List]
    B -->|Lab Results| F[Review Lab Reports]
    B -->|Inpatient| G[Manage Admitted Patients]
    
    C --> C1[Set Available Slots]
    C1 --> C2[Block Time Slots]
    C2 --> C3[View Appointments]
    
    D --> D1[View Waiting Patients]
    D1 --> D2[Call Next Patient]
    D2 --> D3[Start Consultation]
    
    E --> E1[Search Patient]
    E1 --> E2[View Medical History]
    E2 --> E3[Book Follow-up]
    
    F --> F1[View Pending Results]
    F1 --> F2[Review Reports]
    F2 --> F3[Update Treatment]
    
    G --> G1[View Ward Patients]
    G1 --> G2[Doctor Rounds]
    G2 --> G3[Update Care Plan]
    
    D3 --> H[Consultation Process]
    H --> I[Review Patient History]
    I --> J[Examine Patient]
    J --> K[Add Diagnosis]
    K --> L[Write Prescription]
    L --> M[Order Lab Tests]
    M --> N[Complete Consultation]
    
    N --> O[Update Queue Status]
    O --> P[Return to Dashboard]
    
    style Start fill:#4caf50,color:#fff
    style H fill:#ff9800,color:#fff
    style P fill:#2196f3,color:#fff
```

### 3. Receptionist Workflow Flowchart

```mermaid
flowchart TD
    Start([Receptionist Login]) --> A[Access Reception Dashboard]
    
    A --> B{Select Task}
    
    B -->|Patient Registration| C[Register New Patient]
    B -->|Appointments| D[Manage Appointments]
    B -->|Queue Management| E[Handle Patient Queue]
    B -->|Billing| F[Process Payments]
    B -->|Callback Requests| G[Handle Callbacks]
    
    C --> C1[Enter Patient Details]
    C1 --> C2[Check for Existing Records]
    C2 --> C3[Create Patient Account]
    C3 --> C4[Assign Patient ID]
    
    D --> D1{Appointment Type}
    D1 -->|New Booking| D2[Book Appointment]
    D1 -->|Walk-in| D3[Register Walk-in]
    D1 -->|Reschedule| D4[Modify Appointment]
    
    E --> E1[Check-in Patient]
    E1 --> E2[Generate Token]
    E2 --> E3[Update Queue]
    E3 --> E4[Display on TV]
    
    F --> F1[Generate Bill]
    F1 --> F2[Collect Payment]
    F2 --> F3[Print Receipt]
    F3 --> F4[Update Records]
    
    G --> G1[View Callback Requests]
    G1 --> G2[Schedule Callback]
    G2 --> G3[Make Call]
    G3 --> G4[Update Status]
    
    C4 --> H[Complete Task]
    D2 --> H
    D3 --> H
    D4 --> H
    E4 --> H
    F4 --> H
    G4 --> H
    
    H --> I[Return to Dashboard]
    
    style Start fill:#4caf50,color:#fff
    style H fill:#ff9800,color:#fff
    style I fill:#2196f3,color:#fff
```

---

## 🔄 Module Interaction Flowcharts

### 1. Appointment Booking Flow

```mermaid
sequenceDiagram
    participant P as Patient
    participant F as Frontend
    participant A as API Server
    participant D as Database
    participant E as Email Service
    participant Q as Queue System
    
    P->>F: Browse Departments
    F->>A: GET /api/departments
    A->>D: Query departments
    D-->>A: Department list
    A-->>F: Department data
    F-->>P: Show departments
    
    P->>F: Select Department
    P->>F: Browse Doctors
    F->>A: GET /api/users?role=doctor&dept=X
    A->>D: Query doctors
    D-->>A: Doctor list
    A-->>F: Doctor data
    F-->>P: Show doctors
    
    P->>F: Select Doctor
    P->>F: Check Availability
    F->>A: GET /api/availability/doctor/:id
    A->>D: Query availability
    D-->>A: Available slots
    A-->>F: Slot data
    F-->>P: Show calendar
    
    P->>F: Select Slot & Fill Form
    P->>F: Submit Booking
    F->>A: POST /api/appointments/book
    A->>D: Create appointment
    D-->>A: Appointment created
    A->>E: Send confirmation email
    A->>Q: Add to queue (if walk-in)
    A-->>F: Success response
    F-->>P: Show confirmation
```

### 2. Doctor Consultation Flow

```mermaid
sequenceDiagram
    participant R as Receptionist
    participant N as Nurse
    participant D as Doctor
    participant Q as Queue System
    participant DB as Database
    participant P as Pharmacy
    participant L as Lab
    
    R->>Q: Check-in patient
    Q->>DB: Create queue item
    Q-->>R: Token generated
    
    N->>Q: View triage queue
    Q->>N: Next patient
    N->>DB: Record vital signs
    N->>DB: Create triage record
    N->>Q: Send to doctor queue
    
    D->>Q: View doctor queue
    Q->>D: Next patient
    D->>DB: Get patient history
    DB-->>D: Medical records
    D->>DB: Add consultation notes
    D->>DB: Add diagnosis
    D->>DB: Create prescription
    D->>P: Send prescription
    D->>L: Send lab orders (if any)
    D->>Q: Complete consultation
    Q->>DB: Update queue status
    
    P->>DB: Receive prescription
    P->>DB: Update inventory
    L->>DB: Receive lab orders
    L->>DB: Create lab samples
```

### 3. Pharmacy Dispensing Flow

```mermaid
flowchart TD
    Start([Doctor Writes Prescription]) --> A[Prescription Created]
    
    A --> B[Sent to Pharmacy Queue]
    B --> C[Pharmacist Views Queue]
    
    C --> D{Stock Available?}
    
    D -->|Yes| E[Dispense Medicines]
    D -->|No| F[Check Alternative]
    
    F --> G{Alternative Available?}
    G -->|Yes| H[Contact Doctor]
    G -->|No| I[Create Purchase Order]
    
    H --> J{Doctor Approves?}
    J -->|Yes| E
    J -->|No| K[Inform Patient]
    
    I --> L[Order from Supplier]
    L --> M[Receive Stock]
    M --> E
    
    E --> N[Update Inventory]
    N --> O[Mark Prescription Dispensed]
    O --> P[Generate Bill]
    P --> Q[Complete Transaction]
    
    K --> R[End]
    Q --> R
    
    style Start fill:#4caf50,color:#fff
    style E fill:#ff9800,color:#fff
    style Q fill:#2196f3,color:#fff
    style R fill:#9c27b0,color:#fff
```

---

## 📊 Data Flow Diagrams

### 1. Patient Data Flow

```mermaid
graph LR
    subgraph "Data Sources"
        A[Patient Registration]
        B[Appointment Booking]
        C[Consultation Notes]
        D[Lab Results]
        E[Prescriptions]
        F[Vital Signs]
    end
    
    subgraph "Processing Layer"
        G[Validation Layer]
        H[Business Logic]
        I[Data Transformation]
    end
    
    subgraph "Storage Layer"
        J[Patient Records DB]
        K[Medical Records DB]
        L[Appointment DB]
        M[Lab Results DB]
        N[Prescription DB]
    end
    
    subgraph "Data Consumers"
        O[Doctor Dashboard]
        P[Patient Portal]
        Q[Analytics Engine]
        R[Report Generator]
    end
    
    A --> G
    B --> G
    C --> G
    D --> G
    E --> G
    F --> G
    
    G --> H
    H --> I
    
    I --> J
    I --> K
    I --> L
    I --> M
    I --> N
    
    J --> O
    K --> O
    L --> O
    M --> O
    N --> O
    
    J --> P
    K --> P
    M --> P
    N --> P
    
    J --> Q
    K --> Q
    L --> Q
    M --> Q
    N --> Q
    
    J --> R
    K --> R
    L --> R
    M --> R
    N --> R
```

### 2. Multi-Tenant Data Isolation Flow

```mermaid
flowchart TD
    Start([API Request]) --> A[Authentication Middleware]
    
    A --> B{Valid JWT?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D[Extract User Info]
    
    D --> E[Tenant Middleware]
    E --> F[Get Organization ID]
    F --> G[Set Tenant Context]
    
    G --> H[Controller Processing]
    H --> I[Database Query]
    
    I --> J[TypeORM Query Builder]
    J --> K[Add Tenant Filter]
    K --> L[WHERE organizationId = :tenantId]
    
    L --> M[Execute Query]
    M --> N[Filter Results]
    N --> O[Return Tenant Data Only]
    
    O --> P[Response to Client]
    
    style Start fill:#4caf50,color:#fff
    style G fill:#ff9800,color:#fff
    style L fill:#f44336,color:#fff
    style P fill:#2196f3,color:#fff
```

---

## 🔐 Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant DB as Database
    participant T as Token Service
    participant M as Middleware
    
    U->>F: Login Request
    F->>A: POST /api/auth/login
    A->>DB: Verify credentials
    DB-->>A: User data + org
    A->>T: Generate JWT tokens
    T-->>A: Access + Refresh tokens
    A->>DB: Store refresh token
    A-->>F: Tokens + user data
    F-->>U: Login success
    
    U->>F: Make API request
    F->>M: Request with Bearer token
    M->>T: Verify JWT
    T-->>M: Token valid + payload
    M->>DB: Get user details
    DB-->>M: User + organization
    M-->>F: Request allowed
    F-->>U: Response
    
    Note over M: Token expires
    F->>A: POST /api/auth/refresh
    A->>DB: Verify refresh token
    DB-->>A: Valid refresh token
    A->>T: Generate new access token
    T-->>A: New access token
    A-->>F: New access token
```

---

## 🏢 Multi-Tenant Architecture Flow

```mermaid
graph TB
    subgraph "Super Admin Portal"
        SA[Super Admin]
        SA --> OM[Organization Management]
        SA --> PA[Platform Analytics]
        SA --> SM[System Management]
    end
    
    subgraph "Organization A (Hospital 1)"
        OA1[Admin A]
        OA1 --> DA1[Doctors A]
        OA1 --> NA1[Nurses A]
        OA1 --> RA1[Receptionists A]
        DA1 --> PA1[Patients A]
        NA1 --> PA1
        RA1 --> PA1
    end
    
    subgraph "Organization B (Hospital 2)"
        OB1[Admin B]
        OB1 --> DB1[Doctors B]
        OB1 --> NB1[Nurses B]
        OB1 --> RB1[Receptionists B]
        DB1 --> PB1[Patients B]
        NB1 --> PB1
        RB1 --> PB1
    end
    
    subgraph "Shared Infrastructure"
        API[API Server]
        DB[(PostgreSQL)]
        AUTH[Auth Service]
        EMAIL[Email Service]
    end
    
    OM --> API
    PA --> API
    SM --> API
    
    OA1 --> API
    DA1 --> API
    NA1 --> API
    RA1 --> API
    PA1 --> API
    
    OB1 --> API
    DB1 --> API
    NB1 --> API
    RB1 --> API
    PB1 --> API
    
    API --> DB
    API --> AUTH
    API --> EMAIL
    
    style SA fill:#e3f2fd
    style OA1 fill:#e8f5e8
    style OB1 fill:#fff3e0
    style API fill:#f3e5f5
    style DB fill:#fce4ec
```

---

## 🏥 Complete Patient Journey Flow

```mermaid
flowchart TD
    Start([Patient Journey]) --> A[Registration]
    
    A --> B{Registration Method}
    B -->|Online| C[Web Registration]
    B -->|Phone| D[Phone Registration]
    B -->|Walk-in| E[Reception Registration]
    
    C --> F[Email/Password or Phone OTP]
    D --> G[Firebase Phone OTP]
    E --> H[Staff creates account]
    
    F --> I[Patient Account Created]
    G --> I
    H --> I
    
    I --> J[Choose Hospital/Department]
    J --> K[Book Appointment]
    
    K --> L{Appointment Type}
    L -->|Scheduled| M[Select Date/Time]
    L -->|Walk-in| N[Immediate Registration]
    
    M --> O[Receive Confirmation]
    N --> P[Generate Token]
    
    O --> Q[Arrive at Hospital]
    P --> Q
    
    Q --> R[Reception Check-in]
    R --> S[Update Queue]
    
    S --> T[Nurse Triage]
    T --> U[Record Vital Signs]
    U --> V[Initial Assessment]
    
    V --> W[Doctor Consultation]
    W --> X[Medical History Review]
    X --> Y[Diagnosis]
    Y --> Z[Treatment Plan]
    
    Z --> AA{Additional Services?}
    AA -->|Lab Tests| BB[Lab Order]
    AA -->|Prescription| CC[Pharmacy]
    AA -->|Admission| DD[Inpatient Admission]
    AA -->|None| EE[Go Home]
    
    BB --> FF[Sample Collection]
    FF --> GG[Lab Processing]
    GG --> HH[Results Available]
    
    CC --> II[Prescription Processing]
    II --> JJ[Medicine Dispensing]
    
    DD --> KK[Bed Assignment]
    KK --> LL[Nursing Care]
    LL --> MM[Doctor Rounds]
    MM --> NN[Treatment & Monitoring]
    NN --> OO[Discharge Planning]
    
    HH --> PP[Follow-up Appointment]
    JJ --> PP
    OO --> PP
    
    EE --> QQ[Payment & Billing]
    PP --> QQ
    QQ --> RR[Medical Records Updated]
    RR --> SS[Patient Portal Access]
    SS --> TT[Complete Journey]
    
    style Start fill:#4caf50,color:#fff
    style W fill:#ff9800,color:#fff
    style AA fill:#9c27b0,color:#fff
    style TT fill:#2196f3,color:#fff
```

---

## 🔄 Real-time Queue Management Flow

```mermaid
stateDiagram-v2
    [*] --> PatientArrives
    
    PatientArrives --> CheckIn: Reception Check-in
    CheckIn --> TokenGenerated: Generate Token
    TokenGenerated --> WaitingQueue: Add to Queue
    
    WaitingQueue --> Triage: Nurse Call
    Triage --> TriageInProgress: Vital Signs
    TriageInProgress --> DoctorQueue: Send to Doctor
    TriageInProgress --> WaitingQueue: Need More Tests
    
    DoctorQueue --> DoctorConsultation: Doctor Call
    DoctorConsultation --> ConsultationInProgress: Examination
    ConsultationInProgress --> Prescription: Write Prescription
    ConsultationInProgress --> LabTests: Order Tests
    ConsultationInProgress --> Admission: Admit Patient
    ConsultationInProgress --> Complete: Consultation Done
    
    Prescription --> PharmacyQueue: Send to Pharmacy
    LabTests --> LabQueue: Send to Lab
    Admission --> InpatientQueue: Send to Ward
    Complete --> [*]: Patient Leaves
    
    PharmacyQueue --> PharmacyProcessing: Process Prescription
    PharmacyProcessing --> PharmacyComplete: Medicine Dispensed
    PharmacyComplete --> [*]
    
    LabQueue --> LabProcessing: Process Tests
    LabProcessing --> LabComplete: Results Ready
    LabComplete --> [*]
    
    InpatientQueue --> InpatientProcessing: Admit Patient
    InpatientProcessing --> InpatientComplete: Discharge
    InpatientComplete --> [*]
```

---

## 📱 Mobile-First Patient Portal Flow

```mermaid
journey
    title Patient Mobile App Journey
    section Registration
      Download App: 5: Patient
      Create Account: 4: Patient
      Phone Verification: 4: Patient
      Choose Hospital: 5: Patient
    section Appointment Booking
      Browse Doctors: 5: Patient
      Check Availability: 4: Patient
      Book Appointment: 5: Patient
      Receive Confirmation: 5: Patient
    section Hospital Visit
      Check-in Mobile: 4: Patient
      View Queue Status: 5: Patient
      Receive Notifications: 5: Patient
    section Post-Visit
      View Medical Records: 5: Patient
      Download Reports: 4: Patient
      Pay Bills Online: 4: Patient
      Book Follow-up: 5: Patient
```

---

## 🔗 System Integration Flow

```mermaid
graph TB
    subgraph "External Systems"
        ERP[ERP System]
        LAB[External Lab]
        INSURANCE[Insurance Portal]
        GOVT[Government Health Portal]
        PHARMACY[External Pharmacy]
    end
    
    subgraph "Hospital Management System"
        HMS[Core HMS]
        API[API Gateway]
        DB[(Database)]
        
        subgraph "Modules"
            PAT[Patient Management]
            APP[Appointments]
            BILL[Billing]
            LABM[Laboratory]
            PHARM[Pharmacy]
        end
    end
    
    subgraph "Integration Layer"
        HL7[HL7/FHIR Interface]
        REST[REST APIs]
        WEBHOOK[Webhooks]
        FILE[File Transfer]
    end
    
    ERP --> HL7
    LAB --> REST
    INSURANCE --> WEBHOOK
    GOVT --> FILE
    PHARMACY --> REST
    
    HL7 --> API
    REST --> API
    WEBHOOK --> API
    FILE --> API
    
    API --> HMS
    HMS --> DB
    
    HMS --> PAT
    HMS --> APP
    HMS --> BILL
    HMS --> LABM
    HMS --> PHARM
    
    style ERP fill:#e3f2fd
    style HMS fill:#e8f5e8
    style API fill:#fff3e0
    style DB fill:#fce4ec
```

---

## 📊 Analytics & Reporting Flow

```mermaid
flowchart TD
    Start([Data Collection]) --> A[Multiple Data Sources]
    
    A --> B[Patient Data]
    A --> C[Appointment Data]
    A --> D[Billing Data]
    A --> E[Inventory Data]
    A --> F[Staff Data]
    
    B --> G[Data Processing Layer]
    C --> G
    D --> G
    E --> G
    F --> G
    
    G --> H[Data Validation]
    H --> I[Data Transformation]
    I --> J[Data Aggregation]
    
    J --> K[Analytics Engine]
    
    K --> L[Real-time Dashboards]
    K --> M[Scheduled Reports]
    K --> N[Custom Reports]
    K --> O[Predictive Analytics]
    
    L --> P[Admin Dashboard]
    L --> Q[Doctor Dashboard]
    L --> R[Management Reports]
    
    M --> S[Daily Reports]
    M --> T[Weekly Reports]
    M --> U[Monthly Reports]
    
    N --> V[Custom Query Builder]
    N --> W[Export Options]
    
    O --> X[Patient Risk Prediction]
    O --> Y[Resource Optimization]
    O --> Z[Revenue Forecasting]
    
    style Start fill:#4caf50,color:#fff
    style G fill:#ff9800,color:#fff
    style K fill:#9c27b0,color:#fff
    style P fill:#2196f3,color:#fff
```

---

## 🎯 Key Insights from Flowcharts

### **System Complexity**
- **50+ interconnected processes**
- **8 different user roles** with unique workflows
- **Multi-tenant architecture** with data isolation
- **Real-time queue management** system

### **Critical Integration Points**
1. **Authentication Gateway** - Single entry point for all users
2. **Queue Management System** - Core patient flow coordinator
3. **Database Layer** - Centralized data with tenant isolation
4. **External Services** - Firebase, Email, SMS integrations

### **Data Flow Patterns**
- **Linear flows** for patient registration and booking
- **Parallel processing** for pharmacy and lab orders
- **Real-time updates** for queue management
- **Batch processing** for analytics and reporting

### **Security & Compliance**
- **JWT-based authentication** with refresh tokens
- **Role-based access control** at every level
- **Tenant data isolation** in multi-tenant setup
- **Audit logging** for all critical operations

---

## 📝 How to Use These Flowcharts

1. **For Development Teams**: Use module interaction flows to understand system dependencies
2. **For Business Analysts**: Use user journey flows to map business processes
3. **For System Administrators**: Use architecture flows for deployment planning
4. **For Training**: Use workflow diagrams to train new staff
5. **For Documentation**: Include in technical documentation and user manuals

---

**Last Updated:** February 10, 2026  
**Version:** 1.0.0  
**Format:** Mermaid diagrams (compatible with GitHub, VS Code, and documentation tools)
