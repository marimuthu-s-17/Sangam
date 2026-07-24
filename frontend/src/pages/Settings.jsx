import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Settings as SettingsIcon,
  CloudDownload as BackupIcon,
  CloudUpload as RestoreIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  ClearAll as ClearIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import settingService from '../services/settingService';
import { useSettings } from '../context/SettingsContext';

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

const THEMES = [
  { value: 'light', label: 'Light Mode' },
  { value: 'dark', label: 'Dark Mode' },
];

const MODULES = [
  { value: '', label: 'All Modules' },
  { value: 'Members', label: 'Members' },
  { value: 'Auctions', label: 'Auctions' },
  { value: 'Expenses', label: 'Expenses' },
  { value: 'Loans', label: 'Loans' },
  { value: 'Settings', label: 'Settings' },
];

const auditColumns = [
  { field: 'id', headerName: 'ID', width: 70 },
  {
    field: 'created_at',
    headerName: 'Timestamp',
    flex: 0.9,
    minWidth: 160,
    renderCell: (p) => {
      if (!p.value) return '—';
      const d = new Date(p.value);
      return d.toLocaleString('en-IN');
    },
  },
  { field: 'module', headerName: 'Module', width: 120 },
  { field: 'user', headerName: 'User', width: 100 },
  { field: 'action', headerName: 'Action Description', flex: 1.5, minWidth: 250 },
];

export default function Settings() {
  const { refreshSettings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [restoreFile, setRestoreFile] = useState(null);

  // Filters State
  const [filterSearch, setFilterSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      community_name: '',
      default_commission: '2.00',
      default_monthly_contribution: '1000.00',
      currency: 'INR',
      theme: 'light',
    },
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingService.getSettings();
      reset({
        community_name: res.data.community_name,
        default_commission: String(res.data.default_commission),
        default_monthly_contribution: String(res.data.default_monthly_contribution),
        currency: res.data.currency,
        theme: res.data.theme,
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
      setSnack({ open: true, msg: 'Error loading settings details.', sev: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const params = { limit: 100 };
      if (filterSearch.trim()) params.search = filterSearch.trim();
      if (filterModule) params.module = filterModule;
      if (filterStartDate) params.start_date = filterStartDate;
      if (filterEndDate) params.end_date = filterEndDate;

      const res = await settingService.getAuditLogs(params);
      setAuditLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setSnack({ open: true, msg: 'Error loading audit logs.', sev: 'error' });
    } finally {
      setLogsLoading(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch logs whenever filters change
  useEffect(() => {
    fetchAuditLogs();
  }, [filterSearch, filterModule, filterStartDate, filterEndDate]);

  const onSubmit = async (data) => {
    try {
      await settingService.updateSettings({
        community_name: data.community_name,
        default_commission: Number(data.default_commission),
        default_monthly_contribution: Number(data.default_monthly_contribution),
        currency: data.currency,
        theme: data.theme,
      });
      await refreshSettings();
      setSnack({ open: true, msg: 'System settings saved successfully.', sev: 'success' });
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSnack({ open: true, msg: 'Error saving settings.', sev: 'error' });
    }
  };

  const handleBackup = async () => {
    try {
      const res = await settingService.getBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `sangam_database_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setSnack({ open: true, msg: 'Backup JSON generated and downloaded.', sev: 'success' });
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to export backup:', err);
      setSnack({ open: true, msg: 'Failed to download backup.', sev: 'error' });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setRestoreFile(e.target.files[0]);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      setSnack({ open: true, msg: 'Please select a backup JSON file first.', sev: 'warning' });
      return;
    }
    const formData = new FormData();
    formData.append('file', restoreFile);
    try {
      await settingService.restoreBackup(formData);
      setSnack({ open: true, msg: 'Database successfully restored from backup!', sev: 'success' });
      setRestoreFile(null);
      fetchSettings();
      fetchAuditLogs();
    } catch (err) {
      console.error('Failed to restore backup:', err);
      setSnack({ open: true, msg: 'Error restoring backup file.', sev: 'error' });
    }
  };

  const handleClearFilters = () => {
    setFilterSearch('');
    setFilterModule('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader title="Settings" subtitle="Configure Sangam community options, database backups, and view logs" />

      <Grid container spacing={4}>
        {/* Settings Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 1, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Community Preferences
              </Typography>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={3}>
                  <Controller
                    name="community_name"
                    control={control}
                    rules={{ required: 'Community name is required' }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Community / Sangam Name"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="default_commission"
                        control={control}
                        rules={{ required: 'Required', min: { value: 0, message: 'min 0' } }}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Default Commission (%)"
                            type="number"
                            fullWidth
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="default_monthly_contribution"
                        control={control}
                        rules={{ required: 'Required', min: { value: 0, message: 'min 0' } }}
                        render={({ field, fieldState }) => (
                          <TextField
                            {...field}
                            label="Default Installment (₹)"
                            type="number"
                            fullWidth
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="currency"
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} select label="Currency" fullWidth>
                            {CURRENCIES.map((c) => (
                              <MenuItem key={c.value} value={c.value}>
                                {c.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Controller
                        name="theme"
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} select label="Theme" fullWidth>
                            {THEMES.map((t) => (
                              <MenuItem key={t.value} value={t.value}>
                                {t.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Button variant="contained" type="submit" startIcon={<SaveIcon />} sx={{ alignSelf: 'flex-start', px: 4 }}>
                    Save Preferences
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Backup & Restore Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 1, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Database Backup & Recovery
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Export all database tables into a single JSON file, or restore a previous state by uploading a JSON backup file.
              </Typography>

              <Stack spacing={4}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Download System Backup
                  </Typography>
                  <Button variant="outlined" color="primary" startIcon={<BackupIcon />} onClick={handleBackup}>
                    Export Backup JSON
                  </Button>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Restore Database State
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="outlined" component="label" color="warning" startIcon={<RestoreIcon />}>
                      Select JSON File
                      <input type="file" accept=".json" hidden onChange={handleFileChange} />
                    </Button>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      {restoreFile ? restoreFile.name : 'No file selected'}
                    </Typography>
                  </Stack>
                  {restoreFile && (
                    <Button variant="contained" color="error" onClick={handleRestore} sx={{ mt: 2 }}>
                      Restore Database Now
                    </Button>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Logs Table */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  System Audit Logs
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Filter and inspect historical system operations and records
                </Typography>
              </Box>
              <Button variant="outlined" size="small" startIcon={<HistoryIcon />} onClick={fetchAuditLogs}>
                Refresh
              </Button>
            </Box>

            {/* Logs Filtering Bar */}
            <Box sx={{ p: 2.5, backgroundColor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    label="Search Action"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Search query..."
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    select
                    label="Module Filter"
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    fullWidth
                    size="small"
                  >
                    {MODULES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 2.5 }}>
                  <TextField
                    type="date"
                    label="Start Date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2.5 }}>
                  <TextField
                    type="date"
                    label="End Date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 1 }}>
                  <Button
                    variant="text"
                    color="secondary"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                    fullWidth
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ height: 450 }}>
              <DataGrid
                rows={auditLogs}
                columns={auditColumns}
                loading={logsLoading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
                sx={{ border: 'none' }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Toast Notifications */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.sev} variant="filled" sx={{ borderRadius: 3 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
