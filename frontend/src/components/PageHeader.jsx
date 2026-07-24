import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function PageHeader({ title, subtitle, buttonText, onButtonClick, icon }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        mb: 3,
        gap: 2,
        p: { xs: 2.2, sm: 2.6 },
        borderRadius: 4,
        border: '1px solid #F0EBE2',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,249,239,0.95))',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            fontSize: { xs: '1.45rem', sm: '1.7rem' },
            letterSpacing: '-0.03em',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 0.5,
              fontSize: '0.9rem',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      {buttonText && (
        <Button
          variant="contained"
          startIcon={icon || <AddIcon />}
          onClick={onButtonClick}
          sx={{
            px: 3,
            py: 1.1,
            fontSize: '0.9rem',
            whiteSpace: 'nowrap',
            borderRadius: 999,
          }}
        >
          {buttonText}
        </Button>
      )}
    </Box>
  );
}
