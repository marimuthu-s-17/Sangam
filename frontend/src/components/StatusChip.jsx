import { Chip } from '@mui/material';

const statusConfig = {
  active: { label: 'Active', bg: '#EAF8EE', color: '#2ECC71' },
  inactive: { label: 'Inactive', bg: '#F3F3F3', color: '#8A8A8A' },
  upcoming: { label: 'Upcoming', bg: '#F5EFE6', color: '#1A1A1A' },
  scheduled: { label: 'Scheduled', bg: '#EAF4FF', color: '#4A90D9' },
  completed: { label: 'Completed', bg: '#EAF8EE', color: '#2ECC71' },
  cancelled: { label: 'Cancelled', bg: '#FCECEC', color: '#E74C3C' },
  payment: { label: 'Payment', bg: '#FCECEC', color: '#E74C3C' },
  receipt: { label: 'Receipt', bg: '#EAF8EE', color: '#2ECC71' },
  adjustment: { label: 'Adjustment', bg: '#FFF6E8', color: '#F4A623' },
};

export default function StatusChip({ status, size = 'small' }) {
  const config = statusConfig[status] || { label: status, bg: '#F3F3F3', color: '#8A8A8A' };

  return (
    <Chip
      label={config.label}
      size={size}
      variant="filled"
      sx={{
        fontWeight: 700,
        fontSize: '0.7rem',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.bg}`,
      }}
    />
  );
}
