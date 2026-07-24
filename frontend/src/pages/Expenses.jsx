import { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
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



  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title="Expenses"
        subtitle="Track all group expenses"
        buttonText="Add Expense"
        onButtonClick={openAdd}
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Expenses',
            value: stats.total_expenses,
            icon: <ReceiptIcon fontSize="large" />,
            color: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
            isCurrency: true,
          },
          {
            title: "Today's Expenses",
            value: stats.today_expenses,
            icon: <TodayIcon fontSize="large" />,
            color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            isCurrency: true,
          },
          {
            title: 'This Month',
            value: stats.month_expenses,
            icon: <CalendarMonthIcon fontSize="large" />,
            color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
            isCurrency: true,
          },
          {
            title: 'Highest Category',
            value: stats.highest_category,
            icon: <CategoryIcon fontSize="large" />,
            color: 'linear-gradient(135deg, #ed213a 0%, #93291e 100%)',
            isCurrency: false,
          },
        ].map((card, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
            <Card
              sx={{
                background: card.color,
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ position: 'relative', zIndex: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 500 }}>
                      {card.title}
                    </Typography>
                    {statsLoading ? (
                      <CircularProgress size={24} sx={{ color: 'white', mt: 1 }} />
                    ) : (
                      <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                        {card.isCurrency ? formatCurrency(card.value) : card.value}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ opacity: 0.6 }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filter Bar */}
      <Card sx={{ p: 2.5, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
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

      {/* Accordion Expense List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary">No expenses found matching the filters.</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {/* Header Row */}
          <Paper sx={{ p: 2, bgcolor: 'primary.dark', color: 'white', borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
            <Grid container spacing={2} sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
              <Grid size={{ md: 0.8 }}>ID</Grid>
              <Grid size={{ md: 3.2 }}>Description</Grid>
              <Grid size={{ md: 2 }} sx={{ textAlign: 'right' }}>Amount</Grid>
              <Grid size={{ md: 2 }}>Category</Grid>
              <Grid size={{ md: 2 }}>Date</Grid>
              <Grid size={{ md: 2 }}>Payment Method</Grid>
            </Grid>
          </Paper>

          {rows.map((exp) => {
            const isExpanded = expandedExpenseId === exp.id;
            return (
              <Accordion
                key={exp.id}
                expanded={isExpanded}
                onChange={handleExpenseAccordion(exp.id)}
                sx={{
                  borderRadius: '12px !important',
                  border: '1px solid',
                  borderColor: isExpanded ? 'primary.main' : 'divider',
                  boxShadow: isExpanded ? '0 8px 24px rgba(26, 35, 126, 0.08)' : 'none',
                  '&::before': { display: 'none' },
                  transition: 'all 0.2s ease',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: isExpanded ? 'primary.main' : 'text.secondary' }} />}
                  sx={{
                    py: 1.5,
                    px: 2.5,
                    '& .MuiAccordionSummary-content': { margin: 0 },
                  }}
                >
                  <Grid container spacing={2} sx={{ alignItems: 'center', fontSize: '0.875rem' }}>
                    <Grid size={{ xs: 12, md: 0.8 }} sx={{ fontWeight: 700 }}>#{exp.id}</Grid>
                    <Grid size={{ xs: 12, md: 3.2 }} sx={{ fontWeight: 600 }}>{exp.description}</Grid>
                    <Grid size={{ xs: 6, md: 2 }} sx={{ md: { textAlign: 'right' }, color: 'error.main', fontWeight: 700 }}>
                      {formatCurrency(exp.amount)}
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }} sx={{ textTransform: 'capitalize' }}>{exp.category}</Grid>
                    <Grid size={{ xs: 6, md: 2 }}>{formatDate(exp.expense_date)}</Grid>
                    <Grid size={{ xs: 6, md: 2 }}>{exp.payment_method || '—'}</Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Remarks</Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{exp.remarks || 'None'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Created</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(exp.created_at)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Last Updated</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(exp.updated_at)}</Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ mb: 2.5 }} />

                  {/* Actions Panel */}
                  <Stack direction="row" spacing={2} flexWrap="wrap" gap={1.5}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="medium"
                      startIcon={<EditIcon />}
                      onClick={() => openEdit(exp)}
                    >
                      Edit Expense
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="medium"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        setDeletingId(exp.id);
                        setDeleteOpen(true);
                      }}
                    >
                      Delete Expense
                    </Button>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
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
