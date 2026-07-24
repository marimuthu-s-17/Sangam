import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { WarningAmber as WarningIcon } from '@mui/icons-material';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
            p: 3
          }}
        >
          <Card
            sx={{
              maxWidth: 500,
              borderRadius: 3,
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              p: 2,
              textAlign: 'center'
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'inline-flex',
                  p: 2,
                  borderRadius: '50%',
                  bgcolor: 'error.light',
                  color: 'error.main',
                  mb: 2
                }}
              >
                <WarningIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
                Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                An unexpected rendering error occurred. Please reload the page or click below to return home.
              </Typography>
              {this.state.error && (
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    overflowX: 'auto',
                    mb: 3,
                    maxHeight: 120
                  }}
                >
                  {this.state.error.toString()}
                </Box>
              )}
              <Button
                variant="contained"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                sx={{ px: 4 }}
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}
