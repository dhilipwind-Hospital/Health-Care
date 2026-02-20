# Navy Blue Theme Color Palette

## Primary Color System

### Main Colors
- **Primary Navy**: `#1E3A8A`
- **Sky Blue**: `#3B82F6`
- **Pure White**: `#FFFFFF`
- **Light Gray**: `#F8FAFC`

### Color Variations

#### Navy Blue Scale
- `--navy-50: #EFF6FF`   /* Lightest backgrounds */
- `--navy-100: #DBEAFE`  /* Subtle accents */
- `--navy-200: #BFDBFE`  /* Hover states */
- `--navy-300: #93C5FD`  /* Light accents */
- `--navy-400: #60A5FA`  /* Interactive elements */
- `--navy-500: #3B82F6`  /* Primary blue */
- `--navy-600: #2563EB`  /* Darker blue */
- `--navy-700: #1D4ED8`  /* Headings */
- `--navy-800: #1E3A8A`  /* Primary navy */
- `--navy-900: #1E293B`  /* Deep navy text */

#### Neutral Colors
- `--white: #FFFFFF`      /* Pure white */
- `--gray-50: #F8FAFC`    /* Lightest gray */
- `--gray-100: #F1F5F9`   /* Very light gray */
- `--gray-200: #E2E8F0`   /* Light gray */
- `--gray-300: #CBD5E1`   /* Medium light gray */
- `--gray-400: #94A3B8`   /* Medium gray */
- `--gray-500: #64748B`   /* Medium dark gray */
- `--gray-600: #475569`   /* Dark gray */
- `--gray-700: #334155`   /* Very dark gray */
- `--gray-800: #1E293B`   /* Deep gray */
- `--gray-900: #0F172A`   /* Darkest gray */

### Accent Colors
- **Text Navy**: `#1E293B`
- **Border Light**: `#E2E8F0`
- **Shadow Blue**: `rgba(30, 58, 138, 0.1)`
- **Accent Blue**: `#60A5FA`

### Semantic Colors
- **Primary**: `#3B82F6`
- **Primary Hover**: `#60A5FA`
- **Primary Active**: `#2563EB`
- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`
- **Info**: `#06B6D4`

### Glassmorphism Effects
- **Glass Background**: `rgba(255, 255, 255, 0.85)`
- **Glass Border**: `rgba(30, 58, 138, 0.1)`
- **Glass Shadow**: `0 8px 32px rgba(30, 58, 138, 0.1)`
- **Glass Backdrop**: `blur(10px)`

## CSS Variables Implementation

```css
:root {
  /* Navy Blue Theme Colors */
  --navy-50: #EFF6FF;
  --navy-100: #DBEAFE;
  --navy-200: #BFDBFE;
  --navy-300: #93C5FD;
  --navy-400: #60A5FA;
  --navy-500: #3B82F6;
  --navy-600: #2563EB;
  --navy-700: #1D4ED8;
  --navy-800: #1E3A8A;
  --navy-900: #1E293B;

  /* Neutral Colors */
  --white: #FFFFFF;
  --gray-50: #F8FAFC;
  --gray-100: #F1F5F9;
  --gray-200: #E2E8F0;
  --gray-300: #CBD5E1;
  --gray-400: #94A3B8;
  --gray-500: #64748B;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1E293B;
  --gray-900: #0F172A;

  /* Semantic Colors */
  --color-primary: #3B82F6;
  --color-primary-hover: #60A5FA;
  --color-primary-active: #2563EB;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #06B6D4;

  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-border: rgba(30, 58, 138, 0.1);
  --glass-shadow: 0 8px 32px rgba(30, 58, 138, 0.1);
  --glass-backdrop: blur(10px);
}
```

## Usage Guidelines

### Primary Applications
- **Hero Sections**: `--navy-800` background with `--white` text
- **Navigation**: `--white` background with `--navy-800` text
- **Buttons**: `--navy-500` background with `--white` text
- **Cards**: `--white` background with glassmorphism effects
- **Text**: `--navy-900` for headings, `--gray-600` for body

### Interactive States
- **Hover**: `--navy-400` for interactive elements
- **Active**: `--navy-600` for pressed states
- **Focus**: `--navy-200` border with `--navy-500` shadow

### Background Applications
- **Primary**: `--white` for main content
- **Secondary**: `--gray-50` for subtle sections
- **Accent**: `--navy-50` for highlighted areas
