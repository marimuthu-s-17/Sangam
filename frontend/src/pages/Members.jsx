import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Typography,
  Button,
  Drawer,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  TablePagination,
} from '@mui/material';
import { useTranslation } from '../context/LanguageContext';

import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  CloudUpload as ImportIcon,
  CloudDownload as ExportIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  People as PeopleIcon,
  CheckCircle as ActiveIcon,
  RemoveCircle as InactiveIcon,
  TrendingUp as NewIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
  ContactPhone as PhoneIcon,
  Home as HomeIcon,
  CalendarMonth as DateIcon,
  Notes as NotesIcon,
  Info as InfoIcon,
  AccountBalance as BankIcon,
  Gavel as AuctionIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import memberService from '../services/memberService';
import { formatDate, getTodayDate } from '../utils/formatters';

export default function Members() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total_members: 0,
    active_members: 0,
    inactive_members: 0,
    recently_joined: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  
  // Debounce search input to limit API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);
  
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 20,
  });
  
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [importSummary, setImportSummary] = useState(null);
  const [importFile, setImportFile] = useState(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', phone: '', age: '', gender: '', address: '', status: 'active', joined_date: getTodayDate(), notes: '' },
  });

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await memberService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const skip = paginationModel.page * paginationModel.pageSize;
      const limit = paginationModel.pageSize;

      const params = {
        skip,
        limit,
        sort_by: 'id',
        sort_order: 'desc',
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (ageFilter) params.age = ageFilter;

      const res = await memberService.getAll(params);
      setMembers(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to fetch members", err);
      setSnack({ open: true, msg: 'Error connecting to server.', sev: 'error' });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearch, statusFilter, ageFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleMemberAccordion = (id) => (event, isExpanded) => {
    setExpandedMemberId(isExpanded ? id : null);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleApplyFilters = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterOpen(false);
    fetchMembers();
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setAgeFilter('');
    setSearch('');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterOpen(false);
  };

  const openAdd = () => {
    setEditing(null);
    reset({ name: '', phone: '', age: '', gender: '', address: '', status: 'active', joined_date: getTodayDate(), notes: '' });
    setDialogOpen(true);
  };

  const openEdit = useCallback((m, e) => {
    e.stopPropagation();
    setEditing(m);
    reset({
      name: m.name,
      phone: m.phone,
      age: m.age,
      gender: m.gender || '',
      address: m.address || '',
      status: m.status,
      joined_date: m.joined_date,
      notes: m.notes || ''
    });
    setDialogOpen(true);
  }, [reset]);

  const onSubmit = async (d) => {
    try {
      const payload = { ...d, age: parseInt(d.age, 10) };
      if (editing) {
        await memberService.update(editing.id, payload);
        setSnack({ open: true, msg: 'Member updated successfully', sev: 'success' });
      } else {
        await memberService.create(payload);
        setSnack({ open: true, msg: 'Member created successfully', sev: 'success' });
      }
      fetchMembers();
      fetchStats();
      setDialogOpen(false);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Validation failed';
      setSnack({ open: true, msg: detail, sev: 'error' });
    }
  };

  const openDelete = useCallback((m, e) => {
    e.stopPropagation();
    setDeletingId(m.id);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = async () => {
    try {
      await memberService.delete(deletingId);
      setSnack({ open: true, msg: 'Member soft deleted (status marked INACTIVE)', sev: 'success' });
      fetchMembers();
      fetchStats();
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to delete member', sev: 'error' });
    } finally {
      setDeleteOpen(false);
    }
  };

  const openDetail = useCallback((m) => {
    setSelectedMember(m);
    setDetailOpen(true);
  }, []);

  const handleImportFileChange = (e) => {
    if (e.target.files[0]) {
      setImportFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const res = await memberService.importCsv(formData);
      setImportSummary(res.data);
      setSnack({ open: true, msg: 'Import completed', sev: 'success' });
      fetchMembers();
      fetchStats();
      setImportFile(null);
    } catch (err) {
      const detail = err.response?.data?.detail || 'CSV Import failed';
      setSnack({ open: true, msg: detail, sev: 'error' });
    }
  };

  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = ['ID', 'Name', 'Phone', 'Age', 'Gender', 'Address', 'Status', 'Joined Date'];
    const rows = members.map(m => [
      m.id,
      m.name,
      m.phone,
      m.age,
      m.gender || '',
      m.address ? `"${m.address.replace(/"/g, '""')}"` : '',
      m.status,
      m.joined_date
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `members_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Box sx={{ position: 'relative', pb: 4 }}>
      <PageHeader
        title={t('membersTitle')}
        subtitle={t('membersSubtitle')}
        buttonText={t('addMember')}
        onButtonClick={openAdd}
      />

      {/* Stats Cards Section */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          { title: t('totalMembers'), value: stats.total_members, icon: <PeopleIcon />, color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
          { title: t('activeMembers'), value: stats.active_members, icon: <ActiveIcon />, color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
          { title: t('inactiveMembers'), value: stats.inactive_members, icon: <InactiveIcon />, color: 'linear-gradient(135deg, #ed213a 0%, #93291e 100%)' },
          { title: t('recentlyJoined'), value: stats.recently_joined, icon: <NewIcon />, color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
        ].map((item, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card sx={{
              background: item.color,
              color: 'white',
              borderRadius: 2.5,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <CardContent sx={{ position: 'relative', zIndex: 2, p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.title}</Typography>
                    {statsLoading ? (
                      <Skeleton width={60} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                    ) : (
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{item.value}</Typography>
                    )}
                  </Box>
                  <Box sx={{ opacity: 0.6 }}>{item.icon}</Box>
                </Box>
              </CardContent>
              <Box sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                zIndex: 1,
              }} />
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search & Actions Bar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          variant="outlined"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={handleSearchChange}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 360 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
            }
          }}
        />

        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterOpen(true)}
          size="small"
        >
          {t('filters')}
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="outlined"
          startIcon={<ImportIcon />}
          color="secondary"
          onClick={() => setImportOpen(true)}
          size="small"
        >
          {t('import')}
        </Button>

        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          color="primary"
          onClick={handleExportCSV}
          size="small"
        >
          {t('exportCsv')}
        </Button>
      </Box>

      {/* Accordion Member List */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
          <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
      ) : members.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary">No members found matching the filters.</Typography>
        </Paper>
      ) : (
        <Box>
          {/* Table Header Row */}
          <Paper sx={{ px: 2, py: 1.25, bgcolor: '#F8F5F0', color: '#71717A', borderRadius: 2.5, display: { xs: 'none', md: 'block' }, mb: 0.75, border: '1px solid #EDEAE5' }}>
            <Grid container spacing={2} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Grid size={{ md: 0.8 }}>ID</Grid>
              <Grid size={{ md: 3 }}>Name</Grid>
              <Grid size={{ md: 2 }}>Phone</Grid>
              <Grid size={{ md: 1 }}>Age</Grid>
              <Grid size={{ md: 1.2 }}>Gender</Grid>
              <Grid size={{ md: 2 }}>Joined</Grid>
              <Grid size={{ md: 2 }} sx={{ textAlign: 'center' }}>Status</Grid>
            </Grid>
          </Paper>

          <Stack spacing={0.75}>
            {members.map((m) => {
              const isExpanded = expandedMemberId === m.id;
              return (
                <Accordion
                  key={m.id}
                  expanded={isExpanded}
                  onChange={handleMemberAccordion(m.id)}
                  sx={{
                    borderRadius: '10px !important',
                    border: '1px solid',
                    borderColor: isExpanded ? '#D4CFC7' : '#EDEAE5',
                    boxShadow: isExpanded ? '0 4px 16px rgba(0, 0, 0, 0.06)' : 'none',
                    '&::before': { display: 'none' },
                    transition: 'all 0.15s ease',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: isExpanded ? 'primary.main' : 'text.secondary', fontSize: 20 }} />}
                    sx={{
                      py: 0,
                      px: 2,
                      minHeight: '44px !important',
                      '& .MuiAccordionSummary-content': { margin: '8px 0 !important' },
                    }}
                  >
                    <Grid container spacing={1.5} sx={{ alignItems: 'center', fontSize: '0.82rem' }}>
                      <Grid size={{ xs: 12, md: 0.8 }} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.78rem' }}>#{m.id}</Grid>
                      <Grid size={{ xs: 12, md: 3 }} sx={{ fontWeight: 600 }}>{m.name}</Grid>
                      <Grid size={{ xs: 6, md: 2 }} sx={{ color: 'text.secondary' }}>{m.phone}</Grid>
                      <Grid size={{ xs: 3, md: 1 }} sx={{ color: 'text.secondary' }}>{m.age}</Grid>
                      <Grid size={{ xs: 3, md: 1.2 }} sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>{m.gender || '—'}</Grid>
                      <Grid size={{ xs: 6, md: 2 }} sx={{ color: 'text.secondary' }}>{formatDate(m.joined_date)}</Grid>
                      <Grid size={{ xs: 6, md: 2 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                        <StatusChip status={m.status} />
                      </Grid>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#FAFAF8' }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>{m.phone}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>{m.address || '—'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Joined Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>{formatDate(m.joined_date)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.84rem' }}>{m.notes || 'None'}</Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ mb: 1.5 }} />

                    {/* Actions Panel */}
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
                      <Button
                        variant="contained"
                        color="info"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => openDetail(m)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={(e) => openEdit(m, e)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={(e) => openDelete(m, e)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>

          <TablePagination
            component="div"
            count={total}
            page={paginationModel.page}
            onPageChange={(e, newPage) => setPaginationModel(prev => ({ ...prev, page: newPage }))}
            rowsPerPage={paginationModel.pageSize}
            onRowsPerPageChange={(e) => setPaginationModel(prev => ({ ...prev, pageSize: parseInt(e.target.value, 10), page: 0 }))}
            rowsPerPageOptions={[10, 20, 50, 100]}
            sx={{ mt: 2 }}
          />
        </Box>
      )}

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={openAdd}
        size="medium"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        slotProps={{ paper: { sx: { width: 290, p: 2.5 } } }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: '1rem' }}>Filter Members</Typography>
        <Stack spacing={2}>
          <TextField
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
            size="small"
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>

          <TextField
            type="number"
            label="Exact Age"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ input: { min: 18, max: 100 } }}
          />

          <Button variant="contained" onClick={handleApplyFilters} fullWidth size="small">
            Apply Filters
          </Button>
          <Button variant="outlined" onClick={handleClearFilters} fullWidth size="small">
            Clear All
          </Button>
        </Stack>
      </Drawer>

      {/* Details Drawer */}
      <Drawer
        anchor="right"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 }, p: 2.5 } } }}
      >
        {selectedMember && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                Member Details
              </Typography>
              <IconButton onClick={() => setDetailOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                mb: 1,
              }}>
                <PersonIcon sx={{ fontSize: 48 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{selectedMember.name}</Typography>
              <StatusChip status={selectedMember.status} />
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Personal Information
            </Typography>
            <List dense sx={{ bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
              <ListItem>
                <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Age" secondary={`${selectedMember.age} years old`} />
              </ListItem>
              <ListItem>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Gender" secondary={selectedMember.gender || '—'} />
              </ListItem>
            </List>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Contact & Address
            </Typography>
            <List dense sx={{ bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
              <ListItem>
                <ListItemIcon><PhoneIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Phone" secondary={selectedMember.phone} />
              </ListItem>
              <ListItem>
                <ListItemIcon><HomeIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Address" secondary={selectedMember.address || '—'} />
              </ListItem>
            </List>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Membership Information
            </Typography>
            <List dense sx={{ bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
              <ListItem>
                <ListItemIcon><DateIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Date Joined" secondary={formatDate(selectedMember.joined_date)} />
              </ListItem>
              <ListItem>
                <ListItemIcon><NotesIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Notes" secondary={selectedMember.notes || '—'} />
              </ListItem>
            </List>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Auction History (Placeholder)
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 2, border: '1px dashed', borderColor: 'divider', mb: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
              <AuctionIcon color="action" />
              <Typography variant="body2" color="text.secondary">No auction participation history available.</Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
              Financial & Payment History (Placeholder)
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 2, border: '1px dashed', borderColor: 'divider', mb: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
              <BankIcon color="action" />
              <Typography variant="body2" color="text.secondary">No loan or payment records available.</Typography>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onClose={() => { setImportOpen(false); setImportSummary(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Import Members via CSV</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Please upload a CSV file with columns: <b>Name, Phone, Age, Gender, Address</b>. Duplicate phone numbers will be skipped automatically.
            </Typography>

            <Button variant="outlined" component="label" startIcon={<ImportIcon />}>
              Choose CSV File
              <input type="file" accept=".csv" hidden onChange={handleImportFileChange} />
            </Button>
            
            {importFile && (
              <Typography variant="caption" sx={{ mt: 1, fontWeight: 500 }}>
                Selected: {importFile.name}
              </Typography>
            )}

            {importSummary && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'action.selected', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Import Result Summary:</Typography>
                <Typography variant="body2">Total Rows: {importSummary.total}</Typography>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>Imported: {importSummary.imported}</Typography>
                <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 500 }}>Skipped/Duplicates: {importSummary.skipped}</Typography>
                {importSummary.errors.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>Errors:</Typography>
                    <Box sx={{ maxHeight: 100, overflowY: 'auto', p: 1, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      {importSummary.errors.map((err, i) => <Typography key={i} variant="caption" display="block" color="error">• {err}</Typography>)}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImportOpen(false); setImportSummary(null); }}>Close</Button>
          <Button variant="contained" onClick={handleImportSubmit} disabled={!importFile} color="secondary">Upload & Import</Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Form Dialog */}
      <FormDialog
        open={dialogOpen}
        title={editing ? 'Edit Member Details' : 'Add New Member'}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          name="name"
          control={control}
          rules={{
            required: 'Full name is required',
            maxLength: { value: 100, message: 'Name cannot exceed 100 characters' }
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Full Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

        <Controller
          name="phone"
          control={control}
          rules={{
            required: 'Phone number is required',
            pattern: {
              value: /^[6-9]\d{9}$/,
              message: 'Please enter a valid 10-digit Indian mobile number'
            }
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Phone Number"
              fullWidth
              error={!!errors.phone}
              helperText={errors.phone?.message}
              placeholder="e.g. 9876543210"
            />
          )}
        />

        <Controller
          name="age"
          control={control}
          rules={{
            required: 'Age is required',
            min: { value: 18, message: 'Minimum age is 18' },
            max: { value: 100, message: 'Maximum age is 100' }
          }}
          render={({ field }) => (
            <TextField
              {...field}
              type="number"
              label="Age"
              fullWidth
              error={!!errors.age}
              helperText={errors.age?.message}
            />
          )}
        />

        <Controller
          name="gender"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Gender" fullWidth select>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          )}
        />

        <Controller
          name="address"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Residential Address" fullWidth multiline rows={2} />
          )}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Member Status" fullWidth select>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          )}
        />

        <Controller
          name="joined_date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Joined Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />

        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Notes" fullWidth multiline rows={2} />
          )}
        />
      </FormDialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title="Soft Delete Member"
        message="Are you sure you want to deactivate this member? Their status will be set to INACTIVE, but their records will remain in the database."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {/* Notification Toast */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
          severity={snack.sev}
          variant="filled"
          sx={{ borderRadius: 3 }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
