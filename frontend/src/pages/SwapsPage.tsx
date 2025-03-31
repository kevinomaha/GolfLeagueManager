import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import { swapService, playerService, scheduleService } from '../services/api';
import { SwapRequest, Player, Schedule } from '../types';

export const SwapsPage: React.FC = () => {
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    weekId: '',
    requestingPlayerId: '',
    targetPlayerId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [swapsResponse, playersResponse, schedulesResponse] = await Promise.all([
        swapService.getAllSwaps(),
        playerService.getAllPlayers(),
        scheduleService.getAllWeeks(),
      ]);

      if (swapsResponse.statusCode === 200) {
        setSwaps(swapsResponse.body);
      }
      if (playersResponse.statusCode === 200) {
        setPlayers(playersResponse.body);
      }
      if (schedulesResponse.statusCode === 200) {
        setSchedules(schedulesResponse.body);
      }
    } catch (err) {
      setError('Failed to load swap data');
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      weekId: '',
      requestingPlayerId: '',
      targetPlayerId: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.weekId || !formData.requestingPlayerId || !formData.targetPlayerId) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await swapService.createSwap(formData);
      if (response.statusCode === 201) {
        handleCloseDialog();
        loadData();
      } else {
        setError('Failed to create swap request');
      }
    } catch (err) {
      setError('An error occurred while creating the swap request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSwap = async (swapId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await swapService.approveSwap(swapId);
      if (response.statusCode === 200) {
        loadData();
      } else {
        setError('Failed to approve swap request');
      }
    } catch (err) {
      setError('An error occurred while approving the swap request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSwap = async (swapId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await swapService.rejectSwap(swapId);
      if (response.statusCode === 200) {
        loadData();
      } else {
        setError('Failed to reject swap request');
      }
    } catch (err) {
      setError('An error occurred while rejecting the swap request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Swap Requests</Typography>
        <Button variant="contained" onClick={handleOpenDialog}>
          Request Swap
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Week</TableCell>
              <TableCell>Requesting Player</TableCell>
              <TableCell>Target Player</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {swaps.map((swap) => {
              const requestingPlayer = players.find((p) => p.id === swap.requestingPlayerId);
              const targetPlayer = players.find((p) => p.id === swap.targetPlayerId);
              const schedule = schedules.find((s) => s.weekId === swap.weekId);

              return (
                <TableRow key={swap.id}>
                  <TableCell>{format(new Date(swap.weekId), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{requestingPlayer?.name || 'Unknown Player'}</TableCell>
                  <TableCell>{targetPlayer?.name || 'Unknown Player'}</TableCell>
                  <TableCell>
                    <Chip
                      label={swap.status}
                      color={getStatusColor(swap.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{format(new Date(swap.createdAt), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    {swap.status === 'PENDING' && (
                      <>
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleApproveSwap(swap.id)}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleRejectSwap(swap.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Request Swap</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Week"
            value={formData.weekId}
            onChange={(e) => setFormData({ ...formData, weekId: e.target.value })}
            sx={{ mb: 2 }}
          >
            {schedules.map((schedule) => (
              <MenuItem key={schedule.weekId} value={schedule.weekId}>
                {format(new Date(schedule.weekId), 'MMM dd, yyyy')}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Requesting Player"
            value={formData.requestingPlayerId}
            onChange={(e) => setFormData({ ...formData, requestingPlayerId: e.target.value })}
            sx={{ mb: 2 }}
          >
            {players.map((player) => (
              <MenuItem key={player.id} value={player.id}>
                {player.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Target Player"
            value={formData.targetPlayerId}
            onChange={(e) => setFormData({ ...formData, targetPlayerId: e.target.value })}
          >
            {players.map((player) => (
              <MenuItem key={player.id} value={player.id}>
                {player.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 