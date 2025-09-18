export const theme = {
  colors: {
    primary: '#AEFF6F',
    background: '#141414',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    accent: '#AEFF6F',
    error: '#FF4444',
    success: '#AEFF6F',
    warning: '#FFAA00',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      color: '#FFFFFF',
    },
    caption: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      color: '#AAAAAA',
    },
  },
};