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
} from '@mui/material';
import { createColumnHelper } from '@tanstack/react-table';
import ReusableTable from '../components/table/ReusableTable';
import {
  Assessment as AssessmentIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIconMui,
  Clear as ClearIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import reportService from '../services/reportService';
import { formatCurrency, formatDate } from '../utils/formatters';

const REPORT_TYPES = [
  { value: 'monthly-expense', label: 'Monthly Expense Report' },
  { value: 'category-expense', label: 'Category Expense Report' },
  { value: 'loans', label: 'Loan Report' },
  { value: 'interest-collection', label: 'Interest Collection Report' },
  { value: 'outstanding-loans', label: 'Outstanding Loan Report' },
  { value: 'members', label: 'Member Report' },
  { value: 'auctions', label: 'Auction Report' },
  { value: 'profit-loss', label: 'Profit & Loss Report' },
];

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

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function Reports() {
  const [reportType, setReportType] = useState('monthly-expense');

  // Filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [category, setCategory] = useState('Miscellaneous');

  // Preview Data
  const [previewData, setPreviewData] = useState([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);

  // Toast
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  // Column definitions based on report type
  const getColumns = (type) => {
    const ch = createColumnHelper();
    if (type === 'monthly-expense' || type === 'category-expense') {
      return [
        ch.accessor('id', { header: 'ID', meta: { align: 'center' } }),
        ch.accessor('date', { header: 'Date', meta: { align: 'center' }, cell: (info) => formatDate(info.getValue()) }),
        ch.accessor('category', { header: 'Category', meta: { align: 'center' }, cell: (info) => <Box sx={{ textTransform: 'capitalize' }}>{info.getValue()}</Box> }),
        ch.accessor('description', { header: 'Description', meta: { align: 'left' } }),
        ch.accessor('amount', { header: 'Amount', meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
        ch.accessor('payment_method', { header: 'Payment Method', meta: { align: 'center' } }),
        ch.accessor('remarks', { header: 'Remarks', meta: { align: 'left' } }),
      ];
    } else if (type === 'loans' || type === 'outstanding-loans') {
      return [
        ch.accessor('id', { header: 'ID', meta: { align: 'center' } }),
        ch.accessor('borrower_name', { header: 'Borrower', meta: { align: 'left' } }),
        ch.accessor('phone_number', { header: 'Phone', meta: { align: 'left' } }),
        ch.accessor('loan_amount', { header: 'Principal', meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
        ch.accessor('interest_rate', { header: 'Rate', meta: { align: 'right' }, cell: (info) => `${info.getValue()}% p.a.` }),
        ch.accessor('loan_date', { header: 'Loan Date', meta: { align: 'center' }, cell: (info) => formatDate(info.getValue()) }),
        ch.accessor('due_date', { header: 'Due Date', meta: { align: 'center' }, cell: (info) => formatDate(info.getValue()) }),
        ch.accessor('outstanding_amount', { header: 'Outstanding', meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
        ch.accessor('status', { header: 'Status', meta: { align: 'center' }, cell: (info) => <StatusChip status={info.getValue()} /> }),
        ch.accessor('remarks', { header: 'Remarks', meta: { align: 'left' } }),
      ];
    } else if (type === 'interest-collection') {
      return [
        ch.accessor('payment_id', { header: 'Payment ID', meta: { align: 'center' } }),
        ch.accessor('loan_id', { header: 'Loan ID', meta: { align: 'center' } }),
        ch.accessor('borrower_name', { header: 'Borrower', meta: { align: 'left' } }),
        ch.accessor('payment_date', { header: 'Date', meta: { align: 'center' }, cell: (info) => formatDate(info.getValue()) }),
        ch.accessor('interest_payment', { header: 'Interest Paid', meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
        ch.accessor('payment_method', { header: 'Method', meta: { align: 'center' } }),
        ch.accessor('notes', { header: 'Notes', meta: { align: 'left' } }),
      ];
    } else if (type === 'members') {
      return [
        ch.accessor('id', { header: 'ID', meta: { align: 'center' } }),
        ch.accessor('name', { header: 'Name', meta: { align: 'left' } }),
        ch.accessor('phone', { header: 'Phone', meta: { align: 'left' } }),
        ch.accessor('joined_date', { header: 'Joined Date', meta: { align: 'center' }, cell: (info) => formatDate(info.getValue()) }),
        ch.accessor('status', { header: 'Status', meta: { align: 'center' }, cell: (info) => <StatusChip status={info.getValue()} /> }),
        ch.accessor('total_contributions', { header: 'Contributions', meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
        ch.accessor('outstanding_balance', { header: 'Outstanding', meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
      ];
    } else if (type === 'auctions') {
      return [
        ch.accessor('id', { header: 'ID', meta: { align: 'center' } }),
        ch.accessor('name', { header: 'Auction Name', meta: { align: 'left' } }),
        ch.accessor('start_month', { header: 'Start Month', meta: { align: 'center' }, cell: (info) => formatDate(info.getValue()) }),
        ch.accessor('duration', { header: 'Duration', meta: { align: 'center' }, cell: (info) => `${info.getValue()} Months` }),
        ch.accessor('prize_amount', { header: 'Prize Amount', meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
        ch.accessor('status', { header: 'Status', meta: { align: 'center' }, cell: (info) => <StatusChip status={info.getValue()} /> }),
        ch.accessor('current_month', { header: 'Current Round', meta: { align: 'center' } }),
      ];
    } else if (type === 'profit-loss') {
      return [
        ch.accessor('metric', { header: 'Financial Metric', meta: { align: 'left' } }),
        ch.accessor('amount', { header: 'Amount', meta: { align: 'right' }, cell: (info) => formatCurrency(info.getValue()) }),
      ];
    }
    return [];
  };

  const handleGeneratePreview = async () => {
    setLoading(true);
    setPreviewData([]);
    try {
      const params = {};
      if (reportType === 'monthly-expense') {
        params.year = year;
        params.month = month;
      } else if (reportType === 'category-expense') {
        params.category = category;
      }

      const res = await reportService.getPreview(reportType, params);
      setPreviewTitle(res.data?.title || 'Report Preview');
      setColumns(getColumns(reportType));
      
      // The backend now provides a real 'id' for every row natively
      const rawData = res.data?.data || [];
      setPreviewData(rawData);
    } catch (err) {
      console.error('Failed to load report preview:', err);
      setSnack({ open: true, msg: 'Error generating report preview.', sev: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    const params = {};
    if (reportType === 'monthly-expense') {
      params.year = year;
      params.month = month;
    } else if (reportType === 'category-expense') {
      params.category = category;
    }

    const downloadUrl = reportService.getExportUrl(reportType, format, params);
    // Create an anchor tag to trigger browser download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = `${reportType}_report`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper status chip for preview table
  const StatusChip = ({ status }) => {
    let color = 'default';
    const s = String(status || '').toLowerCase();
    if (s === 'active' || s === 'completed' || s === 'receipt') color = 'success';
    if (s === 'overdue' || s === 'cancelled' || s === 'payment' || s === 'inactive') color = 'error';
    if (s === 'upcoming' || s === 'adjustment' || s === 'pending') color = 'warning';

    return (
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          px: 1.5,
          py: 0.4,
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          bgcolor: `${color}.light`,
          color: `${color}.main`,
        }}
      >
        {status}
      </Box>
    );
  };

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title="Reports"
        subtitle="Generate and export system financial reports"
      />

      {/* Control Panel */}
      <Card sx={{ p: 3, mb: 4, borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Grid container spacing={3} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              label="Select Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              fullWidth
            >
              {REPORT_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Conditional Filters */}
          {reportType === 'monthly-expense' && (
            <>
              <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                <TextField
                  select
                  label="Year"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  fullWidth
                >
                  {YEARS.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                <TextField
                  select
                  label="Month"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  fullWidth
                >
                  {MONTHS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}

          {reportType === 'category-expense' && (
            <Grid size={{ xs: 12, sm: 6, md: 5 }}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                fullWidth
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          <Grid
            size={{
              xs: 12,
              sm: reportType === 'monthly-expense' || reportType === 'category-expense' ? 12 : 6,
              md: reportType === 'monthly-expense' || reportType === 'category-expense' ? 3 : 8,
            }}
            sx={{ display: 'flex', justifyContent: 'flex-end' }}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssessmentIcon />}
              onClick={handleGeneratePreview}
              size="large"
              fullWidth={reportType === 'monthly-expense' || reportType === 'category-expense'}
              sx={{ px: 4, py: 1.5 }}
            >
              Generate Preview
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Preview Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </Box>
      ) : previewData.length > 0 ? (
        <Card sx={{ borderRadius: 2.5, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <Box
            sx={{
              px: 3,
              py: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {previewTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Previewing {previewData.length} records.
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.75}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<PdfIcon />}
                onClick={() => handleExport('pdf')}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<ExcelIcon />}
                onClick={() => handleExport('excel')}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                color="info"
                startIcon={<CsvIconMui />}
                onClick={() => handleExport('csv')}
              >
                CSV
              </Button>
            </Stack>
          </Box>
          <Box sx={{ height: 500 }}>
            <ReusableTable
              data={previewData}
              columns={columns}
              loading={loading}
            />
          </Box>
        </Card>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 8,
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2.5,
            bgcolor: 'background.paper',
          }}
        >
          <AssessmentIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            No report preview generated yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
            Choose a report type and click &quot;Generate Preview&quot; above.
          </Typography>
        </Box>
      )}

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
