import { useState, useEffect, useMemo } from 'react';
import { Box, Grid, Paper, Typography, Skeleton, Card, CardContent, Stack } from '@mui/material';
import { createColumnHelper } from '@tanstack/react-table';
import ReusableTable from '../components/table/ReusableTable';
import {
  People as PeopleIcon,
  Gavel as GavelIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
  MoneyOff as MoneyOffIcon,
  AddCard as AddCardIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import StatCard from '../components/StatCard';
import StatusChip from '../components/StatusChip';
import dashboardService from '../services/dashboardService';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CustomBarChart, CustomPieChart, CustomAreaChart } from '../components/Charts';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from '../context/LanguageContext';

export default function Dashboard() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const columnHelper = createColumnHelper();
  const auctionColumns = useMemo(() => [
    columnHelper.accessor('auction_number', { header: 'Auction #', meta: { align: 'center' } }),
    columnHelper.accessor('auction_date', { header: t('date'), meta: { align: 'left' }, cell: (info) => formatDate(info.getValue()) }),
    columnHelper.accessor('member_name', { header: 'Winner', meta: { align: 'left' } }),
    columnHelper.accessor('amount', { header: t('amount'), meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
    columnHelper.accessor('status', {
      header: t('status'),
      meta: { align: 'center' },
      cell: (info) => <StatusChip status={info.getValue()} />,
    }),
  ], [columnHelper, t]);

  const transactionColumns = useMemo(() => [
    columnHelper.accessor('member_name', { header: 'Member', meta: { align: 'left' } }),
    columnHelper.accessor('transaction_type', {
      header: t('txnType'),
      meta: { align: 'center' },
      cell: (info) => <StatusChip status={info.getValue()} />,
    }),
    columnHelper.accessor('amount', { header: t('amount'), meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
    columnHelper.accessor('transaction_date', { header: t('date'), meta: { align: 'left' }, cell: (info) => formatDate(info.getValue()) }),
    columnHelper.accessor('description', { header: t('description'), meta: { align: 'left' } }),
  ], [columnHelper, t]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await dashboardService.getSummary();
        setData(response.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>{t('dashboardTitle')}</Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.33 }} key={i}>
              <Skeleton variant="rounded" height={80} sx={{ borderRadius: 2.5 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Define recent activities helpers
  const activities = [
    { label: 'Latest Member Registered', data: data?.recent_activity?.latest_member, format: (v) => `${v.name} joined on ${formatDate(v.date)} (Status: ${v.status})`, icon: <PeopleIcon sx={{ color: '#1e3c72', fontSize: 18 }} /> },
    { label: 'Latest Auction Winner Payout', data: data?.recent_activity?.latest_winner, format: (v) => `${v.name} won ${v.auction_name} (Round ${v.month_number}) on ${formatDate(v.date)}`, icon: <GavelIcon sx={{ color: '#11998e', fontSize: 18 }} /> },
    { label: 'Latest Expense Record', data: data?.recent_activity?.latest_expense, format: (v) => `₹${v.amount.toLocaleString('en-IN')} for ${v.description} (${v.category}) on ${formatDate(v.date)}`, icon: <ReceiptIcon sx={{ color: '#f5af19', fontSize: 18 }} /> },
    { label: 'Latest Loan Disbursed', data: data?.recent_activity?.latest_loan, format: (v) => `₹${v.amount.toLocaleString('en-IN')} issued to ${v.borrower_name} on ${formatDate(v.date)}`, icon: <AccountBalanceIcon sx={{ color: '#606c88', fontSize: 18 }} /> },
    { label: 'Latest Loan Interest Payment', data: data?.recent_activity?.latest_interest_payment, format: (v) => `₹${v.interest_payment.toLocaleString('en-IN')} interest collected from ${v.borrower_name} on ${formatDate(v.date)}`, icon: <PaymentIcon sx={{ color: '#ed213a', fontSize: 18 }} /> },
  ].filter(act => act.data);

  return (
    <Box sx={{ pb: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 2.5, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 1.5 }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#F4A623', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.68rem' }}>
            {t('operationalSnapshot')}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.25, letterSpacing: '-0.03em' }}>
            {t('dashboardTitle')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            {t('dashboardSubtitle')}
          </Typography>
        </Box>
        <Box sx={{ px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: '#FFF6E8', color: '#C77F00', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
          {t('liveUpdate')} • {settings?.community_name || 'Sangam'}
        </Box>
      </Box>

      {/* 9 Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.66 }}>
          <StatCard title={t('totalMembers')} value={data?.total_members || 0} icon={<PeopleIcon />} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.66 }}>
          <StatCard title={t('activeAuctions')} value={data?.active_auctions || 0} icon={<GavelIcon />} color="info" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.66 }}>
          <StatCard title={t('auctionsCompleted')} value={data?.completed_auctions || 0} icon={<GavelIcon />} color="secondary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title={t('currentMonthCollection')} value={formatCurrency(data?.current_month_collection)} icon={<TrendingUpIcon />} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title={t('totalExpenses')} value={formatCurrency(data?.total_expenses)} icon={<MoneyOffIcon />} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title={t('totalLoansIssued')} value={formatCurrency(data?.total_loans)} icon={<AccountBalanceIcon />} color="secondary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title={t('outstandingBalance')} value={formatCurrency(data?.outstanding_loans)} icon={<PaymentIcon />} color="error" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title={t('interestEarned')} value={formatCurrency(data?.interest_earned)} icon={<AddCardIcon />} color="info" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title={`${t('availableBalance')} (${settings?.community_name || 'Sangam'})`} value={formatCurrency(data?.available_balance)} icon={<AccountBalanceIcon />} color="success" />
        </Grid>
      </Grid>

      {/* 5 Charts Section */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <CustomBarChart
            data={data?.charts?.monthly_collections || []}
            title={t('monthlyCollections')}
            xKey="month"
            yKey="amount"
            color="#11998e"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <CustomBarChart
            data={data?.charts?.monthly_expenses || []}
            title={t('monthlyExpenses')}
            xKey="month"
            yKey="amount"
            color="#ed213a"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <CustomAreaChart
            data={data?.charts?.profit_loss || []}
            title={t('profitLossTrend')}
            xKey="month"
            yKey="amount"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomPieChart
            data={data?.charts?.loan_status || []}
            title={t('loanStatusValuation')}
            nameKey="status"
            valueKey="amount"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomPieChart
            data={data?.charts?.expense_categories || []}
            title={t('expenseCategoriesAllocation')}
            nameKey="category"
            valueKey="amount"
          />
        </Grid>
      </Grid>

      {/* Recent Activity List */}
      {activities.length > 0 && (
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #EDEAE5' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, fontSize: '0.95rem' }}>
            {t('recentActivity')}
          </Typography>
          <Stack spacing={1.5}>
            {activities.map((act, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                <Box sx={{ p: 0.75, borderRadius: 2, bgcolor: '#F5F3F0', display: 'flex', alignItems: 'center' }}>
                  {act.icon}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem' }}>
                    {act.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {act.format(act.data)}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Tables section */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #EDEAE5' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem' }}>
              {t('recentAuctions')}
            </Typography>
            <Box sx={{ height: 260 }}>
              <ReusableTable
                data={data?.recent_auctions || []}
                columns={auctionColumns}
                loading={loading}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #EDEAE5' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '0.95rem' }}>
              {t('recentTransactions')}
            </Typography>
            <Box sx={{ height: 260 }}>
              <ReusableTable
                data={data?.recent_transactions || []}
                columns={transactionColumns}
                loading={loading}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
