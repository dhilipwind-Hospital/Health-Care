// Navy/Teal Professional Theme for Ayphen Care
export const publicTheme = {
  token: {
    // Primary Colors (Navy/Teal)
    colorPrimary: '#10B981',      // Primary Teal/Emerald - Main brand color
    colorPrimaryHover: '#34D399',  // Lighter teal
    colorPrimaryActive: '#059669', // Darker teal
    
    // Secondary Colors (Blue)
    colorSuccess: '#10B981',       // Teal/Emerald
    colorInfo: '#3B82F6',          // Blue
    colorLink: '#3B82F6',          // Blue
    
    // Background Colors
    colorBgLayout: '#F8FAFC',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    
    // Border & Radius
    borderRadius: 12,
    colorBorder: '#E2E8F0',
    
    // Typography
    fontFamily: "'Inter', 'Poppins', 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Text Colors
    colorText: '#1E293B',
    colorTextSecondary: '#64748B',
    colorTextTertiary: '#94A3B8',
    
    // Shadows
    boxShadow: '0 2px 8px rgba(30, 58, 95, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(30, 58, 95, 0.12)',
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 8,
      borderRadiusLG: 10,
      borderRadiusSM: 6,
      colorPrimary: '#10B981',      // Primary teal
      colorPrimaryHover: '#34D399',  // Lighter teal
      colorPrimaryActive: '#059669', // Darker teal
      fontWeight: 600,
    },
    Card: {
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(30, 58, 95, 0.06)',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Menu: {
      itemBorderRadius: 8,
    },
    Tag: {
      borderRadius: 6,
    },
  },
};

// Default theme for internal portals (Navy/Teal)
export const defaultTheme = {
  token: {
    colorPrimary: '#10B981',
    colorInfo: '#3B82F6',
    colorLink: '#3B82F6',
    colorSuccess: '#10B981',
    borderRadius: 12,
    fontFamily: 'Inter, "Open Sans", Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    colorBgLayout: '#F8FAFC',
    colorBorder: '#E2E8F0',
    colorTextSecondary: '#64748B',
  },
  components: {
    Button: {
      colorPrimary: '#10B981',
      colorPrimaryHover: '#34D399',
      colorPrimaryActive: '#059669',
      colorSuccess: '#10B981',
      controlHeight: 38,
    },
    Tag: { colorPrimary: '#3B82F6' },
    Switch: { colorPrimary: '#10B981' },
    Select: { colorPrimary: '#3B82F6' },
  },
};

// Color palette constants for use in components (Navy/Teal Theme)
export const colors = {
  pink: {
    50: '#EFF6FF',      // Background - Light Blue
    100: '#DBEAFE',     // Very light blue
    200: '#BFDBFE',     // Soft blue for hover states
    400: '#60A5FA',     // Interactive elements
    500: '#3B82F6',     // Primary blue
    600: '#2563EB',     // Darker blue
    700: '#1D4ED8',     // Headings
    800: '#1E3A5F',     // Navy
  },
  maroon: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    400: '#3B82F6',  // Alias to blue for backward compatibility
    500: '#1E3A5F',  // Navy
    600: '#1D4ED8',
    700: '#1E3A8A',
    800: '#0F172A',
  },
  teal: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    400: '#34D399',  // Primary teal/emerald
    500: '#10B981',  // Main teal
  },
  neutral: {
    text: '#1E293B',
    white: '#FFFFFF',
    lightGray: '#F8FAFC',
  },
};
