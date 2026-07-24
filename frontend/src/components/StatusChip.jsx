import { Chip } from '@mui/material';

const statusConfig = {
  active: { label: 'Active', bg: '#DCFCE7', color: '#16A34A' },
  inactive: { label: 'Inactive', bg: '#F4F4F5', color: '#71717A' },
  upcoming: { label: 'Upcoming', bg: '#FEF3C7', color: '#D97706' },
  scheduled: { label: 'Scheduled', bg: '#DBEAFE', color: '#2563EB' },
  completed: { label: 'Completed', bg: '#DCFCE7', color: '#16A34A' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#DC2626' },
  payment: { label: 'Payment', bg: '#FEE2E2', color: '#DC2626' },
  receipt: { label: 'Receipt', bg: '#DCFCE7', color: '#16A34A' },
  adjustment: { label: 'Adjustment', bg: '#FEF3C7', color: '#D97706' },
};

export default function StatusChip({ status, size = 'small' }) {
  const config = statusConfig[status] || { label: status, bg: '#F4F4F5', color: '#71717A' };

  return (
    <Chip
      label={config.label}
      size={size}
      variant="filled"
      sx={{
        fontWeight: 600,
        fontSize: '0.68rem',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        backgroundColor: config.bg,
        color: config.color,
        border: 'none',
        borderRadius: 2,
        height: 22,
      }}
    />
  );
}
