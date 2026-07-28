import { createTheme } from '@mui/material/styles';

export const getTheme = (mode = 'light') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#F4A623' : '#1A1A1A',
        light: isDark ? '#F7C965' : '#3F3F3F',
        dark: isDark ? '#C77F00' : '#0F0F0F',
        contrastText: isDark ? '#1A1A1A' : '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#E4E4E7' : '#F4A623',
        light: isDark ? '#FFFFFF' : '#F7C965',
        dark: isDark ? '#A1A1AA' : '#C77F00',
        contrastText: isDark ? '#1A1A1A' : '#1A1A1A',
      },
      background: {
        default: isDark ? '#0B0F19' : '#F5F1EC',
        paper: isDark ? '#161B22' : '#FFFFFF',
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
        primary: isDark ? '#F0F6FC' : '#1A1A1A',
        secondary: isDark ? '#8B949E' : '#71717A',
      },
      divider: isDark ? '#21262D' : '#E8E4DE',
    },
    typography: {
      fontFamily: '"Inter", "General Sans", "Satoshi", "sans-serif"',
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.03em',
        fontSize: '1.55rem',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.02em',
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
        fontSize: '1.05rem',
      },
      subtitle1: {
        fontWeight: 600,
        fontSize: '0.9rem',
      },
      subtitle2: {
        fontWeight: 600,
        fontSize: '0.82rem',
      },
      body1: {
        fontSize: '0.9rem',
        lineHeight: 1.55,
      },
      body2: {
        fontSize: '0.84rem',
        lineHeight: 1.5,
      },
      caption: {
        fontSize: '0.73rem',
        lineHeight: 1.4,
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.84rem',
      },
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '7px 16px',
            boxShadow: 'none',
            fontSize: '0.84rem',
            fontWeight: 600,
            textTransform: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: 'none',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          sizeSmall: {
            padding: '4px 12px',
            fontSize: '0.78rem',
          },
          contained: {
            backgroundColor: isDark ? '#F4A623' : '#1A1A1A',
            color: isDark ? '#1A1A1A' : '#FFFFFF',
            '&:hover': {
              backgroundColor: isDark ? '#F7C965' : '#2C2C2C',
            },
          },
          outlined: {
            borderColor: isDark ? '#30363D' : '#E8E4DE',
            color: isDark ? '#F0F6FC' : '#1A1A1A',
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
            '&:hover': {
              borderColor: isDark ? '#8B949E' : '#C8C0B4',
              backgroundColor: isDark ? '#21262D' : '#FAFAF8',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
            border: isDark ? '1px solid #30363D' : '1px solid #EDEAE5',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 16px rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-1px)',
              borderColor: isDark ? '#8B949E' : '#EDEAE5',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            border: isDark ? '1px solid #30363D' : 'none',
          },
          elevation1: {
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(22, 27, 34, 0.85)' : 'rgba(255, 253, 249, 0.85)',
            color: isDark ? '#F0F6FC' : '#1A1A1A',
            boxShadow: 'none',
            borderBottom: isDark ? '1px solid #21262D' : '1px solid #EDEAE5',
            backdropFilter: 'blur(16px)',
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
              borderRadius: 10,
              backgroundColor: isDark ? '#0D1117' : '#FAFAF8',
              fontSize: '0.875rem',
              '& fieldset': {
                borderColor: isDark ? '#30363D' : '#E8E4DE',
                transition: 'border-color 0.2s ease',
              },
              '&:hover fieldset': {
                borderColor: isDark ? '#8B949E' : '#C8C0B4',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#F4A623',
                borderWidth: '1.5px',
              },
            },
            '& .MuiInputLabel-root': {
              fontSize: '0.84rem',
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
            border: isDark ? '1px solid #30363D' : 'none',
            backgroundColor: isDark ? '#161B22' : '#FFFFFF',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 24,
          },
          sizeSmall: {
            height: 22,
            fontSize: '0.68rem',
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: '10px !important',
            border: isDark ? '1px solid #21262D' : '1px solid #EDEAE5',
            boxShadow: 'none',
            '&::before': { display: 'none' },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-expanded': {
              boxShadow: 'none',
              border: isDark ? '1px solid #8B949E' : '1px solid #D4CFC7',
            },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            minHeight: '48px !important',
            padding: '0 16px',
            '&.Mui-expanded': {
              minHeight: '48px !important',
            },
          },
          content: {
            margin: '10px 0 !important',
            '&.Mui-expanded': {
              margin: '10px 0 !important',
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: '12px 16px 16px',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.84rem',
            minHeight: 42,
            padding: '8px 16px',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 42,
          },
          indicator: {
            height: 2.5,
            borderRadius: 2,
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: '0.84rem',
            padding: '10px 14px',
            borderBottom: isDark ? '1px solid #21262D' : '1px solid #F0ECE6',
          },
          head: {
            fontWeight: 700,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: isDark ? '#8B949E' : '#71717A',
            backgroundColor: isDark ? '#161B22' : '#F8F5F0',
            padding: '10px 14px',
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            boxShadow: '0 4px 16px rgba(26, 26, 26, 0.2)',
            '&:hover': {
              boxShadow: '0 6px 24px rgba(26, 26, 26, 0.25)',
            },
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiAlert-root': {
              borderRadius: 10,
              fontSize: '0.84rem',
            },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            fontSize: '0.8rem',
          },
          selectLabel: {
            fontSize: '0.8rem',
          },
          displayedRows: {
            fontSize: '0.8rem',
          },
        },
      },
    },
  });
};

const defaultTheme = getTheme('light');
export default defaultTheme;
