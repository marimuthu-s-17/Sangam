import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1A1A1A',
      light: '#3F3F3F',
      dark: '#0F0F0F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F4A623',
      light: '#F7C965',
      dark: '#C77F00',
      contrastText: '#1A1A1A',
    },
    background: {
      default: '#F5F1EC',
      paper: '#FFFFFF',
    },
    success: {
      main: '#2ECC71',
      light: '#6DDE9F',
      dark: '#1E9D57',
    },
    error: {
      main: '#E74C3C',
      light: '#F08B81',
      dark: '#B83C2F',
    },
    warning: {
      main: '#F4A623',
      light: '#F8C767',
      dark: '#C77F00',
    },
    info: {
      main: '#4A90D9',
      light: '#7EB7F0',
      dark: '#2F6DB2',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#8A8A8A',
    },
    divider: '#EDEDED',
  },
  typography: {
    fontFamily: '"Inter", "General Sans", "Satoshi", "sans-serif"',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: '10px 18px',
          boxShadow: 'none',
          fontSize: '0.92rem',
          textTransform: 'none',
          '&:hover': {
            boxShadow: '0 8px 20px rgba(26, 26, 26, 0.12)',
          },
        },
        contained: {
          backgroundColor: '#1A1A1A',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#2C2C2C',
          },
        },
        outlined: {
          borderColor: '#EDEDED',
          color: '#1A1A1A',
          backgroundColor: '#FFFFFF',
          '&:hover': {
            borderColor: '#D8CDBE',
            backgroundColor: '#FCFBF9',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          border: '1px solid #F0EBE2',
          transition: 'all 0.25s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
        elevation1: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFDF9',
          color: '#1A1A1A',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          borderBottom: '1px solid #F0EBE2',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 16,
            backgroundColor: '#FCFBF9',
            '& fieldset': {
              borderColor: '#EDEDED',
            },
            '&:hover fieldset': {
              borderColor: '#D9D1C4',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#F4A623',
              borderWidth: '1.5px',
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.12)',
          border: '1px solid #F0EBE2',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
          fontSize: '0.72rem',
          px: 1,
          py: 0.2,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          borderRadius: 20,
          backgroundColor: 'transparent',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#FAF7F2',
            borderBottom: '1px solid #EFE9DE',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#8A8A8A',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #F5EFE6',
            fontSize: '0.9rem',
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: '#FFF9EF',
            },
            '&:nth-of-type(even)': {
              backgroundColor: '#FCFBF9',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #F5EFE6',
          },
        },
      },
    },
  },
});

export default theme;
