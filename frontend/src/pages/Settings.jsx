import { useState, useEffect, useMemo, useCallback } from 'react';
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
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { createColumnHelper } from '@tanstack/react-table';
import ReusableTable from '../components/table/ReusableTable';
import {
  Settings as SettingsIcon,
  CloudDownload as BackupIcon,
  CloudUpload as RestoreIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  ClearAll as ClearIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  SettingsSuggest as SystemIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import settingService from '../services/settingService';
import { useSettings } from '../context/SettingsContext';
import { useAppTheme } from '../context/ThemeContext';
import { useTranslation } from '../context/LanguageContext';
import { formatCurrency, formatDate } from '../utils/formatters';

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export default function Settings() {
  const { refreshSettings } = useSettings();
  const { themeMode, setThemeMode, resolvedThemeMode } = useAppTheme();
  const { t, language, setLanguage } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [restoreFile, setRestoreFile] = useState(null);

  // Live Theme Preview State (Separate from actual applied theme until user saves)
  const [previewThemeMode, setPreviewThemeMode] = useState(themeMode);

  // Filters State
  const [filterSearch, setFilterSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const MODULES = [
    { value: '', label: t('allModules') || 'All Modules' },
    { value: 'Members', label: t('members') || 'Members' },
    { value: 'Auctions', label: t('auctions') || 'Auctions' },
    { value: 'Expenses', label: t('expenses') || 'Expenses' },
    { value: 'Loans', label: t('loans') || 'Loans' },
    { value: 'Settings', label: t('settings') || 'Settings' },
  ];

  const columnHelper = createColumnHelper();
  const auditColumns = useMemo(() => [
    columnHelper.accessor('id', { header: t('id'), meta: { align: 'center' } }),
    columnHelper.accessor('created_at', {
      header: 'Timestamp',
      meta: { align: 'left' },
      cell: (info) => {
        if (!info.getValue()) return '—';
        const d = new Date(info.getValue());
        return d.toLocaleString(language === 'ta' ? 'ta-IN' : 'en-IN');
      },
    }),
    columnHelper.accessor('module', { header: 'Module', meta: { align: 'center' } }),
    columnHelper.accessor('user', { header: 'User', meta: { align: 'center' } }),
    columnHelper.accessor('action', {
      header: 'Action Description',
      meta: { align: 'left' },
      cell: (info) => (
        <Tooltip title={info.getValue()} enterDelay={300} arrow>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap', 
            width: '100%', 
            display: 'block' 
          }}>
            {info.getValue()}
          </span>
        </Tooltip>
      )
    }),
  ], [columnHelper, t, language]);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      community_name: '',
      default_commission: '2.00',
      default_monthly_contribution: '1000.00',
      currency: 'INR',
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
      setAuditLogs(res.data?.data || []);
      setTotal(res.data?.total || 0);
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
        theme: resolvedThemeMode, // Keep compatibility
      });
      // Permanently apply selected theme mode
      setThemeMode(previewThemeMode);
      await refreshSettings();
      setSnack({ open: true, msg: t('saveSettings') + ' - Success', sev: 'success' });
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

  // Resolved Preview Mode (maps 'system' to light/dark based on browser preference)
  const resolvedPreviewMode = useMemo(() => {
    if (previewThemeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return previewThemeMode;
  }, [previewThemeMode]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader title={t('settingsTitle')} subtitle={t('settingsSubtitle')} />

      <Grid container spacing={3}>
        {/* Settings Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Card sx={{ p: 0.5 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('systemDefaults')}
                  </Typography>

                  <Controller
                    name="community_name"
                    control={control}
                    rules={{ required: 'Community name is required' }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label={t('communityName')}
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
                            label={t('defaultCommission')}
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
                            label={t('defaultContribution')}
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
                          <TextField {...field} select label={t('defaultCurrency')} fullWidth>
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
                      <TextField
                        select
                        label="Language / மொழி"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="en">English</MenuItem>
                        <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Theme Settings Card with Custom Theme Selection Cards */}
              <Card sx={{ p: 0.5 }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {t('themeSelection')}
                  </Typography>

                  <Grid container spacing={2}>
                    {[
                      { mode: 'light', label: t('themeLight'), icon: <LightIcon sx={{ fontSize: 24 }} />, bg: '#FFFFFF', color: '#1A1A1A', border: '#EDEAE5' },
                      { mode: 'dark', label: t('themeDark'), icon: <DarkIcon sx={{ fontSize: 24 }} />, bg: '#18181B', color: '#F4F4F5', border: '#27272A' },
                      { mode: 'system', label: t('themeSystem'), icon: <SystemIcon sx={{ fontSize: 24 }} />, bg: 'linear-gradient(135deg, #FFFFFF 50%, #18181B 50%)', color: '#F4A623', border: '#C8C0B4' },
                    ].map((themeOpt) => {
                      const isSelected = previewThemeMode === themeOpt.mode;
                      return (
                        <Grid size={{ xs: 4 }} key={themeOpt.mode}>
                          <Box
                            onClick={() => setPreviewThemeMode(themeOpt.mode)}
                            sx={{
                              p: 2,
                              borderRadius: 2.5,
                              cursor: 'pointer',
                              textAlign: 'center',
                              background: themeOpt.mode === 'system' ? themeOpt.bg : (isSelected ? (themeOpt.mode === 'dark' ? '#27272A' : '#FFF9EF') : (themeOpt.mode === 'dark' ? '#121214' : '#FAFAF8')),
                              border: '2px solid',
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                borderColor: 'primary.light',
                              },
                            }}
                          >
                            <Box sx={{ color: themeOpt.color, mb: 1, display: 'flex', justifyContent: 'center' }}>
                              {themeOpt.icon}
                            </Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: resolvedThemeMode === 'dark' ? '#F4F4F5' : '#1A1A1A' }}>
                              {themeOpt.label}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Live Theme Preview Panel */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: resolvedPreviewMode === 'dark' ? '#27272A' : '#EDEAE5',
                      bgcolor: resolvedPreviewMode === 'dark' ? '#0E0E10' : '#F5F1EC',
                      mt: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: resolvedPreviewMode === 'dark' ? '#A1A1AA' : '#71717A', display: 'block', mb: 1 }}>
                      {t('themePreview')} ({previewThemeMode.toUpperCase()})
                    </Typography>

                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: resolvedPreviewMode === 'dark' ? '#18181B' : '#FFFFFF',
                        border: '1px solid',
                        borderColor: resolvedPreviewMode === 'dark' ? '#27272A' : '#EDEAE5',
                        color: resolvedPreviewMode === 'dark' ? '#F4F4F5' : '#1A1A1A',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="caption" sx={{ color: resolvedPreviewMode === 'dark' ? '#A1A1AA' : '#71717A', display: 'block' }}>
                            {t('totalMembers')}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            120
                          </Typography>
                        </Box>
                        <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: resolvedPreviewMode === 'dark' ? '#C77F00' : '#F4A623', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LightIcon sx={{ fontSize: 16, color: '#fff' }} />
                        </Box>
                      </Stack>
                    </Box>
                  </Box>

                  <Button variant="contained" type="submit" startIcon={<SaveIcon />} sx={{ alignSelf: 'flex-start', px: 4, mt: 1 }}>
                    {t('saveSettings')}
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          </form>
        </Grid>

        {/* Backup & Restore Panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 0.5, height: '100%' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('backupRestore')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Export all database tables into a single JSON file, or restore a previous state by uploading a JSON backup file.
              </Typography>

              <Stack spacing={3} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Download System Backup
                  </Typography>
                  <Button variant="outlined" color="primary" startIcon={<BackupIcon />} onClick={handleBackup} size="small">
                    {t('exportBackup')}
                  </Button>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Restore Database State
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Button variant="outlined" component="label" color="warning" startIcon={<RestoreIcon />} size="small">
                      {t('selectBackupFile')}
                      <input type="file" accept=".json" hidden onChange={handleFileChange} />
                    </Button>
                    <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.8rem' }}>
                      {restoreFile ? restoreFile.name : 'No file selected'}
                    </Typography>
                  </Stack>
                  {restoreFile && (
                    <Button variant="contained" color="error" onClick={handleRestore} sx={{ mt: 2 }} size="small">
                      {t('restoreDatabase')}
                    </Button>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Logs Table */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                  {t('auditLogsTitle')}
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
            <Box sx={{ p: 2, backgroundColor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
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
                    size="small"
                  >
                    Reset
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ height: 450 }}>
              <ReusableTable
                data={auditLogs}
                columns={auditColumns}
                loading={logsLoading}
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
