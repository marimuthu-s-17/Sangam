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
        paper: {
          sx: {
            overflow: 'visible',
            borderRadius: 3,
            maxHeight: '90vh',
          },
        },
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
          px: 2.5,
          pt: 2,
        }}
      >
        <Typography component="span" variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            backgroundColor: 'action.hover',
            width: 30,
            height: 30,
            '&:hover': { backgroundColor: 'action.selected' },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '16px !important', px: 2.5, pb: 1.5 }}>
        <Box
          component="form"
          id="entity-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.();
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}
        >
          {children}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          size="small"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="entity-form"
          variant="contained"
          size="small"
          disabled={loading}
        >
          {loading ? 'Saving...' : submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
