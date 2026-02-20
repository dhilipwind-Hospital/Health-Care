# Comprehensive UI/UX Design Specification: Lunaris Premium Pink Theme

## 1. Global Visual Identity & Color System
This system defines the **"Lunaris Pink"** aesthetic—a warm, empathetic, and premium interface designed to feel caring yet professional. It leverages a sophisticated pink/magenta palette combined with glassmorphism for a modern, approachable medical experience.

### 1.1 Color Palette
**Brand Colors**
*   **Primary (Lunaris Magenta)**: `#EB2F96` - Used for primary buttons, active navigation items, and key brand highlights.
*   **Secondary (Deep Rose)**: `#9E1068` - Used for sidebars, headers, and strong text accents.
*   **Accent (Soft Blush)**: `#FFADD2` - Used for secondary buttons, background highlights, and hover states.
*   **Gradient**: `linear-gradient(135deg, #EB2F96 0%, #722ED1 100%)` - Used for "Hero" buttons and active cards.

**Functional Colors (Status Indicators)**
*   **Success / Normal**: `#52C41A` (Green) - Completed tasks, Stable vitals, Payment received.
*   **Warning / Attention**: `#FAAD14` (Gold) - Pending reports, Observation needed.
*   **Critical / Emergency**: `#F5222D` (Red) - Emergency cases, Abnormal vitals, Stock out.
*   **Info / Processing**: `#1890FF` (Blue) - In-progress, Admitted.

**UI Neutrals (Backgrounds & Surfaces)**
*   **Canvas Background**: `#FFF0F6` (Very Pale Pink/Gray) - A warm, softened white background to reduce harshness.
*   **Card Surface (Light)**: `#FFFFFF` (White) - Standard cards.
*   **Card Surface (Glass)**: `rgba(255, 255, 255, 0.75)` - Floating panels.
*   **Text Primary**: `#1F1F1F` (Dark Gray) - Main headings.
*   **Text Secondary**: `#8C8C8C` (Gray) - Meta data.
*   **Borders**: `#FFD6E7` (Pale Pink Border) - Subtle separation.

### 1.2 Layout & Effects
*   **Glassmorphism**: heavily used in sticky headers, modals, and floating widgets.
    *   `background: rgba(255, 255, 255, 0.65);`
    *   `backdrop-filter: blur(16px);`
    *   `border: 1px solid rgba(255, 255, 255, 0.5);`
    *   `box-shadow: 0 8px 32px 0 rgba(235, 47, 150, 0.1);` (Pink-tinted shadow)
*   **Shadows**:
    *   *Soft Lift*: `0 4px 20px rgba(235, 47, 150, 0.15)` - For cards.
    *   *Deep Depth*: `0 10px 40px rgba(158, 16, 104, 0.2)` - For modals and dropdowns.
*   **Typography**:
    *   **Font**: *Manrope* or *Inter* (Clean, modern sans-serif).
    *   **Headings**: Deep Rose (`#9E1068`), Semi-Bold.
    *   **Body**: Dark Gray, High legibility.

---

## 2. Navigation & Menu Structure
The specific layout for the Pink Theme involves a **translucent sidebar** that blends with the background gradient.

### 2.1 Common Header (Glass Stick)
A floating glass bar at the top.
*   **Left**: Page Title with a "Glow" effect (e.g., `Queue Dashboard` with a subtle pink under-glow).
*   **Center**: "Command K" Global Search (Pill-shaped, white background).
*   **Right**:
    *   **Notification Bell**: Animated with a red dot for urgency.
    *   **Department**: Dropdown with pink hover/select state.
    *   **Profile**: Circular avatar with a Primary Pink ring.

### 2.2 Role-Specific Features & flow
**Workflows tailored for "Caring & Efficiency".**

#### A. Receptionist (The "Frontline" View)
*   **Dashboard**:
    *   **Visual**: A welcoming "Sunrise" gradient card at top.
    *   **Quick Actions**: Large, square buttons with icons ("Register Patient", "Book Appointment", "Search").
*   **Registration Modal**:
    *   **Style**: Central glass card.
    *   **Steps**: Progress bar in Pink. Step 1: Search (Prevent Duplicates), Step 2: Demographics, Step 3: Visit Reason.

#### B. Doctor (The "Focus" View)
*   **Consultation Workspace**:
    *   **Patient Ribbon**: A sticky pink strip at the top showing Name, Age, Gender, and *Allergies (in Red)*.
    *   **Tabs**: "Overview", "Clinical Notes", "Orders", "History".
        *   *Active Tab*: Underlined with a glowing Magenta line.
    *   **SOAP Note Area**:
        *   Background: White with very subtle pink grid lines (notebook style) or plain white.
        *   Inputs: Floating labels with Magenta focus borders.

#### C. Nurse (The "Monitor" View)
*   **Ward Dashboard**:
    *   **Bed Cards**:
        *   *Occupied*: Soft Pink background card.
        *   *Vacant*: Outline card with Green "Available" badge.
        *   *Discharge*: Yellow background "Discharging".
*   **Triage Form**:
    *   **Vitals Input**: Large text inputs. If a value is abnormal (e.g., Temp > 100F), the input glows Red and shakes slightly.

