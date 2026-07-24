import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  HourglassEmpty as HourglassEmptyIcon,
  CheckCircle as CheckCircleIcon,
  Percent as PercentIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import loanService from '../services/loanService';
import financeService from '../services/financeService';
import { formatCurrency, formatDate, getTodayDate } from '../utils/formatters';

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];
const LOAN_STATUSES = ['active', 'closed', 'overdue'];

export default function Finance() {
  const [tabIndex, setTabIndex] = useState(0);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  // ----------------------------------------------------
  // LOANS TAB STATE & HANDLERS
  // ----------------------------------------------------
  const [loans, setLoans] = useState([]);
  const [loansLoading, setLoansLoading] = useState(true);
  const [loansStatsLoading, setLoansStatsLoading] = useState(true);
  const [loansStats, setLoansStats] = useState({
    total_loans: 0,
    active_loans: 0,
    closed_loans: 0,
    interest_earned: 0,
    outstanding_balance: 0,
  });

  const [loanSearch, setLoanSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('');

  // Dialogs
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [loanDeleteOpen, setLoanDeleteOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const [editingLoan, setEditingLoan] = useState(null);
  const [deletingLoanId, setDeletingLoanId] = useState(null);
  const [payingLoan, setPayingLoan] = useState(null);

  // Forms
  const loanForm = useForm({
    defaultValues: {
      borrower_name: '',
      phone_number: '',
      loan_amount: '',
      interest_rate: '12',
      loan_date: getTodayDate(),
      due_date: '',
      remarks: '',
      member_id: '',
    },
  });

  const paymentForm = useForm({
    defaultValues: {
      payment_type: 'interest', // interest or principal
      amount: '',
      payment_date: getTodayDate(),
      payment_method: 'Cash',
      notes: '',
    },
  });

  const fetchLoanStats = useCallback(async () => {
    setLoansStatsLoading(true);
    try {
      const res = await loanService.getStats();
      setLoansStats(res.data);
    } catch (err) {
      console.error('Failed to fetch loan stats:', err);
    } finally {
      setLoansStatsLoading(false);
    }
  }, []);

  const fetchLoans = useCallback(async () => {
    setLoansLoading(true);
    try {
      const params = {};
      if (loanSearch) params.search = loanSearch;
      if (loanStatusFilter) params.status = loanStatusFilter;

      const res = await loanService.getAll(params);
      setLoans(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
      setSnack({ open: true, msg: 'Failed to load loans.', sev: 'error' });
    } finally {
      setLoansLoading(false);
    }
  }, [loanSearch, loanStatusFilter]);

  const openAddLoan = () => {
    setEditingLoan(null);
    loanForm.reset({
      borrower_name: '',
      phone_number: '',
      loan_amount: '',
      interest_rate: '12',
      loan_date: getTodayDate(),
      due_date: '',
      remarks: '',
      member_id: '',
    });
    setLoanDialogOpen(true);
  };

  const openEditLoan = (row) => {
    setEditingLoan(row);
    loanForm.reset({
      borrower_name: row.borrower_name,
      phone_number: row.phone_number,
      loan_amount: row.loan_amount,
      interest_rate: row.interest_rate,
      loan_date: row.loan_date,
      due_date: row.due_date,
      remarks: row.remarks || '',
      member_id: row.member_id || '',
    });
    setLoanDialogOpen(true);
  };

  const openRecordPayment = (row) => {
    setPayingLoan(row);
    paymentForm.reset({
      payment_type: 'interest',
      amount: '',
      payment_date: getTodayDate(),
      payment_method: 'Cash',
      notes: '',
    });
    setPaymentDialogOpen(true);
  };

  const onLoanSubmit = async (d) => {
    const payload = {
      ...d,
      loan_amount: Number(d.loan_amount),
      interest_rate: Number(d.interest_rate),
      member_id: d.member_id ? Number(d.member_id) : null,
    };
    try {
      if (editingLoan) {
        await loanService.update(editingLoan.id, payload);
      } else {
        await loanService.create(payload);
      }
      setSnack({
        open: true,
        msg: `Loan ${editingLoan ? 'updated' : 'created'} successfully.`,
        sev: 'success',
      });
      fetchLoans();
      fetchLoanStats();
      setLoanDialogOpen(false);
    } catch (err) {
      console.error('Failed to save loan:', err);
      setSnack({ open: true, msg: 'Error saving loan.', sev: 'error' });
    }
  };

  const confirmDeleteLoan = async () => {
    try {
      await loanService.delete(deletingLoanId);
      setSnack({ open: true, msg: 'Loan deleted.', sev: 'success' });
      fetchLoans();
      fetchLoanStats();
      setLoanDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete loan:', err);
      setSnack({ open: true, msg: 'Error deleting loan.', sev: 'error' });
    }
  };

  const onPaymentSubmit = async (d) => {
    const amountVal = Number(d.amount);
    const payload = {
      interest_payment: d.payment_type === 'interest' ? amountVal : 0,
      principal_payment: d.payment_type === 'principal' ? amountVal : 0,
      payment_date: d.payment_date,
      payment_method: d.payment_method,
      notes: d.notes,
    };
    try {
      await loanService.recordPayment(payingLoan.id, payload);
      setSnack({ open: true, msg: 'Payment recorded successfully.', sev: 'success' });
      fetchLoans();
      fetchLoanStats();
      setPaymentDialogOpen(false);
    } catch (err) {
      console.error('Failed to record payment:', err);
      setSnack({ open: true, msg: 'Error recording payment.', sev: 'error' });
    }
  };

  const handleClearLoanFilters = () => {
    setLoanSearch('');
    setLoanStatusFilter('');
  };

  // ----------------------------------------------------
  // GENERAL TRANSACTIONS TAB STATE & HANDLERS
  // ----------------------------------------------------
  const [txnRows, setTxnRows] = useState([]);
  const [txnLoading, setTxnLoading] = useState(true);
  const [txnDialogOpen, setTxnDialogOpen] = useState(false);
  const [txnDeleteOpen, setTxnDeleteOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [deletingTxnId, setDeletingTxnId] = useState(null);

  const txnForm = useForm({
    defaultValues: {
      member_id: '',
      transaction_type: 'receipt',
      amount: '',
      description: '',
      transaction_date: getTodayDate(),
      reference_number: '',
    },
  });

  const fetchTransactions = useCallback(async () => {
    setTxnLoading(true);
    try {
      const res = await financeService.getAll();
      setTxnRows(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setSnack({ open: true, msg: 'Failed to load general transactions.', sev: 'error' });
    } finally {
      setTxnLoading(false);
    }
  }, []);

  const openAddTxn = () => {
    setEditingTxn(null);
    txnForm.reset({
      member_id: '',
      transaction_type: 'receipt',
      amount: '',
      description: '',
      transaction_date: getTodayDate(),
      reference_number: '',
    });
    setTxnDialogOpen(true);
  };

  const openEditTxn = (row) => {
    setEditingTxn(row);
    txnForm.reset({
      member_id: row.member_id || '',
      transaction_type: row.transaction_type,
      amount: row.amount,
      description: row.description,
      transaction_date: row.transaction_date?.split('T')[0] || '',
      reference_number: row.reference_number || '',
    });
    setTxnDialogOpen(true);
  };

  const onTxnSubmit = async (d) => {
    const payload = {
      ...d,
      amount: Number(d.amount),
      member_id: d.member_id ? Number(d.member_id) : null,
    };
    try {
      if (editingTxn) {
        await financeService.update(editingTxn.id, payload);
      } else {
        await financeService.create(payload);
      }
      setSnack({
        open: true,
        msg: `Transaction ${editingTxn ? 'updated' : 'recorded'} successfully.`,
        sev: 'success',
      });
      fetchTransactions();
      setTxnDialogOpen(false);
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setSnack({ open: true, msg: 'Error saving transaction.', sev: 'error' });
    }
  };

  const confirmDeleteTxn = async () => {
    try {
      await financeService.delete(deletingTxnId);
      setSnack({ open: true, msg: 'Transaction deleted.', sev: 'success' });
      fetchTransactions();
      setTxnDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setSnack({ open: true, msg: 'Error deleting transaction.', sev: 'error' });
    }
  };

  // Initial loads
  useEffect(() => {
    if (tabIndex === 0) {
      fetchLoans();
      fetchLoanStats();
    } else {
      fetchTransactions();
    }
  }, [tabIndex, fetchLoans, fetchLoanStats, fetchTransactions]);

  // Columns Definitions
  const loanColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'borrower_name', headerName: 'Borrower', flex: 1.2, minWidth: 140 },
    { field: 'phone_number', headerName: 'Phone', flex: 0.8, minWidth: 110 },
    {
      field: 'loan_amount',
      headerName: 'Principal',
      flex: 0.8,
      minWidth: 120,
      renderCell: (p) => formatCurrency(p.value),
    },
    {
      field: 'interest_rate',
      headerName: 'Interest Rate',
      flex: 0.6,
      minWidth: 90,
      renderCell: (p) => `${p.value}% p.a.`,
    },
    {
      field: 'loan_date',
      headerName: 'Loan Date',
      flex: 0.7,
      minWidth: 110,
      renderCell: (p) => formatDate(p.value),
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      flex: 0.7,
      minWidth: 110,
      renderCell: (p) => formatDate(p.value),
    },
    {
      field: 'outstanding_amount',
      headerName: 'Outstanding',
      flex: 0.9,
      minWidth: 130,
      renderCell: (p) => formatCurrency(p.value),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (p) => <StatusChip status={p.value} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (p) => (
        <Box>
          <Tooltip title="Record Payment">
            <span>
              <IconButton
                size="small"
                onClick={() => openRecordPayment(p.row)}
                color="success"
                disabled={p.row.status === 'closed'}
              >
                <PaymentIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEditLoan(p.row)} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                setDeletingLoanId(p.row.id);
                setLoanDeleteOpen(true);
              }}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const txnColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'member_name', headerName: 'Member', flex: 1, minWidth: 140, renderCell: (p) => p.value || '—' },
    { field: 'transaction_type', headerName: 'Type', width: 120, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'amount', headerName: 'Amount', flex: 0.7, minWidth: 120, renderCell: (p) => formatCurrency(p.value) },
    { field: 'description', headerName: 'Description', flex: 1.2, minWidth: 180 },
    { field: 'transaction_date', headerName: 'Date', flex: 0.7, minWidth: 120, renderCell: (p) => formatDate(p.value) },
    { field: 'reference_number', headerName: 'Reference', flex: 0.6, minWidth: 100, renderCell: (p) => p.value || '—' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (p) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEditTxn(p.row)} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                setDeletingTxnId(p.row.id);
                setTxnDeleteOpen(true);
              }}
              color="error"
            >
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
        title="Finance"
        subtitle="Manage loans, payments, and financial transactions"
        buttonText={tabIndex === 0 ? 'Create Loan' : 'Add Transaction'}
        onButtonClick={tabIndex === 0 ? openAddLoan : openAddTxn}
      />

      {/* Tabs Menu */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} color="primary">
          <Tab label="Loans & Finance" sx={{ fontWeight: 600 }} />
          <Tab label="General Transactions" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* TABS CONTAINER */}
      {tabIndex === 0 ? (
        // ====================================================
        // TAB 1: LOANS
        // ====================================================
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              {
                title: 'Total Loans Given',
                value: loansStats.total_loans,
                icon: <AccountBalanceIcon fontSize="large" />,
                color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                isCurrency: false,
              },
              {
                title: 'Active Loans',
                value: loansStats.active_loans,
                icon: <HourglassEmptyIcon fontSize="large" />,
                color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                isCurrency: false,
              },
              {
                title: 'Closed Loans',
                value: loansStats.closed_loans,
                icon: <CheckCircleIcon fontSize="large" />,
                color: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
                isCurrency: false,
              },
              {
                title: 'Interest Earned',
                value: loansStats.interest_earned,
                icon: <PercentIcon fontSize="large" />,
                color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
                isCurrency: true,
              },
              {
                title: 'Outstanding Balance',
                value: loansStats.outstanding_balance,
                icon: <TrendingDownIcon fontSize="large" />,
                color: 'linear-gradient(135deg, #ed213a 0%, #93291e 100%)',
                isCurrency: true,
              },
            ].map((card, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={idx}>
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
                        <Typography variant="subtitle2" sx={{ opacity: 0.8, fontWeight: 500, fontSize: '0.75rem' }}>
                          {card.title}
                        </Typography>
                        {loansStatsLoading ? (
                          <CircularProgress size={20} sx={{ color: 'white', mt: 1 }} />
                        ) : (
                          <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                            {card.isCurrency ? formatCurrency(card.value) : card.value}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ opacity: 0.55 }}>{card.icon}</Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Filter Bar */}
          <Card sx={{ p: 2.5, mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                <TextField
                  placeholder="Search borrower name/phone/remarks..."
                  value={loanSearch}
                  onChange={(e) => setLoanSearch(e.target.value)}
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
              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  select
                  label="Loan Status"
                  value={loanStatusFilter}
                  onChange={(e) => setLoanStatusFilter(e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {LOAN_STATUSES.map((s) => (
                    <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 2, md: 3 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ClearIcon />}
                  onClick={handleClearLoanFilters}
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Card>

          {/* Table */}
          <Box className="datagrid-container" sx={{ height: 600 }}>
            <DataGrid
              rows={loans}
              columns={loanColumns}
              loading={loansLoading}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
            />
          </Box>
        </Box>
      ) : (
        // ====================================================
        // TAB 2: GENERAL TRANSACTIONS
        // ====================================================
        <Box>
          <Box className="datagrid-container" sx={{ height: 600 }}>
            <DataGrid
              rows={txnRows}
              columns={txnColumns}
              loading={txnLoading}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
            />
          </Box>
        </Box>
      )}

      {/* -------------------------------------------------- */}
      {/* DIALOGS SECTION */}
      {/* -------------------------------------------------- */}

      {/* 1. Loan Add/Edit Form Dialog */}
      <FormDialog
        open={loanDialogOpen}
        title={editingLoan ? 'Edit Loan Details' : 'Add New Loan Record'}
        onClose={() => setLoanDialogOpen(false)}
        onSubmit={loanForm.handleSubmit(onLoanSubmit)}
      >
        <Controller
          name="borrower_name"
          control={loanForm.control}
          rules={{ required: 'Borrower Name is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Borrower Name"
              fullWidth
              error={!!loanForm.formState.errors.borrower_name}
              helperText={loanForm.formState.errors.borrower_name?.message}
            />
          )}
        />
        <Controller
          name="phone_number"
          control={loanForm.control}
          rules={{ required: 'Phone Number is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Phone Number"
              fullWidth
              error={!!loanForm.formState.errors.phone_number}
              helperText={loanForm.formState.errors.phone_number?.message}
            />
          )}
        />
        <Controller
          name="member_id"
          control={loanForm.control}
          render={({ field }) => (
            <TextField {...field} label="Member ID (Optional)" fullWidth type="number" />
          )}
        />
        <Controller
          name="loan_amount"
          control={loanForm.control}
          rules={{ required: 'Loan Amount is required', min: { value: 1, message: 'Must be greater than 0' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Loan Amount (₹)"
              fullWidth
              type="number"
              error={!!loanForm.formState.errors.loan_amount}
              helperText={loanForm.formState.errors.loan_amount?.message}
            />
          )}
        />
        <Controller
          name="interest_rate"
          control={loanForm.control}
          rules={{ required: 'Interest Rate is required', min: { value: 0, message: 'Cannot be negative' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Annual Interest Rate (%)"
              fullWidth
              type="number"
              error={!!loanForm.formState.errors.interest_rate}
              helperText={loanForm.formState.errors.interest_rate?.message}
            />
          )}
        />
        <Controller
          name="loan_date"
          control={loanForm.control}
          rules={{ required: 'Loan Date is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Loan Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!loanForm.formState.errors.loan_date}
            />
          )}
        />
        <Controller
          name="due_date"
          control={loanForm.control}
          rules={{ required: 'Due Date is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Due Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!loanForm.formState.errors.due_date}
            />
          )}
        />
        <Controller
          name="remarks"
          control={loanForm.control}
          render={({ field }) => <TextField {...field} label="Remarks" fullWidth multiline rows={2} />}
        />
      </FormDialog>

      {/* 2. Record Payment Dialog */}
      <FormDialog
        open={paymentDialogOpen}
        title={payingLoan ? `Record Payment - ${payingLoan.borrower_name}` : 'Record Loan Payment'}
        onClose={() => setPaymentDialogOpen(false)}
        onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}
      >
        <Controller
          name="payment_type"
          control={paymentForm.control}
          render={({ field }) => (
            <TextField {...field} label="Payment Towards" fullWidth select>
              <MenuItem value="interest">Interest Payment</MenuItem>
              <MenuItem value="principal">Principal Repayment</MenuItem>
            </TextField>
          )}
        />
        <Controller
          name="amount"
          control={paymentForm.control}
          rules={{ required: 'Payment Amount is required', min: { value: 0.01, message: 'Must be greater than 0' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Payment Amount (₹)"
              fullWidth
              type="number"
              error={!!paymentForm.formState.errors.amount}
              helperText={paymentForm.formState.errors.amount?.message}
            />
          )}
        />
        <Controller
          name="payment_date"
          control={paymentForm.control}
          rules={{ required: 'Payment Date is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Payment Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!paymentForm.formState.errors.payment_date}
            />
          )}
        />
        <Controller
          name="payment_method"
          control={paymentForm.control}
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
          name="notes"
          control={paymentForm.control}
          render={({ field }) => <TextField {...field} label="Notes" fullWidth multiline rows={2} />}
        />
      </FormDialog>

      {/* 3. Loan Delete Confirm Dialog */}
      <ConfirmDialog
        open={loanDeleteOpen}
        title="Delete Loan Record"
        message="Are you sure you want to delete this loan record? This will also remove any payment history. This cannot be undone."
        onConfirm={confirmDeleteLoan}
        onCancel={() => setLoanDeleteOpen(false)}
      />

      {/* 4. General Transaction Add/Edit Dialog */}
      <FormDialog
        open={txnDialogOpen}
        title={editingTxn ? 'Edit Financial Transaction' : 'Record New Transaction'}
        onClose={() => setTxnDialogOpen(false)}
        onSubmit={txnForm.handleSubmit(onTxnSubmit)}
      >
        <Controller
          name="member_id"
          control={txnForm.control}
          render={({ field }) => <TextField {...field} label="Member ID (Optional)" fullWidth type="number" />}
        />
        <Controller
          name="transaction_type"
          control={txnForm.control}
          rules={{ required: 'Required' }}
          render={({ field }) => (
            <TextField {...field} label="Type" fullWidth select>
              <MenuItem value="receipt">Receipt</MenuItem>
              <MenuItem value="payment">Payment</MenuItem>
              <MenuItem value="adjustment">Adjustment</MenuItem>
            </TextField>
          )}
        />
        <Controller
          name="amount"
          control={txnForm.control}
          rules={{ required: 'Required', min: { value: 0.01, message: 'Must be greater than 0' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Amount (₹)"
              fullWidth
              type="number"
              error={!!txnForm.formState.errors.amount}
              helperText={txnForm.formState.errors.amount?.message}
            />
          )}
        />
        <Controller
          name="description"
          control={txnForm.control}
          rules={{ required: 'Required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              fullWidth
              error={!!txnForm.formState.errors.description}
              helperText={txnForm.formState.errors.description?.message}
            />
          )}
        />
        <Controller
          name="transaction_date"
          control={txnForm.control}
          rules={{ required: 'Required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Date"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!txnForm.formState.errors.transaction_date}
            />
          )}
        />
        <Controller
          name="reference_number"
          control={txnForm.control}
          render={({ field }) => <TextField {...field} label="Reference Number" fullWidth />}
        />
      </FormDialog>

      {/* 5. General Transaction Delete Confirm Dialog */}
      <ConfirmDialog
        open={txnDeleteOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this financial transaction? This cannot be undone."
        onConfirm={confirmDeleteTxn}
        onCancel={() => setTxnDeleteOpen(false)}
      />

      {/* Snackbar notifications */}
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
