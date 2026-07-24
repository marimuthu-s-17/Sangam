import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
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
} from '@mui/icons-material';

const DRAWER_WIDTH = 284;

const navItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Members', icon: <PeopleIcon />, path: '/members' },
  { text: 'Auctions', icon: <GavelIcon />, path: '/auctions' },
  { text: 'Expenses', icon: <ReceiptIcon />, path: '/expenses' },
  { text: 'Loans', icon: <LocalAtmIcon />, path: '/loans' },
  { text: 'Finance', icon: <AccountBalanceIcon />, path: '/finance' },
  { text: 'Member Ledger', icon: <MenuBookIcon />, path: '/ledger' },
  { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function MainLayout() {
  const { settings } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

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

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(180deg, #FFFDF9 0%, #F8F2EA 100%)',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #F0EBE2',
      }}
    >
      {/* Logo Area */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #F4A623 0%, #F7C965 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 24px rgba(244, 166, 35, 0.22)',
          }}
        >
          <GavelIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              color: '#1A1A1A',
              fontWeight: 800,
              fontSize: '1.12rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            {settings?.community_name || 'Sangam'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#8A8A8A',
              fontSize: '0.65rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Auction Manager
          </Typography>
        </Box>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ color: '#8A8A8A', ml: 'auto' }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: '#EFE9DE', mx: 2 }} />

      {/* Navigation */}
      <List sx={{ px: 1.5, pt: 2, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: '16px',
                  py: 1.3,
                  px: 1.8,
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive
                    ? '#FFF6E8'
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? '#FFF6E8'
                      : '#FCFBF9',
                  },
                  ...(isActive && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: 24,
                      borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(180deg, #F4A623, #F7C965)',
                    },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#F4A623' : '#8A8A8A',
                    minWidth: 40,
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#1A1A1A' : '#6B6B6B',
                      letterSpacing: '0.01em',
                    }
                  }}
                />
                {isActive && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #F4A623, #F7C965)',
                      boxShadow: '0 0 8px rgba(244, 166, 35, 0.3)',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ borderColor: '#EFE9DE', mb: 2 }} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1,
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#FFF6E8',
              color: '#F4A623',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            A
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}
            >
              Admin
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: '#8A8A8A', fontSize: '0.72rem' }}
            >
              Administrator
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          backdropFilter: 'blur(20px)',
          background: 'transparent',
        }}
      >
        <Toolbar sx={{ py: 0.5 }}>
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
                fontSize: '1.06rem',
                letterSpacing: '-0.01em',
                mr: 3,
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {navItems.find((item) => item.path === location.pathname)?.text || settings?.community_name || 'Sangam'}
            </Typography>

            {/* Global Search input */}
            <Box
              sx={{
                position: 'relative',
                borderRadius: '999px',
                backgroundColor: '#F8F2EA',
                border: '1px solid #EFE9DE',
                '&:hover': {
                  backgroundColor: '#F3EBDD',
                },
                marginRight: 2,
                marginLeft: 0,
                width: { xs: '100%', sm: '300px' },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box sx={{ p: '0px 10px', display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ color: '#8A8A8A', fontSize: 18 }} />
              </Box>
              <InputBase
                placeholder="Global Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                sx={{
                  color: '#1A1A1A',
                  width: '100%',
                  '& .MuiInputBase-input': {
                    padding: '6px 6px 6px 0px',
                    fontSize: '0.8rem',
                  },
                }}
              />
            </Box>
          </Box>

          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={3} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: '#FFF6E8',
              color: '#1A1A1A',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: '2px solid #F0EBE2',
            }}
          >
            A
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
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          background: 'transparent',
          position: 'relative',
        }}
      >
        <Toolbar />
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
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Global Search Results for "{searchQuery}"
        </DialogTitle>
        <DialogContent dividers>
          {searchLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : !searchResults || (
            !searchResults.members?.length &&
            !searchResults.auctions?.length &&
            !searchResults.expenses?.length &&
            !searchResults.loans?.length
          ) ? (
            <Box sx={{ py: 4 }}>
              <Typography variant="body1" color="text.secondary" align="center">
                No matching results found across Members, Auctions, Expenses, or Loans.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={4}>
              {/* Members */}
              {searchResults.members && searchResults.members.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1a237e' }}>
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1a237e' }}>
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1a237e' }}>
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1a237e' }}>
                    Loans ({searchResults.loans.length})
                  </Typography>
                  <List dense>
                    {searchResults.loans.map((l) => (
                      <ListItem key={l.id} button onClick={() => { setSearchOpen(false); setSearchQuery(''); navigate('/loans'); }}>
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
          <Button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
