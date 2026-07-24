import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  Stack,
  Autocomplete,
  Chip,
  Paper,
  Tabs,
  Tab,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ArrowBack as BackIcon,
  Gavel as AuctionIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
  CalendarMonth as DateIcon,
  Timer as DurationIcon,
  Info as InfoIcon,
  CheckCircle as ActiveIcon,
  Schedule as UpcomingIcon,
  Cancel as CancelIcon,
  AssignmentTurnedIn as CompleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Numbers as AgeIcon,
  PlayArrow as StartIcon,
  HourglassEmpty as PendingIcon,
  EmojiEvents as WinnerIcon,
  PictureAsPdf as PdfIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import StatusChip from '../components/StatusChip';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import auctionService from '../services/auctionService';
import memberService from '../services/memberService';
import reminderService from '../services/reminderService';
import NotificationsIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from '../context/LanguageContext';
import { formatCurrency, formatDate, getTodayDate } from '../utils/formatters';
import { useSettings } from '../context/SettingsContext';

// A standalone subcomponent to prevent hook call order warnings inside DataGrid renderCell
const PaidAmountInput = ({ row, isCompleted, onUpdatePaidAmount }) => {
  const [val, setVal] = useState(row.paid_amount);

  useEffect(() => {
    setVal(row.paid_amount);
  }, [row.paid_amount]);

  return (
    <TextField
      type="number"
      size="small"
      value={val}
      disabled={isCompleted}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        const numVal = parseFloat(val) || 0;
        if (numVal !== row.paid_amount) {
          onUpdatePaidAmount(row.id, numVal);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const numVal = parseFloat(val) || 0;
          if (numVal !== row.paid_amount) {
            onUpdatePaidAmount(row.id, numVal);
          }
          e.target.blur();
        }
      }}
      slotProps={{ htmlInput: { min: 0, style: { padding: '4px 8px' } } }}
      sx={{ width: 100, my: 0.5 }}
    />
  );
};

