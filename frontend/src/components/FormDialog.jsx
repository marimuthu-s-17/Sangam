import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function FormDialog({
  open,
  title,
  children,
  onClose,
  onSubmit,
  submitText = 'Save',
  maxWidth = 'sm',
  loading = false,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{
        paper: { sx: { overflow: 'visible', borderRadius: 4, p: 0.5 } },
      }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          pt: 2.5,
        }}
      >
        <Typography component="span" variant="h6" sx={{ fontWeight: 700, fontSize: '1.08rem' }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            backgroundColor: '#FAF7F2',
            '&:hover': { backgroundColor: '#F0EBE2' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '24px !important', px: 3, pb: 2.5 }}>
        <Box
          component="form"
          id="entity-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          {children}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="entity-form"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Saving...' : submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
