import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Layout from './components/Layout';
import { SchedulePage } from './pages/SchedulePage';
import { PlayersPage } from './pages/PlayersPage';
import { SwapsPage } from './pages/SwapsPage';
import LoginPage from './pages/LoginPage';
import { getCurrentUser } from './services/cognito';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUser();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <SchedulePage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/schedule"
              element={
                <PrivateRoute>
                  <Layout>
                    <SchedulePage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/players"
              element={
                <PrivateRoute>
                  <Layout>
                    <PlayersPage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/swaps"
              element={
                <PrivateRoute>
                  <Layout>
                    <SwapsPage />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
