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
        mb: 2.5,
        gap: 1.5,
        py: 1,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: 'text.primary',
            fontSize: { xs: '1.35rem', sm: '1.5rem' },
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 0.3,
              fontSize: '0.82rem',
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
            px: 2.5,
            py: 0.9,
            fontSize: '0.84rem',
            whiteSpace: 'nowrap',
          }}
        >
          {buttonText}
        </Button>
      )}
    </Box>
  );
}
