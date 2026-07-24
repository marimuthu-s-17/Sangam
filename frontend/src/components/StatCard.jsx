import { Card, CardContent, Box, Typography } from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const gradients = {
  primary: 'linear-gradient(135deg, #1A1A1A 0%, #3E3E3E 100%)',
  secondary: 'linear-gradient(135deg, #F4A623 0%, #F7C965 100%)',
  success: 'linear-gradient(135deg, #2ECC71 0%, #6DDE9F 100%)',
  info: 'linear-gradient(135deg, #4A90D9 0%, #7EB7F0 100%)',
  warning: 'linear-gradient(135deg, #E74C3C 0%, #F08B81 100%)',
  error: 'linear-gradient(135deg, #E74C3C 0%, #F08B81 100%)',
};

export default function StatCard({ title, value, icon, color = 'primary', subtitle }) {
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF9F0 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 4,
          background: gradients[color] || gradients.primary,
        },
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                fontSize: '0.74rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                mb: 1,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                fontSize: { xs: '1.65rem', sm: '1.95rem' },
                lineHeight: 1.1,
                mb: 0.5,
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
                >
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '16px',
              background: gradients[color] || gradients.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 18px rgba(0, 0, 0, 0.12)',
              '& svg': {
                color: '#fff',
                fontSize: 24,
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