export default function Auctions() {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  
  // Reminders states
  const [reminderSettings, setReminderSettings] = useState(null);
  const [reminderHistory, setReminderHistory] = useState([]);
  const [unpaidReminders, setUnpaidReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  
  const [stats, setStats] = useState({
    total_auctions: 0,
    upcoming_auctions: 0,
    active_auctions: 0,
    completed_auctions: 0,
    total_members_participating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Navigation / Detail view state
  const [viewingAuction, setViewingAuction] = useState(null);
  const [detailTab, setDetailTab] = useState(0);

  // Synchronized ref to break fetchAuctions circular dependency loop
  const viewingAuctionRef = useRef(viewingAuction);
  useEffect(() => {
    viewingAuctionRef.current = viewingAuction;
  }, [viewingAuction]);

  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  // Community Members for Autocomplete
  const [communityMembers, setCommunityMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = useState([{ field: 'id', sort: 'desc' }]);
  const [expandedAuctionId, setExpandedAuctionId] = useState(null);

  // Monthly Auction Execution Engine state
  const [currentMonthDetails, setCurrentMonthDetails] = useState(null);
  const [currentMonthLoading, setCurrentMonthLoading] = useState(false);
  const [historyDetails, setHistoryDetails] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyReportOpen, setHistoryReportOpen] = useState(false);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(null);
  const [winningMemberId, setWinningMemberId] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [roundSubmitting, setRoundSubmitting] = useState(false);

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      prize_amount: '',
      commission: '',
      monthly_contribution: '',
      total_months: '',
      start_date: getTodayDate(),
      status: 'upcoming',
    },
  });

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await auctionService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load auction stats", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCommunityMembers = useCallback(async () => {
    try {
      const res = await memberService.getAll({ limit: 500, status: 'active' });
      setCommunityMembers(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch community members", err);
    }
  }, []);

  // Debounce search input to limit API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    try {
      const skip = paginationModel.page * paginationModel.pageSize;
      const limit = paginationModel.pageSize;
      const sort_by = sortModel[0]?.field || 'id';
      const sort_order = sortModel[0]?.sort || 'desc';

      const params = {
        skip,
        limit,
        sort_by,
        sort_order,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;

      const res = await auctionService.getAll(params);
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);

      // If we are currently viewing a details page, refresh its specific data too
      const currentViewing = viewingAuctionRef.current;
      if (currentViewing) {
        const refreshedCurrent = res.data.data.find(a => a.id === currentViewing.id);
        if (refreshedCurrent) {
          setViewingAuction(refreshedCurrent);
        }
      }
    } catch (err) {
      console.error("Failed to fetch auctions", err);
      setSnack({ open: true, msg: 'Failed to fetch auctions list.', sev: 'error' });
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, debouncedSearch, statusFilter]);

  const fetchCurrentMonthDetails = useCallback(async (auctionId) => {
    if (!auctionId) return;
    setCurrentMonthLoading(true);
    try {
      const res = await auctionService.getCurrentMonth(auctionId);
      setCurrentMonthDetails(res.data);
      setWinningMemberId('');
      setBidAmount('');
    } catch (err) {
      console.error("Failed to load current month details", err);
      setSnack({ open: true, msg: err.message || 'Failed to fetch current month details.', sev: 'error' });
    } finally {
      setCurrentMonthLoading(false);
    }
  }, []);

  const fetchHistoryDetails = useCallback(async (auctionId) => {
    if (!auctionId) return;
    setHistoryLoading(true);
    try {
      const res = await auctionService.getHistory(auctionId);
      setHistoryDetails(res.data || []);
    } catch (err) {
      console.error("Failed to load history details", err);
      setSnack({ open: true, msg: err.message || 'Failed to fetch history details.', sev: 'error' });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchReminderDetails = useCallback(async (auctionId) => {
    if (!auctionId) return;
    setRemindersLoading(true);
    try {
      const [settingsRes, historyRes, unpaidRes] = await Promise.all([
        reminderService.getSettings(auctionId),
        reminderService.getHistory(auctionId),
        reminderService.getUnpaidMembers(auctionId)
      ]);
      setReminderSettings(settingsRes.data);
      setReminderHistory(historyRes.data || []);
      setUnpaidReminders(unpaidRes.data || []);
    } catch (err) {
      console.error("Failed to load reminder details", err);
      setSnack({ open: true, msg: 'Failed to fetch reminder details.', sev: 'error' });
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  const handleUpdatePaidAmount = async (contributionId, amount) => {
    try {
      await auctionService.updateContribution(contributionId, amount);
      setSnack({ open: true, msg: 'Payment amount updated.', sev: 'success' });
      if (viewingAuction) {
        fetchCurrentMonthDetails(viewingAuction.id);
      }
    } catch (err) {
      console.error("Failed to update contribution amount", err);
      setSnack({ open: true, msg: err.message || 'Failed to update payment amount.', sev: 'error' });
    }
  };

  const handleStartRound = async () => {
    if (!viewingAuction) return;
    try {
      await auctionService.startMonth(viewingAuction.id);
      setSnack({ open: true, msg: 'Monthly bidding round started successfully!', sev: 'success' });
      fetchCurrentMonthDetails(viewingAuction.id);
    } catch (err) {
      console.error("Failed to start monthly round", err);
      setSnack({ open: true, msg: err.message || 'Failed to start monthly round.', sev: 'error' });
    }
  };

  const handlePrintSummary = (month, auctionName, prizeAmount) => {
    const printWindow = window.open('', '_blank');
    const winnerReceives = prizeAmount - month.bid_amount;
    const paidCount = month.contributions.filter(c => c.paid_status).length;
    const pendingCount = month.contributions.filter(c => !c.paid_status).length;

    printWindow.document.write(`
      <html>
        <head>
          <title>\${settings?.community_name || 'Sangam'} - Monthly Auction Summary - \${auctionName} (Month \${month.month_number})</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #1a237e; padding-bottom: 10px; margin-bottom: 30px; }
            h1 { color: #1a237e; font-size: 26px; margin: 0; }
            h2 { color: #555; font-size: 16px; margin: 5px 0 0 0; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .meta-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background-color: #fafafa; }
            .meta-title { font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold; margin-bottom: 5px; }
            .meta-value { font-size: 18px; font-weight: 800; color: #1a237e; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f5f5f5; font-weight: bold; color: #1a237e; }
            tr:nth-child(even) { background-color: #fafafa; }
            .highlight { background-color: #e8f5e9 !important; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>\${settings?.community_name || 'Sangam'} — Monthly Auction Summary</h1>
            <h2>\${auctionName} — Month \${month.month_number}</h2>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <div class="meta-title">Auction Group Name</div>
              <div class="meta-value">\${auctionName}</div>
            </div>
            <div class="meta-item">
              <div class="meta-title">Auction Date</div>
              <div class="meta-value">\${new Date(month.auction_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div class="meta-item">
              <div class="meta-title">Winner Name</div>
              <div class="meta-value">\${month.winning_member_name || 'N/A'}</div>
            </div>
            <div class="meta-item">
              <div class="meta-title">Winner Payout (Winner Receives)</div>
              <div class="meta-value">\${formatCurrency(winnerReceives)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Particular / Parameter</th>
                <th style="text-align: right;">Value / Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Prize Amount</td>
                <td style="text-align: right; font-weight: bold;">\${formatCurrency(prizeAmount)}</td>
              </tr>
              <tr>
                <td>Winning Bid</td>
                <td style="text-align: right; font-weight: bold; color: #c62828;">\${formatCurrency(month.bid_amount)}</td>
              </tr>
              <tr>
                <td>Community Commission</td>
                <td style="text-align: right; font-weight: bold;">\${formatCurrency(month.community_commission)}</td>
              </tr>
              <tr>
                <td>Dividend Per Member</td>
                <td style="text-align: right; font-weight: bold; color: #2e7d32;">\${formatCurrency(month.dividend_per_member)}</td>
              </tr>
              <tr>
                <td>Members Paid</td>
                <td style="text-align: right;">\${paidCount} Members</td>
              </tr>
              <tr>
                <td>Members Pending</td>
                <td style="text-align: right;">\${pendingCount} Members</td>
              </tr>
              <tr class="highlight">
                <td>Net Winner Winnings (Winner Receives)</td>
                <td style="text-align: right; color: #1a237e;">\${formatCurrency(winnerReceives)}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #999;">
            System Generated Report • Generated on \${new Date().toLocaleString()}
          </div>

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

  const handleCompleteRound = async () => {
    if (!viewingAuction || !currentMonthDetails) return;
    const stats = currentMonthDetails.stats;
    
    // Validations
    if (!winningMemberId) {
      setSnack({ open: true, msg: 'Please select a winning member.', sev: 'error' });
      return;
    }
    const bidVal = Number(bidAmount);
    if (isNaN(bidVal) || bidVal < 0) {
      setSnack({ open: true, msg: 'Bid amount cannot be negative.', sev: 'error' });
      return;
    }
    if (bidVal > stats.prize_amount) {
      setSnack({ open: true, msg: `Bid amount cannot exceed the total prize amount of ₹${stats.prize_amount}.`, sev: 'error' });
      return;
    }
    if (bidVal < stats.community_commission) {
      setSnack({ open: true, msg: `Bid amount must be at least equal to the community commission of ₹${stats.community_commission}.`, sev: 'error' });
      return;
    }

    setRoundSubmitting(true);
    try {
      const res = await auctionService.completeMonth(viewingAuction.id, {
        winning_member_id: Number(winningMemberId),
        bid_amount: bidVal,
      });
      setSnack({ open: true, msg: 'Monthly round completed successfully!', sev: 'success' });
      
      // Auto-popup summary report
      setSelectedHistoryMonth(res.data);
      setHistoryReportOpen(true);
      
      // Refresh parent auction list and state
      await fetchAuctions();
      
      // Re-fetch current month details (will load next month or completion status)
      fetchCurrentMonthDetails(viewingAuction.id);
    } catch (err) {
      console.error("Failed to complete monthly round", err);
      setSnack({ open: true, msg: err.message || 'Failed to complete monthly round.', sev: 'error' });
    } finally {
      setRoundSubmitting(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCommunityMembers();
  }, [fetchStats, fetchCommunityMembers]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  useEffect(() => {
    if (viewingAuction) {
      if (detailTab === 1 && viewingAuction.status === 'active') {
        fetchCurrentMonthDetails(viewingAuction.id);
      }
      if (detailTab === 2) {
        fetchHistoryDetails(viewingAuction.id);
      }
      if (detailTab === 3) {
        fetchReminderDetails(viewingAuction.id);
      }
    }
  }, [viewingAuction, detailTab, fetchCurrentMonthDetails, fetchHistoryDetails, fetchReminderDetails]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const handleApplyFilters = () => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterOpen(false);
    fetchAuctions();
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setSearch('');
    setPaginationModel(prev => ({ ...prev, page: 0 }));
    setFilterOpen(false);
  };

  const openAdd = () => {
    setEditing(null);
    setSelectedMembers([]);
    reset({
      name: '',
      description: '',
      prize_amount: '',
      commission: '',
      monthly_contribution: '',
      total_months: '',
      start_date: getTodayDate(),
      status: 'upcoming',
    });
    setDialogOpen(true);
  };

  const openEdit = useCallback((row, e) => {
    if (e) e.stopPropagation();
    setEditing(row);
    
    // Set form fields
    reset({
      name: row.name,
      description: row.description || '',
      prize_amount: row.prize_amount,
      commission: row.commission,
      monthly_contribution: row.monthly_contribution,
      total_months: row.total_months,
      start_date: row.start_date,
      status: row.status,
    });

    // Populate selected members list from row.members mapping
    const matchedMembers = row.members.map(m => {
      // Find full member object from community list, or use data in schema
      return communityMembers.find(cm => cm.id === m.member_id) || {
        id: m.member_id,
        name: m.name,
        phone: m.phone,
        age: m.age
      };
    });
    setSelectedMembers(matchedMembers);
    setDialogOpen(true);
  }, [communityMembers, reset]);

  const openDelete = useCallback((row, e) => {
    if (e) e.stopPropagation();
    setDeletingId(row.id);
    setDeleteOpen(true);
  }, []);

  const confirmDelete = async () => {
    try {
      await auctionService.delete(deletingId);
      setSnack({ open: true, msg: 'Auction cancelled successfully', sev: 'success' });
      fetchAuctions();
      fetchStats();
      if (viewingAuction && viewingAuction.id === deletingId) {
        setViewingAuction(prev => ({ ...prev, status: 'cancelled' }));
      }
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to cancel auction', sev: 'error' });
    } finally {
      setDeleteOpen(false);
    }
  };

  const onSubmit = async (data) => {
    // 1. Members count validation
    if (selectedMembers.length < 2) {
      setSnack({ open: true, msg: 'At least two members are required for an auction', sev: 'error' });
      return;
    }

    // 2. Tolerance validation
    const totalPool = Number(data.monthly_contribution) * selectedMembers.length;
    const prize = Number(data.prize_amount);
    const lower = prize * 0.9;
    const upper = prize * 1.1;

    if (totalPool < lower || totalPool > upper) {
      setSnack({
        open: true,
        msg: `Monthly contribution (₹${data.monthly_contribution}) × members (${selectedMembers.length}) = pool (₹${totalPool}). This must be within 10% of the total prize amount (₹${prize}).`,
        sev: 'error'
      });
      return;
    }

    // 3. Assemble payload
    const payload = {
      ...data,
      prize_amount: Number(data.prize_amount),
      commission: Number(data.commission),
      monthly_contribution: Number(data.monthly_contribution),
      total_months: Number(data.total_months),
      member_ids: selectedMembers.map(m => m.id),
    };

    try {
      if (editing) {
        const updated = await auctionService.update(editing.id, payload);
        setSnack({ open: true, msg: 'Auction updated successfully', sev: 'success' });
        if (viewingAuction && viewingAuction.id === editing.id) {
          setViewingAuction(updated.data);
        }
      } else {
        await auctionService.create(payload);
        setSnack({ open: true, msg: 'Auction created successfully', sev: 'success' });
      }
      fetchAuctions();
      fetchStats();
      setDialogOpen(false);
    } catch (err) {
      const detail = err.response?.data?.detail || 'An error occurred';
      setSnack({ open: true, msg: detail, sev: 'error' });
    }
  };

  const handleAuctionAccordion = (id) => (event, isExpanded) => {
    setExpandedAuctionId(isExpanded ? id : null);
  };

  // Return full page detail view if an auction is selected
  if (viewingAuction) {
    return (
      <Box sx={{ pb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => setViewingAuction(null)}
          sx={{ mb: 3 }}
        >
          Back to Auctions
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AuctionIcon color="primary" />
              {viewingAuction.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {viewingAuction.description || "No description provided."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <StatusChip status={viewingAuction.status} size="small" />
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={(e) => openEdit(viewingAuction, e)}
            >
              Edit Auction
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={(e) => openDelete(viewingAuction, e)}
              disabled={viewingAuction.status === 'cancelled'}
            >
              Cancel Auction
            </Button>
          </Stack>
        </Box>

        {/* Details stats cards */}
        <Grid container spacing={2} sx={{ mb: 1.5 }}>
          {[
            { title: 'Total Members', value: viewingAuction.members_count, icon: <PeopleIcon />, color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
            { title: 'Prize Amount', value: formatCurrency(viewingAuction.prize_amount), icon: <MoneyIcon />, color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
            { title: 'Current Month', value: `${viewingAuction.current_month} of ${viewingAuction.total_months}`, icon: <DateIcon />, color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
            { title: 'Status', value: viewingAuction.status.toUpperCase(), icon: <InfoIcon />, color: 'linear-gradient(135deg, #7b4397 0%, #dc2430 100%)' },
          ].map((item, idx) => (
            <Grid key={idx} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ background: item.color, color: 'white', borderRadius: 2.5, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.title}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{item.value}</Typography>
                  </Box>
                  <Box sx={{ opacity: 0.6 }}>{item.icon}</Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tab interface for details sections */}
        <Paper sx={{ borderRadius: 2.5, overflow: 'hidden', mb: 3 }}>
          <Tabs
            value={detailTab}
            onChange={(e, val) => setDetailTab(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
          >
            <Tab label={t('members')} icon={<PeopleIcon />} iconPosition="start" />
            <Tab label="Upcoming Auction Round" icon={<UpcomingIcon />} iconPosition="start" />
            <Tab label="Monthly History" icon={<DateIcon />} iconPosition="start" />
            <Tab label={t('reminders')} icon={<NotificationsIcon />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {detailTab === 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Auction Participants ({viewingAuction.members.length})</Typography>
                <Grid container spacing={2}>
                  {viewingAuction.members.map((m) => (
                    <Grid key={m.member_id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Card sx={{
                        p: 2,
                        borderRadius: 2.5,
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { transform: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                      }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'primary.main',
                          }}>
                            <PersonIcon />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{m.name}</Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Phone: {m.phone}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Age: {m.age} • Status: {m.is_active ? 'Active' : 'Inactive'}
                            </Typography>
                          </Box>
                          {m.is_winner && (
                            <Chip
                              label={`Won M${m.winning_month}`}
                              color="success"
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          )}
                        </Stack>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {detailTab === 1 && (
              <Box>
                {viewingAuction.status !== 'active' ? (
                  <Box sx={{ p: 4, bgcolor: '#FAFAF8', borderRadius: 2.5, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                    <UpcomingIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Bidding Round Not Available</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mt: 1 }}>
                      This auction is currently in <strong>{viewingAuction.status.toUpperCase()}</strong> status. Bidding dashboard is only available for active auctions. Please update the auction status to Active to begin monthly execution.
                    </Typography>
                  </Box>
                ) : currentMonthLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : !currentMonthDetails ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="error">Failed to load monthly execution details.</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {/* Top Cards */}
                    <Grid size={{ xs: 12 }}>
                      <Grid container spacing={2}>
                        {[
                          { title: 'Auction Name', value: currentMonthDetails.stats.auction_name, color: '#1e88e5' },
                          { title: 'Prize Amount', value: formatCurrency(currentMonthDetails.stats.prize_amount), color: '#43a047' },
                          { title: 'Current Month', value: `Month ${currentMonthDetails.stats.current_month} of ${currentMonthDetails.stats.total_months}`, color: '#fb8c00' },
                          { title: 'Members Remaining', value: currentMonthDetails.stats.members_remaining, color: '#e53935' },
                          { title: 'Already Won', value: currentMonthDetails.stats.already_won, color: '#8e24aa' },
                          { title: 'Today\'s Date', value: formatDate(currentMonthDetails.stats.today_date), color: '#00acc1' },
                          { title: 'Community Commission', value: formatCurrency(currentMonthDetails.stats.community_commission), color: '#3949ab' },
                        ].map((stat, idx) => (
                          <Grid key={idx} sx={{ flexGrow: 1 }} size={{ xs: 6, sm: 4, md: 1.71 }}>
                            <Card sx={{ borderLeft: `4px solid ${stat.color}`, border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 2 }}>
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  {stat.title}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {stat.value}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>

                    {/* Bidding Control Panel */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Card sx={{ borderRadius: 2.5, height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Month {currentMonthDetails.stats.current_month} Controls
                          </Typography>
                          
                          <Stack spacing={2.5}>
                            {/* Round Status Banner */}
                            <Box sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: currentMonthDetails.stats.round_status === 'active' ? 'success.light' : 'action.selected',
                              color: currentMonthDetails.stats.round_status === 'active' ? 'success.dark' : 'text.primary',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5
                            }}>
                              {currentMonthDetails.stats.round_status === 'active' ? (
                                <ActiveIcon />
                              ) : currentMonthDetails.stats.round_status === 'completed' ? (
                                <CompleteIcon />
                              ) : (
                                <PendingIcon />
                              )}
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                  Round Status: {currentMonthDetails.stats.round_status.toUpperCase()}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                                  {currentMonthDetails.stats.round_status === 'pending'
                                    ? 'Collect member payments below, then click Start Bidding.'
                                    : currentMonthDetails.stats.round_status === 'active'
                                    ? 'Bidding is open! Choose the winner and enter their winning bid.'
                                    : 'This round is completed. Proceed to next month.'}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Start Bidding Action */}
                            {currentMonthDetails.stats.round_status === 'pending' && (
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<StartIcon />}
                                fullWidth
                                onClick={handleStartRound}
                                size="large"
                                sx={{ py: 1.5, borderRadius: 2 }}
                              >
                                Start Bidding
                              </Button>
                            )}

                            {/* Active Bidding Input Form */}
                            {currentMonthDetails.stats.round_status === 'active' && (
                              <>
                                <FormControl fullWidth variant="outlined">
                                  <InputLabel id="winner-select-label">Select Winner</InputLabel>
                                  <Select
                                    labelId="winner-select-label"
                                    id="winner-select"
                                    value={winningMemberId}
                                    onChange={(e) => setWinningMemberId(e.target.value)}
                                    label="Select Winner"
                                    sx={{ borderRadius: 2 }}
                                  >
                                    <MenuItem value="">
                                      <em>None</em>
                                    </MenuItem>
                                    {currentMonthDetails.auction_month.contributions
                                      .filter(c => c.is_eligible)
                                      .map(c => (
                                        <MenuItem key={c.member_id} value={c.member_id}>
                                          {c.name}
                                        </MenuItem>
                                      ))}
                                  </Select>
                                </FormControl>

                                <TextField
                                  label="Winning Bid Amount (₹)"
                                  type="number"
                                  fullWidth
                                  value={bidAmount}
                                  onChange={(e) => setBidAmount(e.target.value)}
                                  placeholder="e.g. 1500"
                                  slotProps={{ input: { sx: { borderRadius: 2 } } }}
                                />

                                {/* Live Calculator Preview */}
                                <Paper sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                                    Live Calculator Preview
                                  </Typography>
                                  {(() => {
                                    const paidCount = currentMonthDetails.auction_month.contributions.filter(c => c.paid_status).length;
                                    const hasSelectedWinner = winningMemberId !== '';
                                    const remEligible = hasSelectedWinner ? paidCount - 1 : paidCount;
                                    const bidNum = Number(bidAmount) || 0;
                                    const commission = currentMonthDetails.stats.community_commission;
                                    const dividend = remEligible > 0 && bidNum >= commission
                                      ? (bidNum - commission) / remEligible
                                      : 0;

                                    return (
                                      <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <Typography variant="caption">Total Prize Pool:</Typography>
                                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(currentMonthDetails.stats.prize_amount)}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <Typography variant="caption">Winner Payout:</Typography>
                                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(currentMonthDetails.stats.prize_amount - bidNum)}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <Typography variant="caption">Community Commission:</Typography>
                                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                            {formatCurrency(commission)}
                                          </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <Typography variant="caption">Dividend Receivers:</Typography>
                                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                            {remEligible} member(s)
                                          </Typography>
                                        </Box>
                                        <Divider />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 700 }}>Dividend / Member:</Typography>
                                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                                            {formatCurrency(dividend)}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    );
                                  })()}
                                </Paper>

                                <Button
                                  variant="contained"
                                  color="success"
                                  startIcon={roundSubmitting ? <CircularProgress size={20} color="inherit" /> : <CompleteIcon />}
                                  fullWidth
                                  onClick={handleCompleteRound}
                                  disabled={roundSubmitting || !winningMemberId || !bidAmount}
                                  size="large"
                                  sx={{ py: 1.5, borderRadius: 2 }}
                                >
                                  Complete Bidding Round
                                </Button>
                              </>
                            )}

                            {/* Completed Banner */}
                            {currentMonthDetails.stats.round_status === 'completed' && (
                              <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.dark', borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                  <WinnerIcon />
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Month Winner Recorded!</Typography>
                                </Stack>
                                <Typography variant="caption" display="block">
                                  Winner: <strong>{currentMonthDetails.auction_month.winning_member_name}</strong>
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Winning Bid: <strong>{formatCurrency(currentMonthDetails.auction_month.bid_amount)}</strong>
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Dividend / Member: <strong>{formatCurrency(currentMonthDetails.auction_month.dividend_per_member)}</strong>
                                </Typography>
                              </Paper>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Member Contributions & Eligibility Table */}
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Member Contributions & Eligibility
                        </Typography>
                        {currentMonthDetails.stats.round_status === 'pending' && (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={sendingReminders ? <CircularProgress size={16} color="inherit" /> : <NotificationsIcon />}
                            disabled={sendingReminders || currentMonthDetails.auction_month.contributions.filter(c => !c.paid_status).length === 0}
                            onClick={async () => {
                              setSendingReminders(true);
                              try {
                                const res = await reminderService.sendReminders(viewingAuction.id);
                                setSnack({ open: true, msg: res.data.message || 'Reminders sent.', sev: 'success' });
                              } catch (err) {
                                console.error("Failed to send reminders", err);
                                setSnack({ open: true, msg: 'Failed to send reminders.', sev: 'error' });
                              } finally {
                                setSendingReminders(false);
                              }
                            }}
                          >
                            Send Reminders ({currentMonthDetails.auction_month.contributions.filter(c => !c.paid_status).length})
                          </Button>
                        )}
                      </Stack>
                      <Paper sx={{ height: 400, borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                        <DataGrid
                          rows={currentMonthDetails.auction_month.contributions.map((c, idx) => ({ ...c, s_no: idx + 1 }))}
                          columns={[
                            { field: 's_no', headerName: 'S.No', width: 60, sortable: false, align: 'center', headerAlign: 'center' },
                            { field: 'name', headerName: 'Member Name', flex: 1, minWidth: 140 },
                            {
                              field: 'minimum_amount',
                              headerName: 'Required',
                              width: 110,
                              align: 'right',
                              headerAlign: 'right',
                              renderCell: (params) => formatCurrency(params.row.minimum_amount),
                            },
                            {
                              field: 'paid_amount',
                              headerName: 'Amount Paid',
                              width: 140,
                              align: 'right',
                              headerAlign: 'right',
                              renderCell: (params) => (
                                <PaidAmountInput
                                  row={params.row}
                                  isCompleted={currentMonthDetails.stats.round_status === 'completed'}
                                  onUpdatePaidAmount={handleUpdatePaidAmount}
                                />
                              )
                            },
                            {
                              field: 'balance',
                              headerName: 'Pending Balance',
                              width: 130,
                              align: 'right',
                              headerAlign: 'right',
                              renderCell: (params) => {
                                const balance = params.row.minimum_amount - params.row.paid_amount;
                                return formatCurrency(balance > 0 ? balance : 0);
                              }
                            },
                            {
                              field: 'is_eligible',
                              headerName: 'Eligibility',
                              width: 130,
                              align: 'center',
                              headerAlign: 'center',
                              renderCell: (params) => {
                                const balance = params.row.minimum_amount - params.row.paid_amount;
                                if (params.row.already_won) {
                                  return <Chip label="Won" size="small" color="error" sx={{ fontWeight: 700 }} />;
                                }
                                if (balance <= 0) {
                                  return <Chip label="Eligible" size="small" color="success" sx={{ fontWeight: 700 }} />;
                                }
                                return <Chip label="Ineligible" size="small" color="default" variant="outlined" />;
                              }
                            },
                            {
                              field: 'dividend_received',
                              headerName: 'Total Dividends',
                              width: 130,
                              align: 'right',
                              headerAlign: 'right',
                              renderCell: (params) => formatCurrency(params.row.dividend_received),
                            },
                          ]}
                          pageSizeOptions={[10, 20, 50, 100]}
                          disableRowSelectionOnClick
                          getRowClassName={(params) => {
                            if (params.row.already_won) return 'row-already-won';
                            const balance = params.row.minimum_amount - params.row.paid_amount;
                            if (balance > 0) return 'row-not-paid';
                            return '';
                          }}
                          sx={{
                            border: 0,
                            '& .row-already-won': {
                              backgroundColor: '#ffebee !important',
                              color: '#c62828 !important',
                              '&:hover': {
                                backgroundColor: '#ffcdd2 !important',
                              }
                            },
                            '& .row-not-paid': {
                              backgroundColor: '#f5f5f5 !important',
                              color: '#9e9e9e !important',
                              '&:hover': {
                                backgroundColor: '#eeeeee !important',
                              }
                            }
                          }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            {detailTab === 2 && (
              <Box>
                {historyLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : historyDetails.length === 0 ? (
                  <Box sx={{ p: 4, bgcolor: '#FAFAF8', borderRadius: 2.5, border: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                    <DurationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>No Completed Rounds Yet</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mt: 1 }}>
                      Completed monthly rounds will be archived here. Start and complete your first monthly bidding round under the <strong>Upcoming Auction Round</strong> tab to generate history logs.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={3} sx={{ position: 'relative', pl: 4, pt: 1, '&::before': { content: '""', position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, bgcolor: 'divider' } }}>
                    {historyDetails.map((month) => (
                      <Box key={month.id} sx={{ position: 'relative' }}>
                        {/* Timeline Circle */}
                        <Box sx={{
                          position: 'absolute',
                          left: -33,
                          top: 12,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: 'background.paper',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 1
                        }}>
                          <WinnerIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                        </Box>
                        
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Month {month.month_number} round</Typography>
                                <Typography variant="caption" color="text.secondary">Date Completed: {formatDate(month.auction_date)}</Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Winner</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{month.winning_member_name}</Typography>
                              </Box>
                              
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Winning Bid</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(month.bid_amount)}</Typography>
                              </Box>

                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" color="text.secondary" display="block">Dividend/Member</Typography>
                                <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>{formatCurrency(month.dividend_per_member)}</Typography>
                              </Box>

                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                  setSelectedHistoryMonth(month);
                                  setHistoryReportOpen(true);
                                }}
                                sx={{ borderRadius: 2 }}
                              >
                                View Report
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {detailTab === 3 && (
              <Box>
                {remindersLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {/* Settings Form */}
                    <Grid size={{ xs: 12, md: 5 }}>
                      <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('reminderSettings')}</Typography>
                          
                          <Stack spacing={2.5}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Enable Reminders</Typography>
                                <Typography variant="caption" color="text.secondary">Allow reminder processing for this auction</Typography>
                              </Box>
                              <Checkbox 
                                checked={reminderSettings?.is_enabled ?? true}
                                onChange={async (e) => {
                                  const updated = { ...reminderSettings, is_enabled: e.target.checked };
                                  setReminderSettings(updated);
                                  await reminderService.updateSettings(viewingAuction.id, { is_enabled: e.target.checked });
                                }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('smsEnabled')}</Typography>
                                <Typography variant="caption" color="text.secondary">Send text alerts to phone numbers</Typography>
                              </Box>
                              <Checkbox 
                                checked={reminderSettings?.sms_enabled ?? true}
                                onChange={async (e) => {
                                  const updated = { ...reminderSettings, sms_enabled: e.target.checked };
                                  setReminderSettings(updated);
                                  await reminderService.updateSettings(viewingAuction.id, { sms_enabled: e.target.checked });
                                }}
                                disabled={!(reminderSettings?.is_enabled)}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('whatsappEnabled')}</Typography>
                                <Typography variant="caption" color="text.secondary">Send WhatsApp message notifications</Typography>
                              </Box>
                              <Checkbox 
                                checked={reminderSettings?.whatsapp_enabled ?? true}
                                onChange={async (e) => {
                                  const updated = { ...reminderSettings, whatsapp_enabled: e.target.checked };
                                  setReminderSettings(updated);
                                  await reminderService.updateSettings(viewingAuction.id, { whatsapp_enabled: e.target.checked });
                                }}
                                disabled={!(reminderSettings?.is_enabled)}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{t('automaticReminder')}</Typography>
                                <Typography variant="caption" color="text.secondary">Schedule automated messages on due day</Typography>
                              </Box>
                              <Checkbox 
                                checked={reminderSettings?.automatic_reminder ?? false}
                                onChange={async (e) => {
                                  const updated = { ...reminderSettings, automatic_reminder: e.target.checked };
                                  setReminderSettings(updated);
                                  await reminderService.updateSettings(viewingAuction.id, { automatic_reminder: e.target.checked });
                                }}
                                disabled={!(reminderSettings?.is_enabled)}
                              />
                            </Box>

                            <TextField
                              type="number"
                              label={t('dueDay')}
                              size="small"
                              fullWidth
                              value={reminderSettings?.due_day ?? 10}
                              onChange={(e) => {
                                setReminderSettings({ ...reminderSettings, due_day: parseInt(e.target.value) || 10 });
                              }}
                              onBlur={async () => {
                                await reminderService.updateSettings(viewingAuction.id, { due_day: reminderSettings?.due_day ?? 10 });
                                setSnack({ open: true, msg: 'Due day updated.', sev: 'success' });
                              }}
                              disabled={!(reminderSettings?.is_enabled)}
                            />

                            <TextField
                              label={t('messageTemplate')}
                              multiline
                              rows={4}
                              fullWidth
                              value={reminderSettings?.template ?? ''}
                              onChange={(e) => {
                                setReminderSettings({ ...reminderSettings, template: e.target.value });
                              }}
                              onBlur={async () => {
                                await reminderService.updateSettings(viewingAuction.id, { template: reminderSettings?.template ?? '' });
                                setSnack({ open: true, msg: 'Message template saved.', sev: 'success' });
                              }}
                              disabled={!(reminderSettings?.is_enabled)}
                              helperText="Tags: {member_name}, {auction_name}, {contribution_amount}, {due_date}, {payment_status}"
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Manual Send Reminders & History */}
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Stack spacing={3}>
                        {/* Send Reminders Card */}
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>{t('sendReminder')}</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              There are currently <strong>{unpaidReminders.length}</strong> member(s) with unpaid contributions for month {viewingAuction.current_month}.
                            </Typography>

                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={sendingReminders ? <CircularProgress size={20} color="inherit" /> : <NotificationsIcon />}
                              disabled={sendingReminders || unpaidReminders.length === 0 || !reminderSettings?.is_enabled}
                              onClick={async () => {
                                setSendingReminders(true);
                                try {
                                  const res = await reminderService.sendReminders(viewingAuction.id);
                                  setSnack({ open: true, msg: res.data.message || 'Reminders sent.', sev: 'success' });
                                  await fetchReminderDetails(viewingAuction.id);
                                } catch (err) {
                                  console.error("Failed to send reminders", err);
                                  setSnack({ open: true, msg: 'Failed to send reminders.', sev: 'error' });
                                } finally {
                                  setSendingReminders(false);
                                }
                              }}
                            >
                              {t('sendAllReminders')}
                            </Button>
                          </CardContent>
                        </Card>

                        {/* History Table */}
                        <Card sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{t('reminderHistory')}</Typography>
                            {reminderHistory.length === 0 ? (
                              <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary">No reminder history logs found.</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--mui-palette-divider)', textAlign: 'left' }}>
                                      <th style={{ padding: '8px 4px' }}>Member</th>
                                      <th style={{ padding: '8px 4px' }}>Type</th>
                                      <th style={{ padding: '8px 4px' }}>Status</th>
                                      <th style={{ padding: '8px 4px' }}>Sent At</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {reminderHistory.map((h) => (
                                      <tr key={h.id} style={{ borderBottom: '1px solid var(--mui-palette-divider)' }}>
                                        <td style={{ padding: '8px 4px', fontWeight: 600 }}>{h.member_name}</td>
                                        <td style={{ padding: '8px 4px', textTransform: 'uppercase' }}>{h.reminder_type}</td>
                                        <td style={{ padding: '8px 4px' }}>
                                          <Chip 
                                            label={h.status.toUpperCase()} 
                                            size="small" 
                                            color={h.status === 'delivered' ? 'success' : h.status === 'sent' ? 'info' : 'error'}
                                            sx={{ fontSize: '0.7rem', height: 18 }}
                                          />
                                        </td>
                                        <td style={{ padding: '8px 4px' }}>{new Date(h.sent_at).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Stack>
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        <FormDialog
          open={dialogOpen}
          title="Edit Auction"
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Edit Form Fields */}
          <Controller name="name" control={control} rules={{ required: 'Auction name is required' }} render={({ field }) => <TextField {...field} label="Auction Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />} />
          <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Description" fullWidth multiline rows={2} />} />
          <Controller name="prize_amount" control={control} rules={{ required: 'Prize amount is required', min: { value: 1, message: 'Must be > 0' } }} render={({ field }) => <TextField {...field} type="number" label="Prize Amount (₹)" fullWidth error={!!errors.prize_amount} helperText={errors.prize_amount?.message} />} />
          <Controller name="commission" control={control} rules={{ required: 'Commission is required', min: { value: 0, message: 'Must be >= 0' } }} render={({ field }) => <TextField {...field} type="number" label="Community Commission (₹)" fullWidth error={!!errors.commission} helperText={errors.commission?.message} />} />
          <Controller name="monthly_contribution" control={control} rules={{ required: 'Monthly contribution is required', min: { value: 1, message: 'Must be > 0' } }} render={({ field }) => <TextField {...field} type="number" label="Minimum Monthly Contribution (₹)" fullWidth error={!!errors.monthly_contribution} helperText={errors.monthly_contribution?.message} />} />
          <Controller name="total_months" control={control} rules={{ required: 'Duration is required', min: { value: 1, message: 'Must be > 0' } }} render={({ field }) => <TextField {...field} type="number" label="Total Months" fullWidth error={!!errors.total_months} helperText={errors.total_months?.message} />} />
          <Controller name="start_date" control={control} rules={{ required: 'Start date is required' }} render={({ field }) => <TextField {...field} type="date" label="Start Date" fullWidth slotProps={{ inputLabel: { shrink: true } }} error={!!errors.start_date} helperText={errors.start_date?.message} />} />
          <Controller name="status" control={control} render={({ field }) => <TextField {...field} label="Status" fullWidth select><MenuItem value="upcoming">Upcoming</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="completed">Completed</MenuItem><MenuItem value="cancelled">Cancelled</MenuItem></TextField>} />

          <Autocomplete
            multiple
            options={communityMembers}
            getOptionLabel={(option) => `${option.name} (${option.phone}) - Age ${option.age}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={selectedMembers}
            onChange={(event, newValue) => setSelectedMembers(newValue)}
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="Select Members" placeholder="Choose members..." fullWidth />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => {
                const { key, index: tagIndex, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={option.id || key}
                    label={option.name}
                    color="primary"
                    variant="outlined"
                    size="small"
                    {...tagProps}
                  />
                );
              })
            }
            sx={{ mt: 2 }}
          />
        </FormDialog>

        <ConfirmDialog
          open={deleteOpen}
          title="Cancel Auction"
          message="Are you sure you want to cancel this auction? This will soft-delete the record and set its status to CANCELLED."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteOpen(false)}
        />

        {selectedHistoryMonth && (
          <Dialog
            open={historyReportOpen}
            onClose={() => setHistoryReportOpen(false)}
            maxWidth="md"
            fullWidth
            slotProps={{ paper: { sx: { borderRadius: 4 } } }}
          >
            <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Typography component="span" variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                Monthly Auction Summary
              </Typography>
              <IconButton onClick={() => setHistoryReportOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
              {/* Official Summary Key-Value Cards */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2.5, bgcolor: '#fbfbfb', border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Auction Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>{viewingAuction?.name}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Auction Date</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>{formatDate(selectedHistoryMonth.auction_date)}</Typography>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Month</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Month {selectedHistoryMonth.month_number}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Winner</Typography>
                    <Chip label={selectedHistoryMonth.winning_member_name || 'N/A'} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Winner Receives</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(viewingAuction?.prize_amount - selectedHistoryMonth.bid_amount)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Prize Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(viewingAuction?.prize_amount)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Winning Bid</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>{formatCurrency(selectedHistoryMonth.bid_amount)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Community Commission</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(selectedHistoryMonth.community_commission)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Dividend Per Member</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>{formatCurrency(selectedHistoryMonth.dividend_per_member)}</Typography>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Members Paid</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedHistoryMonth.contributions.filter(c => c.paid_status).length} Members
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Members Pending</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {selectedHistoryMonth.contributions.filter(c => !c.paid_status).length} Members
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Participant Round Status
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Paid & Received Dividend
                  </Typography>
                  <Stack spacing={1}>
                    {selectedHistoryMonth.contributions
                      .filter(c => c.paid_status && c.member_id !== selectedHistoryMonth.winning_member_id)
                      .map(c => (
                        <Paper key={c.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                          <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                            +{formatCurrency(selectedHistoryMonth.dividend_per_member)}
                          </Typography>
                        </Paper>
                      ))}
                    {selectedHistoryMonth.contributions.filter(c => c.paid_status && c.member_id !== selectedHistoryMonth.winning_member_id).length === 0 && (
                      <Typography variant="caption" color="text.secondary">None</Typography>
                    )}
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="error.main" sx={{ fontWeight: 700, mb: 1 }}>
                    Missed Payment (No Dividend)
                  </Typography>
                  <Stack spacing={1}>
                    {selectedHistoryMonth.contributions
                      .filter(c => !c.paid_status && c.member_id !== selectedHistoryMonth.winning_member_id)
                      .map(c => (
                        <Paper key={c.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#FAFAF8' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>{c.name}</Typography>
                        </Paper>
                      ))}
                    {selectedHistoryMonth.contributions.filter(c => !c.paid_status && c.member_id !== selectedHistoryMonth.winning_member_id).length === 0 && (
                      <Typography variant="caption" color="text.secondary">None</Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PdfIcon />}
                onClick={() => handlePrintSummary(selectedHistoryMonth, viewingAuction?.name || '', viewingAuction?.prize_amount || 0)}
                sx={{ borderRadius: 2 }}
              >
                Print / Export PDF
              </Button>
              <Button onClick={() => setHistoryReportOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>
                Close Report
              </Button>
            </DialogActions>
          </Dialog>
        )}

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setSnack(prev => ({ ...prev, open: false }))} severity={snack.sev} variant="filled" sx={{ borderRadius: 3 }}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  const mainAuctionsColumns = [
    { field: 'id', headerName: 'ID', width: 70, align: 'center', headerAlign: 'center' },
    { field: 'name', headerName: 'Auction Name', flex: 1.2, minWidth: 150, align: 'left', headerAlign: 'left' },
    { field: 'members_count', headerName: 'Members', width: 110, align: 'center', headerAlign: 'center' },
    { field: 'monthly_contribution', headerName: 'Contribution', width: 150, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
    { field: 'commission', headerName: 'Commission', width: 130, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
    { field: 'prize_amount', headerName: 'Prize Amount', width: 140, align: 'right', headerAlign: 'right', renderCell: (p) => formatCurrency(p.value) },
    { field: 'total_months', headerName: 'Duration', width: 110, align: 'center', headerAlign: 'center', renderCell: (p) => `${p.value} Months` },
    { field: 'current_month', headerName: 'Progress', width: 110, align: 'center', headerAlign: 'center', renderCell: (params) => `${params.row.current_month}/${params.row.total_months}` },
    { field: 'start_date', headerName: 'Start Date', width: 120, align: 'center', headerAlign: 'center', renderCell: (p) => formatDate(p.value) },
    { field: 'status', headerName: 'Status', width: 120, align: 'center', headerAlign: 'center', renderCell: (p) => <StatusChip status={p.value} /> },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 260,
      sortable: false,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<AuctionIcon />}
            onClick={() => setViewingAuction(params.row)}
            sx={{ mr: 1, py: 0.5 }}
          >
            Open
          </Button>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => openEdit(params.row, e)} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => openDelete(params.row, e)} color="error" disabled={params.row.status === 'cancelled'}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ position: 'relative', pb: 4 }}>
      <PageHeader
        title="Auction Groups"
        subtitle="Configure, audit, and run chit-fund style auctions"
        buttonText="Add Auction"
        onButtonClick={openAdd}
      />

      {/* Stats Cards Section */}
      <Grid container spacing={2} sx={{ mb: 1.5 }}>
        {[
          { title: 'Total Auctions', value: stats.total_auctions, icon: <AuctionIcon />, color: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' },
          { title: 'Upcoming Auctions', value: stats.upcoming_auctions, icon: <UpcomingIcon />, color: 'linear-gradient(135deg, #7b4397 0%, #dc2430 100%)' },
          { title: 'Active Auctions', value: stats.active_auctions, icon: <ActiveIcon />, color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
          { title: 'Completed Auctions', value: stats.completed_auctions, icon: <CompleteIcon />, color: 'linear-gradient(135deg, #4f3b78 0%, #0d0c1d 100%)' },
          { title: 'Total Members Participating', value: stats.total_members_participating, icon: <PeopleIcon />, color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
        ].map((item, idx) => (
          <Grid key={idx} size={{ xs: 12, sm: 6, md: 2.4 }}>
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
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          variant="outlined"
          placeholder="Search by name or member name..."
          value={search}
          onChange={handleSearchChange}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }
          }}
        />

        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setFilterOpen(true)}
        >
          Filters
        </Button>

        <Box sx={{ flexGrow: 1 }} />
      </Box>

      {/* DataGrid Auction List */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
          <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
      ) : (
        <Paper sx={{ height: 600, width: '100%', borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <DataGrid
            rows={rows}
            columns={mainAuctionsColumns}
            rowCount={total}
            loading={loading}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50, 100]}
            disableRowSelectionOnClick
            rowHeight={52}
            sx={{ border: 0 }}
          />
        </Paper>
      )}

      {/* Floating Add Button */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={openAdd}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: '0 8px 24px rgba(26,35,126,0.3)',
        }}
      >
        <AddIcon />
      </Fab>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        slotProps={{ paper: { sx: { width: 320, p: 3 } } }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Filter Auctions</Typography>
        <Stack spacing={3}>
          <TextField
            select
            label="Auction Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            fullWidth
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>

          <Button variant="contained" onClick={handleApplyFilters} fullWidth>
            Apply Filters
          </Button>
          <Button variant="outlined" onClick={handleClearFilters} fullWidth>
            Clear All
          </Button>
        </Stack>
      </Drawer>

      {/* Add New Auction Dialog */}
      <FormDialog
        open={dialogOpen && !editing}
        title="Add New Auction Group"
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller name="name" control={control} rules={{ required: 'Auction name is required' }} render={({ field }) => <TextField {...field} label="Auction Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />} />
        <Controller name="description" control={control} render={({ field }) => <TextField {...field} label="Description" fullWidth multiline rows={2} />} />
        <Controller name="prize_amount" control={control} rules={{ required: 'Prize amount is required', min: { value: 1, message: 'Must be > 0' } }} render={({ field }) => <TextField {...field} type="number" label="Total Prize Amount (₹)" fullWidth error={!!errors.prize_amount} helperText={errors.prize_amount?.message} />} />
        <Controller name="commission" control={control} rules={{ required: 'Commission is required', min: { value: 0, message: 'Must be >= 0' } }} render={({ field }) => <TextField {...field} type="number" label="Community Commission (₹)" fullWidth error={!!errors.commission} helperText={errors.commission?.message} />} />
        <Controller name="monthly_contribution" control={control} rules={{ required: 'Monthly contribution is required', min: { value: 1, message: 'Must be > 0' } }} render={({ field }) => <TextField {...field} type="number" label="Minimum Monthly Contribution (₹)" fullWidth error={!!errors.monthly_contribution} helperText={errors.monthly_contribution?.message} />} />
        <Controller name="total_months" control={control} rules={{ required: 'Duration is required', min: { value: 1, message: 'Must be > 0' } }} render={({ field }) => <TextField {...field} type="number" label="Total Months" fullWidth error={!!errors.total_months} helperText={errors.total_months?.message} />} />
        <Controller name="start_date" control={control} rules={{ required: 'Start date is required' }} render={({ field }) => <TextField {...field} type="date" label="Start Date" fullWidth slotProps={{ inputLabel: { shrink: true } }} error={!!errors.start_date} helperText={errors.start_date?.message} />} />
        <Controller name="status" control={control} render={({ field }) => <TextField {...field} label="Status" fullWidth select><MenuItem value="upcoming">Upcoming</MenuItem><MenuItem value="active">Active</MenuItem></TextField>} />

        <Autocomplete
          multiple
          options={communityMembers}
          getOptionLabel={(option) => `${option.name} (${option.phone}) - Age ${option.age}`}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selectedMembers}
          onChange={(event, newValue) => setSelectedMembers(newValue)}
          renderInput={(params) => (
            <TextField {...params} variant="outlined" label="Select Members" placeholder="Choose members..." fullWidth />
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const { key, index: tagIndex, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={option.id || key}
                  label={option.name}
                  color="primary"
                  variant="outlined"
                  size="small"
                  {...tagProps}
                />
              );
            })
          }
          sx={{ mt: 2 }}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Cancel Auction"
        message="Are you sure you want to cancel this auction? This will soft-delete the record and set its status to CANCELLED."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnack(prev => ({ ...prev, open: false }))} severity={snack.sev} variant="filled" sx={{ borderRadius: 3 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
