import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../context/LanguageContext';
import {
  Box,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  InputAdornment,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Receipt as ReceiptIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  Category as CategoryIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import expenseService from '../services/expenseService';
import { formatCurrency, formatDate, getTodayDate } from '../utils/formatters';

const CATEGORIES = [
  'Snacks',
  'Tea',
  'Coffee',
  'Electricity',
  'Hall Rent',
  'Printing',
  'Stationery',
  'Miscellaneous',
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

export default function Expenses() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    total_expenses: 0,
    today_expenses: 0,
    month_expenses: 0,
    highest_category: 'None',
  });

  // Search & Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Accordion
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      description: '',
      amount: '',
      category: 'Miscellaneous',
      expense_date: getTodayDate(),
      payment_method: 'Cash',
      remarks: '',
    },
  });

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await expenseService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load expense stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await expenseService.getAll(params);
      setRows(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setSnack({ open: true, msg: 'Failed to load expenses.', sev: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, startDate, endDate]);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [fetchData, fetchStats]);

  const handleClearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStartDate('');
    setEndDate('');
  };

  const handleExpenseAccordion = (id) => (event, isExpanded) => {
    setExpandedExpenseId(isExpanded ? id : null);
  };

  const openAdd = () => {
    setEditing(null);
    reset({
      description: '',
      amount: '',
      category: 'Miscellaneous',
      expense_date: getTodayDate(),
      payment_method: 'Cash',
      remarks: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      description: row.description,
      amount: row.amount,
      category: row.category,
      expense_date: row.expense_date?.split('T')[0] || '',
      payment_method: row.payment_method || 'Cash',
      remarks: row.remarks || '',
    });
    setDialogOpen(true);
  };

  const onSubmit = async (d) => {
    const payload = {
      ...d,
      amount: Number(d.amount),
    };
    try {
      if (editing) {
        await expenseService.update(editing.id, payload);
      } else {
        await expenseService.create(payload);
      }
      setSnack({
        open: true,
        msg: `Expense ${editing ? 'updated' : 'added'} successfully.`,
        sev: 'success',
      });
      fetchData();
      fetchStats();
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save expense:', err);
      setSnack({ open: true, msg: 'Error saving expense.', sev: 'error' });
    }
  };

  const confirmDelete = async () => {
    try {
      await expenseService.delete(deletingId);
      setSnack({ open: true, msg: 'Expense deleted.', sev: 'success' });
      fetchData();
      fetchStats();
      setDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setSnack({ open: true, msg: 'Error deleting expense.', sev: 'error' });
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'description', headerName: 'Description', flex: 1.2, minWidth: 150, align: 'left', headerAlign: 'left' },
    { field: 'amount', headerName: 'Amount', width: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
    { field: 'category', headerName: 'Category', width: 130, align: 'center', headerAlign: 'center', renderCell: (p) => <Box sx={{ textTransform: 'capitalize' }}>{p.value}</Box> },
    { field: 'expense_date', headerName: 'Date', width: 130, align: 'center', headerAlign: 'center', renderCell: (p) => formatDate(p.value) },
    { field: 'payment_method', headerName: 'Method', width: 140, align: 'center', headerAlign: 'center' },
    { field: 'remarks', headerName: 'Remarks', flex: 1, minWidth: 150, align: 'left', headerAlign: 'left', renderCell: (p) => p.value || '—' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(params.row)} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => { setDeletingId(params.row.id); setDeleteOpen(true); }} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];


  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title={t('expensesTitle')}
        subtitle={t('expensesSubtitle')}
        buttonText={t('addExpense')}
        onButtonClick={openAdd}
      />

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          {
            title: t('totalExpenses'),
            value: stats.total_expenses,
            icon: <ReceiptIcon />,
            color: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
            isCurrency: true,
          },
          {
            title: t('todayExpenses'),
            value: stats.today_expenses,
            icon: <TodayIcon />,
            color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            isCurrency: true,
          },
          {
            title: t('thisMonth'),
            value: stats.month_expenses,
            icon: <CalendarMonthIcon />,
            color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
            isCurrency: true,
          },
          {
            title: t('highestCategory'),
            value: stats.highest_category,
            icon: <CategoryIcon />,
            color: 'linear-gradient(135deg, #ed213a 0%, #93291e 100%)',
            isCurrency: false,
          },
        ].map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card
              sx={{
                background: card.color,
                color: 'white',
                borderRadius: 2.5,
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 2, p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {card.title}
                    </Typography>
                    {statsLoading ? (
                      <CircularProgress size={20} sx={{ color: 'white', mt: 0.5 }} />
                    ) : (
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                        {card.isCurrency ? formatCurrency(card.value) : card.value}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ opacity: 0.5 }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Card sx={{ p: 2, mb: 2.5, borderRadius: 2.5, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #EDEAE5' }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <TextField
              placeholder="Search description/remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 2.5 }}>
            <TextField
              select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              fullWidth
            >
              <MenuItem value="">All Categories</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 2.5, md: 2.5 }}>
            <TextField
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2.5, md: 2.5 }}>
            <TextField
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 1.5 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* DataGrid Expense List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSizeOptions={[10, 20, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } }
            }}
            disableRowSelectionOnClick
            rowHeight={52}
            sx={{ border: 0 }}
          />
        </Paper>
      )}

      {/* Add/Edit Form Dialog */}
      <FormDialog
        open={dialogOpen}
        title={editing ? 'Edit Expense' : 'Add New Expense'}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          name="description"
          control={control}
          rules={{ required: 'Description is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              fullWidth
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          )}
        />
        <Controller
          name="amount"
          control={control}
          rules={{ required: 'Amount is required', min: { value: 0.01, message: 'Must be greater than 0' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Amount (₹)"
              fullWidth
              type="number"
              error={!!errors.amount}
              helperText={errors.amount?.message}
            />
          )}
        />
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Category" fullWidth select>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="expense_date"
          control={control}
          rules={{ required: 'Date is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!errors.expense_date}
            />
          )}
        />
        <Controller
          name="payment_method"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Payment Method" fullWidth select>
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="remarks"
          control={control}
          render={({ field }) => <TextField {...field} label="Remarks" fullWidth multiline rows={2} />}
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {/* Notification Toast */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
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
