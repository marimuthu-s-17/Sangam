import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Chip,
  CircularProgress,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { createColumnHelper } from '@tanstack/react-table';
import ReusableTable from '../components/table/ReusableTable';
import { useSettings } from '../context/SettingsContext';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as ExcelIcon,
  ArrowForward as ArrowIcon,
  AccountBalanceWallet as WalletIcon,
  Payments as PaymentsIcon,
  EmojiEvents as EmojiEventsIcon,
  TrendingUp as TrendingUpIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

import ledgerService from '../services/ledgerService';

// Format helper functions
const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function Ledger() {
  const { settings } = useSettings();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailedLedger, setDetailedLedger] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch all summaries
  const fetchLedgerSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ledgerService.getSummary();
      setSummaries(res.data || []);
    } catch (err) {
      console.error('Failed to load ledger summaries', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedgerSummaries();
  }, [fetchLedgerSummaries]);

  // Click handler to open detailed ledger
  const fetchDetailedLedger = async (memberId) => {
    const member = summaries.find(m => m.member_id === memberId);
    setSelectedMember(member);
    setDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await ledgerService.getMemberLedger(memberId);
      setDetailedLedger(res.data || []);
    } catch (err) {
      console.error('Failed to load detailed member ledger', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // CSV Export Utility
  const exportToCSV = (data, fileName, headers) => {
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        // Escape quotes
        const strVal = val === null || val === undefined ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export Utility (Spreadsheet-friendly XML/HTML table)
  const exportToExcel = (data, fileName, headers, titles) => {
    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${fileName}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              ${titles.map(title => `<th style="background-color: #1a237e; color: #ffffff; font-weight: bold;">${title}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${headers.map(header => `<td>${row[header] === null || row[header] === undefined ? '' : row[header]}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF Utility
  const printPDF = (title, columns, data) => {
    const printedTitle = `${settings?.community_name || 'Sangam'} - ${title}`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${printedTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #333; }
            h1 { color: #1a237e; font-size: 24px; margin-bottom: 5px; }
            p { font-size: 14px; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; color: #1a237e; }
            tr:nth-child(even) { background-color: #fafafa; }
            .badge { padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; }
            .badge-success { background-color: #e8f5e9; color: #2e7d32; }
            .badge-error { background-color: #ffebee; color: #c62828; }
            .net-positive { color: #2e7d32; font-weight: bold; }
            .net-negative { color: #c62828; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${printedTitle}</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${columns.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${columns.map(col => {
                    const val = row[col.key];
                    if (col.format === 'currency') return `<td>${formatCurrency(val)}</td>`;
                    if (col.format === 'date') return `<td>${formatDate(val)}</td>`;
                    if (col.key === 'won_this_month') {
                      return `<td><span class="badge ${val ? 'badge-error' : ''}">${val ? 'Won' : 'No'}</span></td>`;
                    }
                    if (col.key === 'overall_net_position' || col.key === 'net_position') {
                      return `<td class="${val >= 0 ? 'net-positive' : 'net-negative'}">${formatCurrency(val)}</td>`;
                    }
                    return `<td>${val === null || val === undefined ? '' : val}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Summaries Exports
  const handleExportSummariesCSV = () => {
    exportToCSV(summaries, 'Member_Ledger_Overview', [
      'name',
      'phone',
      'total_contributions',
      'total_dividend_received',
      'total_prize_won',
      'winning_month',
      'outstanding_balance',
      'overall_net_position',
    ]);
  };

  const handleExportSummariesExcel = () => {
    exportToExcel(
      summaries,
      'Member_Ledger_Overview',
      [
        'name',
        'phone',
        'total_contributions',
        'total_dividend_received',
        'total_prize_won',
        'winning_month',
        'outstanding_balance',
        'overall_net_position',
      ],
      [
        'Member Name',
        'Phone',
        'Total Contributions',
        'Total Dividend Received',
        'Total Prize Won',
        'Winning Month',
        'Outstanding Balance',
        'Overall Net Position',
      ]
    );
  };

  const handleExportSummariesPDF = () => {
    printPDF(
      'Member Ledger Overview Statement',
      [
        { key: 'name', label: 'Member Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'total_contributions', label: 'Total Paid', format: 'currency' },
        { key: 'total_dividend_received', label: 'Total Dividend', format: 'currency' },
        { key: 'total_prize_won', label: 'Total Prize Won', format: 'currency' },
        { key: 'winning_month', label: 'Won Month' },
        { key: 'outstanding_balance', label: 'Outstanding Balance', format: 'currency' },
        { key: 'overall_net_position', label: 'Net Position' },
      ],
      summaries
    );
  };

  // Detailed Exports
  const handleExportDetailCSV = () => {
    if (!selectedMember) return;
    exportToCSV(detailedLedger, `${selectedMember.name}_Ledger_Statement`, [
      'month_number',
      'auction_name',
      'contribution_required',
      'contribution_paid',
      'pending_balance',
      'dividend_received',
      'won_this_month',
      'winning_amount',
      'net_position',
      'payment_date',
    ]);
  };

  const handleExportDetailExcel = () => {
    if (!selectedMember) return;
    exportToExcel(
      detailedLedger,
      `${selectedMember.name}_Ledger_Statement`,
      [
        'month_number',
        'auction_name',
        'contribution_required',
        'contribution_paid',
        'pending_balance',
        'dividend_received',
        'won_this_month',
        'winning_amount',
        'net_position',
        'payment_date',
      ],
      [
        'Month',
        'Auction Group',
        'Contribution Required',
        'Contribution Paid',
        'Pending Balance',
        'Dividend Received',
        'Won Round?',
        'Winning Payout',
        'Month Net Position',
        'Payment Date',
      ]
    );
  };

  const handleExportDetailPDF = () => {
    if (!selectedMember) return;
    printPDF(
      `Ledger Statement - ${selectedMember.name}`,
      [
        { key: 'month_number', label: 'Month' },
        { key: 'auction_name', label: 'Auction Group' },
        { key: 'contribution_required', label: 'Required', format: 'currency' },
        { key: 'contribution_paid', label: 'Paid', format: 'currency' },
        { key: 'pending_balance', label: 'Pending Balance', format: 'currency' },
        { key: 'dividend_received', label: 'Dividend Received', format: 'currency' },
        { key: 'won_this_month', label: 'Won?' },
        { key: 'winning_amount', label: 'Winning Payout', format: 'currency' },
        { key: 'net_position', label: 'Month Net Position' },
        { key: 'payment_date', label: 'Payment Date', format: 'date' },
      ],
      detailedLedger
    );
  };

  // Columns for main summary table
  const columnHelper = createColumnHelper();
  const columns = useMemo(() => [
    columnHelper.accessor('name', { header: 'Member Name', meta: { align: 'left' } }),
    columnHelper.accessor('phone', { header: 'Phone', meta: { align: 'left' } }),
    columnHelper.accessor('total_contributions', {
      header: 'Total Contributions',
      meta: { align: 'right' },
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('total_dividend_received', {
      header: 'Total Dividend',
      meta: { align: 'right' },
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('total_prize_won', {
      header: 'Total Prize Won',
      meta: { align: 'right' },
      cell: (info) => formatCurrency(info.getValue()),
    }),
    columnHelper.accessor('winning_month', {
      header: 'Winning Month',
      meta: { align: 'center' },
      cell: (info) => {
        const val = info.getValue();
        return val === 'None' ? (
          <Typography variant="body2" color="text.secondary">None</Typography>
        ) : (
          <Chip label={val} size="small" color="error" variant="outlined" sx={{ fontWeight: 600 }} />
        );
      },
    }),
    columnHelper.accessor('outstanding_balance', {
      header: 'Outstanding Balance',
      meta: { align: 'right' },
      cell: (info) => {
        const val = info.getValue();
        return val > 0 ? (
          <Chip label={formatCurrency(val)} size="small" color="warning" sx={{ fontWeight: 600 }} />
        ) : (
          <Typography variant="body2" color="text.secondary">₹0</Typography>
        );
      },
    }),
    columnHelper.accessor('overall_net_position', {
      header: 'Net Position',
      meta: { align: 'right' },
      cell: (info) => {
        const val = info.getValue();
        return (
          <Box sx={{
            color: val >= 0 ? 'success.main' : 'error.main',
            fontWeight: 700,
            fontSize: '1.05rem',
          }}>
            {val >= 0 ? '+' : ''}{formatCurrency(val)}
          </Box>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Detailed View',
      meta: { align: 'center' },
      enableSorting: false,
      cell: (info) => (
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<VisibilityIcon />}
          onClick={() => fetchDetailedLedger(info.row.original.member_id)}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          View Full Ledger
        </Button>
      ),
    }),
  ], [columnHelper, fetchDetailedLedger]);

  return (
    <Box sx={{ py: 3, px: { xs: 1, md: 3 } }}>
      {/* Title Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.dark' }}>
            Member Ledger Overview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time read-only summaries and financial statements for chit community members.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={handleExportSummariesPDF}
            sx={{ borderRadius: 2 }}
          >
            PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={handleExportSummariesExcel}
            sx={{ borderRadius: 2, color: 'success.main', borderColor: 'success.main', '&:hover': { borderColor: 'success.dark', bgcolor: 'success.50' } }}
          >
            Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportSummariesCSV}
            sx={{ borderRadius: 2 }}
          >
            CSV
          </Button>
        </Stack>
      </Box>

      {/* Overview Table */}
      <Paper sx={{ borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 600, width: '100%' }}>
            <ReusableTable
              data={summaries.map(s => ({ ...s, id: s.member_id }))}
              columns={columns}
              loading={false}
            />
          </Box>
        )}
      </Paper>

      {/* Detailed Ledger Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, px: 1 } } }}
      >
        {selectedMember && (
          <>
            <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Ledger Statement
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMember.name} • {selectedMember.phone}
                </Typography>
              </Box>
              <IconButton onClick={() => setDetailsOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pb: 3 }}>
              {/* Aggregates Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  {
                    title: 'Total Contributions',
                    value: formatCurrency(selectedMember.total_contributions),
                    icon: <PaymentsIcon color="primary" />,
                    bg: '#e8f0fe',
                  },
                  {
                    title: 'Dividend Received',
                    value: formatCurrency(selectedMember.total_dividend_received),
                    icon: <TrendingUpIcon color="success" />,
                    bg: '#e8f5e9',
                  },
                  {
                    title: 'Total Prize Won',
                    value: formatCurrency(selectedMember.total_prize_won),
                    icon: <EmojiEventsIcon color="error" />,
                    bg: '#ffebee',
                  },
                  {
                    title: 'Winning Month',
                    value: selectedMember.winning_month,
                    icon: <WalletIcon color="warning" />,
                    bg: '#fff8e1',
                  },
                  {
                    title: 'Outstanding Balance',
                    value: formatCurrency(selectedMember.outstanding_balance),
                    icon: <WalletIcon color="action" />,
                    bg: '#f5f5f5',
                  },
                  {
                    title: 'Net Position',
                    value: formatCurrency(selectedMember.overall_net_position),
                    icon: <TrendingUpIcon color="secondary" />,
                    bg: '#f3e5f5',
                    color: selectedMember.overall_net_position >= 0 ? 'success.main' : 'error.main',
                  },
                ].map((card, idx) => (
                  <Grid size={{ xs: 6, sm: 4, md: 2 }} key={idx}>
                    <Card sx={{ bgcolor: card.bg, boxShadow: 'none', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          {card.icon}
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            {card.title}
                          </Typography>
                        </Stack>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: card.color || 'text.primary' }}>
                          {card.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Action bar for Dialog */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Historical Monthly Breakdown
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PdfIcon />}
                    onClick={handleExportDetailPDF}
                    sx={{ borderRadius: 2 }}
                  >
                    Print Statement
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ExcelIcon />}
                    onClick={handleExportDetailExcel}
                    sx={{ borderRadius: 2, color: 'success.main', borderColor: 'success.main' }}
                  >
                    Excel
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportDetailCSV}
                    sx={{ borderRadius: 2 }}
                  >
                    CSV
                  </Button>
                </Stack>
              </Box>

              {/* Detailed Breakdown List */}
              {detailsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : detailedLedger.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No completed monthly auction records found for this member.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? '#161B22' : '#FAFAF8' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Auction Group</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Required</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Paid</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Pending Balance</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Dividend</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Won Round?</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Winner Payout</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Net Position</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Payment Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailedLedger.map((row, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 600 }}>Month {row.month_number}</TableCell>
                          <TableCell>{row.auction_name}</TableCell>
                          <TableCell align="right">{formatCurrency(row.contribution_required)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.contribution_paid)}</TableCell>
                          <TableCell align="right">
                            {row.pending_balance > 0 ? (
                              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                                {formatCurrency(row.pending_balance)}
                              </Typography>
                            ) : (
                              '₹0'
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                            +{formatCurrency(row.dividend_received)}
                          </TableCell>
                          <TableCell>
                            {row.won_this_month ? (
                              <Chip label="Won" size="small" color="error" sx={{ fontWeight: 700 }} />
                            ) : (
                              <Typography variant="caption" color="text.secondary">No</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {row.winning_amount > 0 ? (
                              <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                                {formatCurrency(row.winning_amount)}
                              </Typography>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: row.net_position >= 0 ? 'success.main' : 'error.main',
                            }}
                          >
                            {formatCurrency(row.net_position)}
                          </TableCell>
                          <TableCell>{formatDate(row.payment_date)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDetailsOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>
                Close Statement
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
