import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Auctions from './pages/Auctions';
import Expenses from './pages/Expenses';
import Finance from './pages/Finance';
import Ledger from './pages/Ledger';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { SettingsProvider } from './context/SettingsContext';

function App() {
  return (
    <SettingsProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="auctions" element={<Auctions />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="loans" element={<Navigate to="/finance" replace />} />
          <Route path="finance" element={<Finance />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </SettingsProvider>
  );
}

export default App;
