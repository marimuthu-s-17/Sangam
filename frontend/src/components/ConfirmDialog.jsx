import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  useTheme,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

export default function ConfirmDialog({
  open,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3 } },
      }}
    >
      <DialogTitle component="div" sx={{ pb: 0.5, pt: 2, px: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WarningIcon sx={{ color: isDark ? '#F87171' : '#DC2626', fontSize: 18 }} />
          </Box>
          <Typography component="span" variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 2.5, pb: 1 }}>
        <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.84rem', lineHeight: 1.5 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, pt: 0.5 }}>
        <Button
          onClick={onCancel}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'action.hover' },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          size="small"
          color="error"
          sx={{
            background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)',
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
