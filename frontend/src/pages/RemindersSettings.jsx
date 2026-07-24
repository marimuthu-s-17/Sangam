import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Checkbox,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  NotificationsActive as NotificationsIcon,
  PlayArrow as StartIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import reminderService from '../services/reminderService';
import { useTranslation } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatters';

export default function RemindersSettings() {
  const { t } = useTranslation();
  const [globalSettings, setGlobalSettings] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  // Preview dummy template variables
  const previewData = {
    member_name: 'Marimuthu',
    auction_name: 'Premium Auction A',
    contribution_amount: '2,500.00',
    due_date: '08-08-2026',
    payment_status: 'Unpaid'
  };

  const fetchGlobalSettings = async () => {
    try {
      const res = await reminderService.getGlobalSettings();
      setGlobalSettings(res.data);
    } catch (err) {
      console.error('Failed to load global reminder settings', err);
      setSnack({ open: true, msg: 'Failed to load settings.', sev: 'error' });
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await reminderService.getAllHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load reminder history logs', err);
      setSnack({ open: true, msg: 'Failed to load reminder history.', sev: 'error' });
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchGlobalSettings(), fetchHistory()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleUpdateSetting = async (key, val) => {
    if (!globalSettings) return;
    const updated = { ...globalSettings, [key]: val };
    setGlobalSettings(updated);
    try {
      await reminderService.updateGlobalSettings({ [key]: val });
    } catch (err) {
      console.error('Failed to update setting', err);
      setSnack({ open: true, msg: 'Failed to save changes.', sev: 'error' });
    }
  };

  const triggerSchedulerCheck = async () => {
    setActionLoading(true);
    try {
      const res = await reminderService.triggerSchedulerCheck();
      setSnack({ open: true, msg: res.data.message || 'Check triggered.', sev: 'success' });
      await fetchHistory();
    } catch (err) {
      console.error('Failed to run scheduler check', err);
      setSnack({ open: true, msg: 'Failed to run scheduler check.', sev: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const messagePreview = useMemo(() => {
    if (!globalSettings?.template) return '';
    let preview = globalSettings.template;
    Object.entries(previewData).forEach(([key, val]) => {
      preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    });
    return preview;
  }, [globalSettings?.template]);

  const historyColumns = [
    { field: 'id', headerName: 'ID', width: 70, align: 'center', headerAlign: 'center' },
    {
      field: 'sent_at',
      headerName: t('sentAt') || 'Sent At',
      width: 170,
      valueFormatter: (value) => new Date(value).toLocaleString()
    },
    { field: 'member_name', headerName: 'Member', width: 140 },
    { field: 'reminder_type', headerName: 'Channel', width: 100, align: 'center', headerAlign: 'center', renderCell: (p) => p.value.toUpperCase() },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p) => (
        <Alert 
          severity={p.value === 'delivered' ? 'success' : p.value === 'sent' ? 'info' : 'error'} 
          sx={{ py: 0, px: 1, fontSize: '0.75rem', height: 24, display: 'flex', alignItems: 'center' }}
        >
          {p.value.toUpperCase()}
        </Alert>
      )
    },
    { 
      field: 'message', 
      headerName: 'Message Content', 
      flex: 1, 
      minWidth: 300,
      renderCell: (p) => (
        <Tooltip title={p.value} enterDelay={300} arrow>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap', 
            width: '100%', 
            display: 'block' 
          }}>
            {p.value}
          </span>
        </Tooltip>
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <PageHeader 
        title={t('reminderSettings') || "Global Reminders Control"} 
        subtitle="Manage automated SMS & WhatsApp notification schedules, repeat rules, and review complete delivery logs."
      />

      <Grid container spacing={3}>
        {/* Configurations column */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Automated Reminders Rules</Typography>
                
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Enable Automated Reminders</Typography>
                      <Typography variant="caption" color="text.secondary">Automatically dispatch alerts on the 8th and repeat every 3 days.</Typography>
                    </Box>
                    <Checkbox
                      checked={globalSettings?.is_enabled ?? true}
                      onChange={(e) => handleUpdateSetting('is_enabled', e.target.checked)}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Global SMS Alerts</Typography>
                      <Typography variant="caption" color="text.secondary">Allow text messages globally</Typography>
                    </Box>
                    <Checkbox
                      checked={globalSettings?.sms_enabled ?? true}
                      onChange={(e) => handleUpdateSetting('sms_enabled', e.target.checked)}
                      disabled={!(globalSettings?.is_enabled)}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Global WhatsApp Alerts</Typography>
                      <Typography variant="caption" color="text.secondary">Allow WhatsApp notifications globally</Typography>
                    </Box>
                    <Checkbox
                      checked={globalSettings?.whatsapp_enabled ?? true}
                      onChange={(e) => handleUpdateSetting('whatsapp_enabled', e.target.checked)}
                      disabled={!(globalSettings?.is_enabled)}
                    />
                  </Box>

                  <TextField
                    label="Reminder Delivery Time (HH:MM)"
                    placeholder="09:00"
                    size="small"
                    value={globalSettings?.reminder_time ?? '09:00'}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, reminder_time: e.target.value })}
                    onBlur={() => handleUpdateSetting('reminder_time', globalSettings?.reminder_time)}
                    disabled={!(globalSettings?.is_enabled)}
                  />

                  <TextField
                    label="Default Message Template"
                    multiline
                    rows={4}
                    value={globalSettings?.template ?? ''}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, template: e.target.value })}
                    onBlur={() => handleUpdateSetting('template', globalSettings?.template)}
                    disabled={!(globalSettings?.is_enabled)}
                    helperText="Tags: {member_name}, {auction_name}, {contribution_amount}, {due_date}, {payment_status}"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Template Live Preview */}
            <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Live Template Preview</Typography>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-line' }}>{messagePreview}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Trigger Scheduler manually */}
            <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Trigger Automated Scan</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Forces a search across all active auctions for unpaid members and immediately dispatches SMS/WhatsApp alerts.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <StartIcon />}
                  onClick={triggerSchedulerCheck}
                  disabled={actionLoading || !(globalSettings?.is_enabled)}
                  fullWidth
                >
                  Run Automated Check & Send
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Global reminder log history */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: '100%', minHeight: 600 }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Global Log & Delivery Status</Typography>
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={fetchHistory} 
                  disabled={historyLoading}
                  size="small"
                >
                  Refresh
                </Button>
              </Stack>

              <Box sx={{ flexGrow: 1, height: 500 }}>
                <DataGrid
                  rows={history}
                  columns={historyColumns}
                  loading={historyLoading}
                  pageSizeOptions={[10, 20, 50]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 10 } }
                  }}
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: 'background.paper',
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar 
        open={snack.open} 
        autoHideDuration={4000} 
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.sev} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
