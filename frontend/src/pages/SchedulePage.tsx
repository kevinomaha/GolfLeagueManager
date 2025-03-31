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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { scheduleService, playerService } from '../services/api';
import { Schedule, Player } from '../types';

export const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [time, setTime] = useState('');
  const [course, setCourse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedulesResponse, playersResponse] = await Promise.all([
        scheduleService.getAllWeeks(),
        playerService.getAllPlayers(),
      ]);

      if (schedulesResponse.statusCode === 200) {
        setSchedules(schedulesResponse.body);
      }
      if (playersResponse.statusCode === 200) {
        setPlayers(playersResponse.body);
      }
    } catch (err) {
      setError('Failed to load schedule data');
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDate(null);
    setSelectedPlayer('');
    setTime('');
    setCourse('');
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedPlayer || !time || !course) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const weekId = format(selectedDate, 'yyyy-MM-dd');
      const response = await scheduleService.createSchedule({
        weekId,
        playerId: selectedPlayer,
        time,
        course,
      });

      if (response.statusCode === 201) {
        handleCloseDialog();
        loadData();
      } else {
        setError('Failed to create schedule');
      }
    } catch (err) {
      setError('An error occurred while creating the schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Schedule</Typography>
        <Button variant="contained" onClick={handleOpenDialog}>
          Add Schedule
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
              <TableCell>Player</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Course</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.map((schedule) => {
              const player = players.find((p) => p.id === schedule.playerId);
              return (
                <TableRow key={`${schedule.weekId}-${schedule.playerId}`}>
                  <TableCell>{format(new Date(schedule.weekId), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{player?.name || 'Unknown Player'}</TableCell>
                  <TableCell>{schedule.time}</TableCell>
                  <TableCell>{schedule.course}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add Schedule</DialogTitle>
        <DialogContent>
          <DatePicker
            label="Week"
            value={selectedDate}
            onChange={(newValue) => setSelectedDate(newValue)}
            sx={{ width: '100%', mb: 2 }}
          />
          <TextField
            select
            fullWidth
            label="Player"
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            sx={{ mb: 2 }}
          >
            {players.map((player) => (
              <MenuItem key={player.id} value={player.id}>
                {player.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Course"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Adding...' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 