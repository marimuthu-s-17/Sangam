import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

export default function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const gradients = {
    primary: isDark ? 'linear-gradient(135deg, #F4A623 0%, #F7C965 100%)' : 'linear-gradient(135deg, #1A1A1A 0%, #3E3E3E 100%)',
    secondary: 'linear-gradient(135deg, #F4A623 0%, #F7C965 100%)',
    success: 'linear-gradient(135deg, #2ECC71 0%, #6DDE9F 100%)',
    info: 'linear-gradient(135deg, #4A90D9 0%, #7EB7F0 100%)',
    warning: 'linear-gradient(135deg, #E74C3C 0%, #F08B81 100%)',
    error: 'linear-gradient(135deg, #E74C3C 0%, #F08B81 100%)',
  };

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        bgcolor: 'background.paper',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 3,
          background: gradients[color] || gradients.primary,
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                mb: 0.5,
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                fontSize: { xs: '1.35rem', sm: '1.55rem' },
                lineHeight: 1.15,
                mb: 0,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75 }}>
                <TrendingUpIcon sx={{ fontSize: 14, color: 'success.main' }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontSize: '0.7rem' }}
                >
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: gradients[color] || gradients.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isDark ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.1)',
              '& svg': {
                color: isDark && color === 'primary' ? '#1A1A1A' : '#ffffff',
                fontSize: 20,
              },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
