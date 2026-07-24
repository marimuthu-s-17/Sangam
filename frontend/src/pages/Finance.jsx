import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Divider,
  TablePagination,
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
  History as HistoryIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from '../context/LanguageContext';
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
  const { t } = useTranslation();
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('');

  // Accordion Expand State
  const [expandedId, setExpandedId] = useState(null);

  // Pagination State
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [total, setTotal] = useState(0);

  // Dialogs
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);
  const [loanDeleteOpen, setLoanDeleteOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  const [editingLoan, setEditingLoan] = useState(null);
  const [deletingLoanId, setDeletingLoanId] = useState(null);
  const [payingLoan, setPayingLoan] = useState(null);
  const [closingLoan, setClosingLoan] = useState(null);
  const [historyLoan, setHistoryLoan] = useState(null);

  // Payments History State
  const [historyPayments, setHistoryPayments] = useState([]);
  const [historyPaymentsLoading, setHistoryPaymentsLoading] = useState(false);

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
      interest_payment: '',
      principal_payment: '',
      payment_date: getTodayDate(),
      payment_method: 'Cash',
      notes: '',
    },
  });

  // Debounce search input to limit API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(loanSearch);
    }, 500);
    return () => clearTimeout(handler);
  }, [loanSearch]);

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
      const params = {
        skip: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (loanStatusFilter) params.status = loanStatusFilter;

      const res = await loanService.getAll(params);
      setLoans(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
      setSnack({ open: true, msg: 'Failed to load loans.', sev: 'error' });
    } finally {
      setLoansLoading(false);
    }
  }, [debouncedSearch, loanStatusFilter, paginationModel]);

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

  const openEditLoan = useCallback((row, e) => {
    if (e) e.stopPropagation();
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
  }, [loanForm]);

  const openRecordPayment = useCallback((row, e) => {
    if (e) e.stopPropagation();
    setPayingLoan(row);
    paymentForm.reset({
      interest_payment: '',
      principal_payment: '',
      payment_date: getTodayDate(),
      payment_method: 'Cash',
      notes: '',
    });
    setPaymentDialogOpen(true);
  }, [paymentForm]);

  const openCloseConfirm = useCallback((row, e) => {
    if (e) e.stopPropagation();
    setClosingLoan(row);
    setCloseConfirmOpen(true);
  }, []);

  const openHistory = useCallback(async (row, e) => {
    if (e) e.stopPropagation();
    setHistoryLoan(row);
    setHistoryDialogOpen(true);
    setHistoryPaymentsLoading(true);
    try {
      const res = await loanService.getPayments(row.id);
      setHistoryPayments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch payments history:', err);
      setSnack({ open: true, msg: 'Failed to load payments history.', sev: 'error' });
    } finally {
      setHistoryPaymentsLoading(false);
    }
  }, []);

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
    const payload = {
      interest_payment: Number(d.interest_payment) || 0,
      principal_payment: Number(d.principal_payment) || 0,
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

  const handleCloseLoan = async (loan) => {
    try {
      const outstanding = Number(loan.outstanding_amount);
      if (outstanding <= 0) {
        setSnack({ open: true, msg: 'Loan is already closed.', sev: 'warning' });
        return;
      }

      const payload = {
        interest_payment: 0,
        principal_payment: outstanding,
        payment_date: getTodayDate(),
        payment_method: 'Cash',
        notes: 'Full repayment recorded to close loan.',
      };

      await loanService.recordPayment(loan.id, payload);
      setSnack({ open: true, msg: 'Loan closed successfully.', sev: 'success' });
      fetchLoans();
      fetchLoanStats();
    } catch (err) {
      console.error('Failed to close loan:', err);
      setSnack({ open: true, msg: 'Error closing loan.', sev: 'error' });
    }
  };

  const confirmCloseLoan = async () => {
    if (closingLoan) {
      await handleCloseLoan(closingLoan);
    }
    setCloseConfirmOpen(false);
  };

  const handleAccordionChange = (id) => (event, isExpanded) => {
    setExpandedId(isExpanded ? id : null);
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

  // General Transactions Columns Definition
  const txnColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'member_name', headerName: 'Member', flex: 1.2, minWidth: 140 },
    {
      field: 'transaction_type',
      headerName: 'Type',
      flex: 0.8,
      minWidth: 110,
      renderCell: (p) => <StatusChip status={p.value} />,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 0.9,
      minWidth: 120,
      renderCell: (p) => formatCurrency(p.value),
    },
    {
      field: 'transaction_date',
      headerName: 'Date',
      flex: 0.8,
      minWidth: 110,
      renderCell: (p) => formatDate(p.value),
    },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 180 },
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
        title={t('financeTitle')}
        subtitle={t('financeSubtitle')}
        buttonText={tabIndex === 0 ? t('createLoan') : t('addTransaction')}
        onButtonClick={tabIndex === 0 ? openAddLoan : openAddTxn}
      />

      {/* Tabs Menu */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} color="primary">
          <Tab label={t('loansTab')} sx={{ fontWeight: 600 }} />
          <Tab label={t('transactionsTab')} sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* TABS CONTAINER */}
      {tabIndex === 0 ? (
        // ====================================================
        // TAB 1: LOANS (Rich Accordions Layout)
        // ====================================================
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {[
              {
                title: t('totalLoansIssued'),
                value: loansStats.total_loans,
                icon: <AccountBalanceIcon />,
                color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                isCurrency: false,
              },
              {
                title: t('activeAuctions'), // matching 'active'
                value: loansStats.active_loans,
                icon: <HourglassEmptyIcon />,
                color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                isCurrency: false,
              },
              {
                title: t('closedLoans'),
                value: loansStats.closed_loans,
                icon: <CheckCircleIcon />,
                color: 'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',
                isCurrency: false,
              },
              {
                title: t('outstandingBalance'),
                value: loansStats.outstanding_balance,
                icon: <TrendingDownIcon />,
                color: 'linear-gradient(135deg, #ed213a 0%, #93291e 100%)',
                isCurrency: true,
              },
              {
                title: t('interestEarned'),
                value: loansStats.interest_earned,
                icon: <PercentIcon />,
                color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
                isCurrency: true,
              },
            ].map((card, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={idx}>
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
                        {loansStatsLoading ? (
                          <CircularProgress size={20} sx={{ color: 'white', mt: 0.5 }} />
                        ) : (
                          <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
                            {card.isCurrency ? formatCurrency(card.value) : card.value}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ opacity: 0.55 }}>{card.icon}</Box>
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

          {/* Filter Bar */}
          <Card sx={{ p: 2.5, mb: 4, borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
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

          {/* Accordion Table List */}
          {loansLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : loans.length === 0 ? (
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 2.5, border: '1px dashed', borderColor: 'divider' }}>
              <Typography color="text.secondary">No loans found matching the filters.</Typography>
            </Paper>
          ) : (
            <Stack spacing={2} sx={{ mb: 4 }}>
              {/* Header row to act as headers */}
              <Paper sx={{ p: 2, bgcolor: '#F8F5F0', color: '#71717A', borderRadius: 2, display: { xs: 'none', md: 'block' }, mb: -1 }}>
                <Grid container spacing={2} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Grid size={{ md: 1 }}>ID</Grid>
                  <Grid size={{ md: 3 }}>Borrower Name</Grid>
                  <Grid size={{ md: 2 }} sx={{ textAlign: 'right' }}>Loan Amount</Grid>
                  <Grid size={{ md: 2 }} sx={{ textAlign: 'right' }}>Monthly Interest</Grid>
                  <Grid size={{ md: 2 }}>Next Due Date</Grid>
                  <Grid size={{ md: 2 }} sx={{ textAlign: 'center' }}>Status</Grid>
                </Grid>
              </Paper>

              {loans.map((loan) => {
                const isExpanded = expandedId === loan.id;
                return (
                  <Accordion
                    key={loan.id}
                    expanded={isExpanded}
                    onChange={handleAccordionChange(loan.id)}
                    sx={{
                      borderRadius: '12px !important',
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
                        <Grid size={{ xs: 12, md: 1 }} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.78rem' }}>
                          #{loan.id}
                        </Grid>
                        <Grid size={{ xs: 12, md: 3 }} sx={{ fontWeight: 600 }}>
                          {loan.borrower_name}
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }} sx={{ md: { textAlign: 'right' }, color: 'primary.main', fontWeight: 700 }}>
                          {formatCurrency(loan.loan_amount)}
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }} sx={{ md: { textAlign: 'right' }, fontWeight: 600 }}>
                          {loan.interest_rate}% ({formatCurrency(loan.monthly_interest_amount || 0)})
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }} sx={{ color: 'text.secondary' }}>
                          {formatDate(loan.due_date)}
                        </Grid>
                        <Grid size={{ xs: 6, md: 2 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                          <StatusChip status={loan.status} />
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 2.5, pb: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#FAFAF8' }}>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Borrower Phone</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>{loan.phone_number}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Loan Start Date</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>{formatDate(loan.loan_date)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Days Remaining</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem', color: loan.days_remaining <= 3 ? 'error.main' : 'text.primary' }}>
                            {loan.days_remaining} Days
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Monthly Interest Amount</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem', color: 'success.main' }}>
                            {formatCurrency(loan.monthly_interest_amount || 0)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Interest Due (Unpaid)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', color: (loan.interest_due || 0) > 0 ? 'error.main' : 'success.main' }}>
                            {formatCurrency(loan.interest_due || 0)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Outstanding Balance</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.84rem', color: 'primary.main' }}>
                            {formatCurrency(loan.outstanding_amount)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Remarks</Typography>
                          <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.84rem' }}>{loan.remarks || 'None'}</Typography>
                        </Grid>
                      </Grid>

                      <Divider sx={{ mb: 1.5 }} />

                      {/* Actions Panel */}
                      <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={(e) => openRecordPayment(loan, e)}
                          disabled={loan.status === 'closed'}
                        >
                          Record Payment
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="small"
                          startIcon={<HistoryIcon />}
                          onClick={(e) => openHistory(loan, e)}
                        >
                          Payment History
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={(e) => openEditLoan(loan, e)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={(e) => openCloseConfirm(loan, e)}
                          disabled={loan.status === 'closed'}
                        >
                          Close Loan
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={(e) => {
                            if (e) e.stopPropagation();
                            setDeletingLoanId(loan.id);
                            setLoanDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              <TablePagination
                component="div"
                count={total}
                page={paginationModel.page}
                onPageChange={(e, newPage) => setPaginationModel(prev => ({ ...prev, page: newPage }))}
                rowsPerPage={paginationModel.pageSize}
                onRowsPerPageChange={(e) => setPaginationModel(prev => ({ ...prev, pageSize: parseInt(e.target.value, 10), page: 0 }))}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </Stack>
          )}
        </Box>
      ) : (
        // ====================================================
        // TAB 2: GENERAL TRANSACTIONS
        // ====================================================
        <Box>
          {/* Table */}
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
              label="Monthly Interest Rate (%)"
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
          name="interest_payment"
          control={paymentForm.control}
          rules={{ min: { value: 0, message: 'Cannot be negative' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Interest Paid (₹)"
              fullWidth
              type="number"
              error={!!paymentForm.formState.errors.interest_payment}
              helperText={paymentForm.formState.errors.interest_payment?.message}
            />
          )}
        />
        <Controller
          name="principal_payment"
          control={paymentForm.control}
          rules={{ min: { value: 0, message: 'Cannot be negative' } }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Principal Repayment (₹)"
              fullWidth
              type="number"
              error={!!paymentForm.formState.errors.principal_payment}
              helperText={paymentForm.formState.errors.principal_payment?.message}
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
          render={({ field }) => <TextField {...field} label="Remarks / Notes" fullWidth multiline rows={2} />}
        />
      </FormDialog>

      {/* 3. Payments History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, borderBottom: '1px solid', borderColor: 'divider', fontSize: '1rem' }}>
          Interest & Principal Payments - {historyLoan?.borrower_name}
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {historyPaymentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <CircularProgress />
            </Box>
          ) : historyPayments.length > 0 ? (
            <TableContainer component={Paper} sx={{ maxHeight: 400, boxShadow: 'none' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#F8F5F0', color: '#71717A' }}>Payment Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#F8F5F0', color: '#71717A' }}>Interest Paid</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#F8F5F0', color: '#71717A' }}>Principal Paid</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#F8F5F0', color: '#71717A' }}>Remaining Balance</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#F8F5F0', color: '#71717A' }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#F8F5F0', color: '#71717A' }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...historyPayments]
                    .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
                    .map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontSize: '0.84rem' }}>{formatDate(p.payment_date)}</TableCell>
                        <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600, fontSize: '0.84rem' }}>{formatCurrency(p.interest_payment)}</TableCell>
                        <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.84rem' }}>{formatCurrency(p.principal_payment)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.84rem' }}>{formatCurrency(p.remaining_balance)}</TableCell>
                        <TableCell sx={{ fontSize: '0.84rem' }}>{p.payment_method}</TableCell>
                        <TableCell sx={{ fontSize: '0.84rem' }}>{p.notes || '—'}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, p: 4 }}>
              <Typography color="text.secondary" variant="body2">No payment history recorded for this loan yet.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2.5, py: 1.5 }}>
          <Button onClick={() => setHistoryDialogOpen(false)} variant="contained" size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 4. Loan Delete Confirm Dialog */}
      <ConfirmDialog
        open={loanDeleteOpen}
        title="Delete Loan Record"
        message="Are you sure you want to delete this loan record? This will also remove any payment history. This cannot be undone."
        onConfirm={confirmDeleteLoan}
        onCancel={() => setLoanDeleteOpen(false)}
      />

      {/* 5. Close Loan Confirm Dialog */}
      <ConfirmDialog
        open={closeConfirmOpen}
        title="Close Loan"
        message={`Are you sure you want to close this loan? This will record a full repayment payment for the remaining outstanding amount of ₹${closingLoan?.outstanding_amount || 0} and mark the status as closed.`}
        onConfirm={confirmCloseLoan}
        onCancel={() => setCloseConfirmOpen(false)}
      />

      {/* 6. General Transaction Add/Edit Dialog */}
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

      {/* 7. General Transaction Delete Confirm Dialog */}
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
