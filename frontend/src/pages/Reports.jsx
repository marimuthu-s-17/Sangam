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
import { DataGrid } from '@mui/x-data-grid';
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
    if (type === 'monthly-expense' || type === 'category-expense') {
      return [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'date', headerName: 'Date', flex: 0.8, renderCell: (p) => formatDate(p.value) },
        { field: 'category', headerName: 'Category', flex: 0.8, renderCell: (p) => <Box sx={{ textTransform: 'capitalize' }}>{p.value}</Box> },
        { field: 'description', headerName: 'Description', flex: 1.2 },
        { field: 'amount', headerName: 'Amount', flex: 0.8, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
        { field: 'payment_method', headerName: 'Payment Method', flex: 0.8 },
        { field: 'remarks', headerName: 'Remarks', flex: 1 },
      ];
    } else if (type === 'loans' || type === 'outstanding-loans') {
      return [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'borrower_name', headerName: 'Borrower', flex: 1.2 },
        { field: 'phone_number', headerName: 'Phone', flex: 0.8 },
        { field: 'loan_amount', headerName: 'Principal', flex: 0.8, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
        { field: 'interest_rate', headerName: 'Rate', flex: 0.6, align: 'right', headerAlign: 'right', renderCell: (p) => `${p.value}% p.a.` },
        { field: 'loan_date', headerName: 'Loan Date', flex: 0.8, renderCell: (p) => formatDate(p.value) },
        { field: 'due_date', headerName: 'Due Date', flex: 0.8, renderCell: (p) => formatDate(p.value) },
        { field: 'outstanding_amount', headerName: 'Outstanding', flex: 0.9, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
        { field: 'status', headerName: 'Status', width: 120, align: 'center', headerAlign: 'center', renderCell: (p) => <StatusChip status={p.value} /> },
        { field: 'remarks', headerName: 'Remarks', flex: 1 },
      ];
    } else if (type === 'interest-collection') {
      return [
        { field: 'payment_id', headerName: 'Payment ID', width: 100 },
        { field: 'loan_id', headerName: 'Loan ID', width: 80 },
        { field: 'borrower_name', headerName: 'Borrower', flex: 1.2 },
        { field: 'payment_date', headerName: 'Date', flex: 0.8, renderCell: (p) => formatDate(p.value) },
        { field: 'interest_payment', headerName: 'Interest Paid', flex: 0.9, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
        { field: 'payment_method', headerName: 'Method', flex: 0.8 },
        { field: 'notes', headerName: 'Notes', flex: 1 },
      ];
    } else if (type === 'members') {
      return [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'name', headerName: 'Name', flex: 1.2 },
        { field: 'phone', headerName: 'Phone', flex: 0.8 },
        { field: 'joined_date', headerName: 'Joined Date', flex: 0.8, renderCell: (p) => formatDate(p.value) },
        { field: 'status', headerName: 'Status', width: 120, align: 'center', headerAlign: 'center', renderCell: (p) => <StatusChip status={p.value} /> },
        { field: 'total_contributions', headerName: 'Contributions', flex: 0.9, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
        { field: 'outstanding_balance', headerName: 'Outstanding', flex: 0.9, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
      ];
    } else if (type === 'auctions') {
      return [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'name', headerName: 'Auction Name', flex: 1.2 },
        { field: 'start_month', headerName: 'Start Month', flex: 0.8, renderCell: (p) => formatDate(p.value) },
        { field: 'duration', headerName: 'Duration', flex: 0.6, align: 'center', headerAlign: 'center', renderCell: (p) => `${p.value} Months` },
        { field: 'prize_amount', headerName: 'Prize Amount', flex: 0.8, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
        { field: 'status', headerName: 'Status', width: 120, align: 'center', headerAlign: 'center', renderCell: (p) => <StatusChip status={p.value} /> },
        { field: 'current_month', headerName: 'Current Round', flex: 0.6, align: 'center', headerAlign: 'center' },
      ];
    } else if (type === 'profit-loss') {
      return [
        { field: 'metric', headerName: 'Financial Metric', flex: 1.5 },
        { field: 'amount', headerName: 'Amount', flex: 1, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
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
      setPreviewTitle(res.data.title);
      setColumns(getColumns(reportType));
      
      // Add standard React Grid compatible unique ID mapper
      const rawData = res.data.data || [];
      const formattedData = rawData.map((item, idx) => ({
        ...item,
        id: item.id || item.payment_id || idx + 1,
      }));
      setPreviewData(formattedData);
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
            <DataGrid
              rows={previewData}
              columns={columns}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
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
