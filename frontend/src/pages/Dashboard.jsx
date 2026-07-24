import { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Skeleton, Card, CardContent, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
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

const auctionColumns = [
  { field: 'auction_number', headerName: 'Auction #', flex: 0.5, minWidth: 90 },
  { field: 'auction_date', headerName: 'Date', flex: 0.8, minWidth: 110, renderCell: (p) => formatDate(p.value) },
  { field: 'member_name', headerName: 'Winner', flex: 1, minWidth: 130 },
  { field: 'amount', headerName: 'Amount', flex: 0.8, minWidth: 110, renderCell: (p) => formatCurrency(p.value) },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.7,
    minWidth: 110,
    renderCell: (p) => <StatusChip status={p.value} />,
  },
];

const transactionColumns = [
  { field: 'member_name', headerName: 'Member', flex: 1, minWidth: 130 },
  {
    field: 'transaction_type',
    headerName: 'Type',
    flex: 0.7,
    minWidth: 100,
    renderCell: (p) => <StatusChip status={p.value} />,
  },
  { field: 'amount', headerName: 'Amount', flex: 0.8, minWidth: 110, renderCell: (p) => formatCurrency(p.value) },
  { field: 'transaction_date', headerName: 'Date', flex: 0.8, minWidth: 110, renderCell: (p) => formatDate(p.value) },
  { field: 'description', headerName: 'Description', flex: 1.2, minWidth: 150 },
];

export default function Dashboard() {
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>Dashboard</Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 1.33 }} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Define recent activities helpers
  const activities = [
    { label: 'Latest Member Registered', data: data?.recent_activity?.latest_member, format: (v) => `${v.name} joined on ${formatDate(v.date)} (Status: ${v.status})`, icon: <PeopleIcon sx={{ color: '#1e3c72' }} /> },
    { label: 'Latest Auction Winner Payout', data: data?.recent_activity?.latest_winner, format: (v) => `${v.name} won ${v.auction_name} (Round ${v.month_number}) on ${formatDate(v.date)}`, icon: <GavelIcon sx={{ color: '#11998e' }} /> },
    { label: 'Latest Expense Record', data: data?.recent_activity?.latest_expense, format: (v) => `₹${v.amount.toLocaleString('en-IN')} for ${v.description} (${v.category}) on ${formatDate(v.date)}`, icon: <ReceiptIcon sx={{ color: '#f5af19' }} /> },
    { label: 'Latest Loan Disbursed', data: data?.recent_activity?.latest_loan, format: (v) => `₹${v.amount.toLocaleString('en-IN')} issued to ${v.borrower_name} on ${formatDate(v.date)}`, icon: <AccountBalanceIcon sx={{ color: '#606c88' }} /> },
    { label: 'Latest Loan Interest Payment', data: data?.recent_activity?.latest_interest_payment, format: (v) => `₹${v.interest_payment.toLocaleString('en-IN')} interest collected from ${v.borrower_name} on ${formatDate(v.date)}`, icon: <PaymentIcon sx={{ color: '#ed213a' }} /> },
  ].filter(act => act.data);

  return (
    <Box sx={{ pb: 5 }}>
      <Box
        sx={{
          p: { xs: 2.2, sm: 3 },
          mb: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #FFF8EA 0%, #FFFFFF 100%)',
          border: '1px solid #F0EBE2',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="caption" sx={{ color: '#F4A623', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Operational snapshot
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, letterSpacing: '-0.02em' }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.6, maxWidth: 700 }}>
            Overview of your {settings?.community_name || 'Sangam'} auction metrics, financial statements, and operations.
          </Typography>
        </Box>
        <Box sx={{ px: 2, py: 1.2, borderRadius: 999, backgroundColor: '#FFF6E8', color: '#C77F00', fontWeight: 700, fontSize: '0.86rem' }}>
          Live update • {settings?.community_name || 'Sangam'}
        </Box>
      </Box>

      {/* 9 Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.66 }}>
          <StatCard title="Total Members" value={data?.total_members || 0} icon={<PeopleIcon />} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.66 }}>
          <StatCard title="Active Auctions" value={data?.active_auctions || 0} icon={<GavelIcon />} color="info" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.66 }}>
          <StatCard title="Auctions Completed" value={data?.completed_auctions || 0} icon={<GavelIcon />} color="secondary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title="Current Month Collection" value={formatCurrency(data?.current_month_collection)} icon={<TrendingUpIcon />} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title="Total Expenses" value={formatCurrency(data?.total_expenses)} icon={<MoneyOffIcon />} color="warning" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title="Total Loans Issued" value={formatCurrency(data?.total_loans)} icon={<AccountBalanceIcon />} color="secondary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title="Outstanding Loans" value={formatCurrency(data?.outstanding_loans)} icon={<PaymentIcon />} color="error" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title="Interest Earned" value={formatCurrency(data?.interest_earned)} icon={<AddCardIcon />} color="info" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
          <StatCard title={`Available ${settings?.community_name || 'Sangam'} Balance`} value={formatCurrency(data?.available_balance)} icon={<AccountBalanceIcon />} color="success" />
        </Grid>
      </Grid>

      {/* 5 Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <CustomBarChart
            data={data?.charts?.monthly_collections || []}
            title="Monthly Collections"
            xKey="month"
            yKey="amount"
            color="#11998e"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <CustomBarChart
            data={data?.charts?.monthly_expenses || []}
            title="Monthly Expenses"
            xKey="month"
            yKey="amount"
            color="#ed213a"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <CustomAreaChart
            data={data?.charts?.profit_loss || []}
            title="Profit / Loss Trend"
            xKey="month"
            yKey="amount"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomPieChart
            data={data?.charts?.loan_status || []}
            title="Loan Status Valuation"
            nameKey="status"
            valueKey="amount"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <CustomPieChart
            data={data?.charts?.expense_categories || []}
            title="Expense Categories Allocation"
            nameKey="category"
            valueKey="amount"
          />
        </Grid>
      </Grid>

      {/* Recent Activity List */}
      {activities.length > 0 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 100%)', border: '1px solid #F0EBE2' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: '1rem' }}>
            Recent Activity
          </Typography>
          <Stack spacing={2}>
            {activities.map((act, i) => (
              <Stack key={i} direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center' }}>
                  {act.icon}
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    {act.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {act.format(act.data)}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Legacy Data Tables */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #F0EBE2', background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 100%)' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Recent Auctions
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Latest 5 auction records
              </Typography>
            </Box>
            <Box sx={{ height: 320 }}>
              <DataGrid
                rows={data?.recent_auctions || []}
                columns={auctionColumns}
                pageSizeOptions={[5]}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                disableRowSelectionOnClick
                disableColumnMenu
                sx={{ border: 'none' }}
              />
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #F0EBE2', background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFDF9 100%)' }}>
            <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Recent Transactions
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Latest 5 financial transactions
              </Typography>
            </Box>
            <Box sx={{ height: 320 }}>
              <DataGrid
                rows={data?.recent_transactions || []}
                columns={transactionColumns}
                pageSizeOptions={[5]}
                initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
                disableRowSelectionOnClick
                disableColumnMenu
                sx={{ border: 'none' }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
