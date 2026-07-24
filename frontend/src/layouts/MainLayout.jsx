import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { useTranslation } from '../context/LanguageContext';
import dashboardService from '../services/dashboardService';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  useMediaQuery,
  useTheme,
  Divider,
  Badge,
  Tooltip,
  InputBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Gavel as GavelIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  MenuBook as MenuBookIcon,
  Assessment as AssessmentIcon,
  LocalAtm as LocalAtmIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 256;

export default function MainLayout() {
  const { settings } = useSettings();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t, language, setLanguage } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const navItems = [
    { text: t('dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('members'), icon: <PeopleIcon />, path: '/members' },
    { text: t('auctions'), icon: <GavelIcon />, path: '/auctions' },
    { text: t('expenses'), icon: <ReceiptIcon />, path: '/expenses' },
    { text: t('finance'), icon: <AccountBalanceIcon />, path: '/finance' },
    { text: t('ledger'), icon: <MenuBookIcon />, path: '/ledger' },
    { text: t('reports'), icon: <AssessmentIcon />, path: '/reports' },
    { text: t('settings'), icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchOpen(true);
    try {
      const res = await dashboardService.search(searchQuery.trim());
      setSearchResults(res.data);
    } catch (err) {
      console.error('Failed to perform global search:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        background: isDark ? theme.palette.background.paper : '#FAFAF8',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: theme.palette.divider,
      }}
    >
      {/* Logo Area */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #F4A623 0%, #F7C965 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(244, 166, 35, 0.2)',
            flexShrink: 0,
          }}
        >
          <GavelIcon sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {settings?.community_name || 'Sangam'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Auction Manager
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ color: theme.palette.text.secondary, ml: 'auto' }}
            size="small"
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: theme.palette.divider, mx: 2 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, pt: 1.5, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: '10px',
                  py: 0.9,
                  px: 1.5,
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive
                    ? (isDark ? 'action.selected' : '#FFF6E8')
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? (isDark ? 'action.selected' : '#FFF6E8')
                      : (isDark ? 'action.hover' : '#F3F0EB'),
                  },
                  ...(isActive && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 20,
                      borderRadius: '0 3px 3px 0',
                      background: '#F4A623',
                    },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#F4A623' : theme.palette.text.secondary,
                    minWidth: 36,
                    transition: 'color 0.15s ease',
                    '& svg': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.84rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
                      letterSpacing: '0.01em',
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, pt: 0 }}>
        <Divider sx={{ borderColor: theme.palette.divider, mb: 1.5 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 0.5,
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: isDark ? '#27272A' : '#FFF6E8',
              color: '#F4A623',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {t('admin')[0]}
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.3 }}
            >
              {t('admin')}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.palette.text.secondary, fontSize: '0.65rem' }}
            >
              {t('administrator')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar sx={{ py: 0.5, minHeight: '52px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
                letterSpacing: '-0.01em',
                mr: 3,
                color: theme.palette.text.primary,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {navItems.find((item) => item.path === location.pathname)?.text || settings?.community_name || 'Sangam'}
            </Typography>

            {/* Global Search input */}
            <Box
              sx={{
                position: 'relative',
                borderRadius: '10px',
                backgroundColor: isDark ? '#0D1117' : '#F3F0EB',
                border: '1px solid',
                borderColor: theme.palette.divider,
                '&:hover': {
                  backgroundColor: isDark ? 'action.hover' : '#EDE9E3',
                },
                '&:focus-within': {
                  borderColor: '#F4A623',
                  backgroundColor: isDark ? '#161B22' : '#FFFFFF',
                },
                transition: 'all 0.2s ease',
                marginRight: 2,
                marginLeft: 0,
                width: { xs: '100%', sm: '260px' },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box sx={{ px: 1.25, display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 16 }} />
              </Box>
              <InputBase
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                sx={{
                  color: theme.palette.text.primary,
                  width: '100%',
                  '& .MuiInputBase-input': {
                    padding: '6px 8px 6px 0px',
                    fontSize: '0.8rem',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Language Switch Toggle Button */}
          <Tooltip title={language === 'en' ? 'மாற்றவும்: தமிழ்' : 'Switch to: English'}>
            <IconButton onClick={toggleLanguage} color="inherit" size="small" sx={{ mr: 2, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 2, px: 1.5, py: 0.5 }}>
              <LanguageIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="button" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                {language === 'en' ? 'TA' : 'EN'}
              </Typography>
            </IconButton>
          </Tooltip>

          <Tooltip title={t('notifications')}>
            <IconButton color="inherit" size="small" sx={{ mr: 1, color: theme.palette.text.primary }}>
              <Badge badgeContent={3} color="secondary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16 } }}>
                <NotificationsIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: isDark ? '#27272A' : '#FFF6E8',
              color: theme.palette.text.primary,
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '2px solid',
              borderColor: theme.palette.divider,
            }}
          >
            {t('admin')[0]}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, sm: 2.5 },
          py: { xs: 1.5, sm: 2 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          background: 'transparent',
          position: 'relative',
        }}
      >
        <Toolbar sx={{ minHeight: '52px !important' }} />
        <Box className="page-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>

      {/* Global Search Results Dialog */}
      <Dialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery('');
          setSearchResults(null);
        }}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: { sx: { borderRadius: 3 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1, fontSize: '1rem' }}>
          Search Results for "{searchQuery}"
        </DialogTitle>
        <DialogContent dividers>
          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : !searchResults || (
            !searchResults.members?.length &&
            !searchResults.auctions?.length &&
            !searchResults.expenses?.length &&
            !searchResults.loans?.length
          ) ? (
            <Box sx={{ py: 3 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                No matching results found across Members, Auctions, Expenses, or Loans.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {/* Members */}
              {searchResults.members && searchResults.members.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Members ({searchResults.members.length})
                  </Typography>
                  <List dense>
                    {searchResults.members.map((m) => (
                      <ListItem key={m.id} button onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/members'); }}>
                        <ListItemIcon><PeopleIcon color="primary" /></ListItemIcon>
                        <ListItemText primary={m.title} secondary={m.subtitle} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Auctions */}
              {searchResults.auctions && searchResults.auctions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Auctions ({searchResults.auctions.length})
                  </Typography>
                  <List dense>
                    {searchResults.auctions.map((a) => (
                      <ListItem key={a.id} button onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/auctions'); }}>
                        <ListItemIcon><GavelIcon color="primary" /></ListItemIcon>
                        <ListItemText primary={a.title} secondary={a.subtitle} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Expenses */}
              {searchResults.expenses && searchResults.expenses.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Expenses ({searchResults.expenses.length})
                  </Typography>
                  <List dense>
                    {searchResults.expenses.map((e) => (
                      <ListItem key={e.id} button onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/expenses'); }}>
                        <ListItemIcon><ReceiptIcon color="primary" /></ListItemIcon>
                        <ListItemText primary={e.title} secondary={e.subtitle} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Loans */}
              {searchResults.loans && searchResults.loans.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Loans ({searchResults.loans.length})
                  </Typography>
                  <List dense>
                    {searchResults.loans.map((l) => (
                      <ListItem key={l.id} button onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/finance'); }}>
                        <ListItemIcon><LocalAtmIcon color="primary" /></ListItemIcon>
                        <ListItemText primary={l.title} secondary={l.subtitle} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} color="primary" size="small">
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