#### D. Pharmacis (The "Precision" View)
*   **Dispensing**:
    *   **Stock Indicators**: Circular progress rings. Pink = Good, Red = Low.
    *   **Prescription Viewer**: distinctive "Paper-like" container for the digital Rx.

#### E. Lab Technician (The "Process" View)
*   **Sample Tracking**:
    *   **Kanban Board**:
        *   Col 1: Pending (Pink Header)
        *   Col 2: Processing (Blue Header)
        *   Col 3: Verified (Green Header)

#### F. Administrator (The "Control" View)
*   **Analytics**:
    *   **Charts**: Line charts using the Pink/Purple/Blue gradient palette.
    *   **KPI Cards**: Glass cards with big bold numbers in Deep Rose.

---

## 3. Detailed Interface Component Specifications

### 3.1 The "Reception Queue" Dashboard
**Goal**: Instant visibility of waiting patients.
*   **Hero Section**:
    *   Background: Gentle mesh gradient (White -> Soft Pink).
    *   **Stats Rail**: 4 Glass Cards.
        *   "Total Visits": Icon (Users), Count (142), Trend (+12% Green).
        *   "Avg Wait": Icon (Clock), Time (12m), Trend (-2m Green).
*   **The Queue List**:
    *   **Container**: Large white card with rounded corners (`24px`).
    *   **Rows**: Hover effect turns row background to `Pale Pink (#FFF0F6)`.
    *   **Columns**:
        *   *Token*: Magenta circle, white number.
        *   *Patient*: Bold text.
        *   *Status*:
            *   *Waiting*: Gray Pill.
            *   *With Doctor*: Blue Pill.
            *   *Triage*: Orange Pill.
    *   **Action Button**: "Create Visit" - Pill shaped, solid Magenta, shadowing.

### 3.2 The "Doctor Consultation" Screen
**Goal**: Clinical focus with zero distractions.
*   **Structure**: Three-Column Layout.
    1.  **Left (Timeline)**: Vertical line with dots connecting past visits. Click a dot to expand summary.
    2.  **Center (Active Note)**:
        *   **Vitals Widget**: Horizontal row of glass bubbles showing BP, HR, SpO2 (fetched from Triage).
        *   **Subjective**: Clean textarea.
        *   **Diagnosis**: Searchable dropdown ("Type 'Fever'...").
    3.  **Right (Quick Orders)**:
        *   **Meds**: List of frequently used meds. Click to add.
        *   **Labs**: Checkboxes for common labs (CBC, LFT, KFT).
*   **Footer**: Floating Action Bar at bottom right.
    *   "Save Draft" (Ghost Pink Button).
    *   "Sign & Print" (Solid Magenta Button).

### 3.3 The "Inpatient Ward" Visualizer
**Goal**: Spatial awareness of bed occupancy.
*   **Visual**: 2D Grid implementation.
*   **Room Container**: Bordered box labeled "Room 101".
*   **Bed Icon**:
    *   **Iconography**: Stylized Bed SVG.
    *   **Color Logic**:
        *   *Free*: Gray Icon, Green Dot.
        *   *Occupied*: Pink Icon, Patient Initials overlay.
        *   *Selected*: Glowing Magenta outline.
*   **Sidebar Details**: Clicking a bed slides out a "Patient Sheet" from the right (Glassmorphism pane) showing details.

### 3.4 The "Pharmacy Inventory" Grid
**Goal**: Prevent stockouts.
*   **Stock Level Visual**:
    *   Instead of just numbers, use a **Linear Progress Bar** inside the table cell.
    *   Full = Pink. Low = Gradient Red.
*   **Expiry Alerts**:
    *   Rows with medicines expiring in < 30 days have a subtle Red background tint.

### 3.5 The "Admin Analytics" Charts
**Goal**: Beautiful data visualization.
*   **Revenue Chart**: Area chart with a Pink gradient fill (fading to transparent).
*   **Occupancy**: Radial bar chart.
*   **Table Style**: Minimalist, no vertical borders, bold headers in Deep Rose.

---

## 4. Implementation Guidelines (CSS Variables)
To implement this, update `index.css`:

```css
:root {
  /* Brand */
  --primary: #EB2F96;
  --primary-hover: #D61C7C;
  --secondary: #9E1068;
  --accent: #FFF0F6;
  
  /* Status */
  --success: #52C41A;
  --warning: #FAAD14;
  --error: #F5222D;
  
  /* Backgrounds */
  --bg-app: #FFF0F6; /* Pink-50 */
  --bg-card: #FFFFFF;
  --bg-glass: rgba(255, 255, 255, 0.7);
  
  /* Text */
  --text-main: #1F1F1F;
  --text-light: #8C8C8C;
  
  /* Effects */
  --shadow-card: 0 4px 12px rgba(235, 47, 150, 0.1);
  --shadow-floating: 0 8px 24px rgba(235, 47, 150, 0.2);
  --radius-lg: 16px;
  --radius-md: 8px;
}
```

This specification ensures the "Lunaris Pink" theme is applied consistently, creating a distinct, premium, and caring atmosphere for the hospital management system.
