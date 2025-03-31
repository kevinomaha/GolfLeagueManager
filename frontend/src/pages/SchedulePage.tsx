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

  // Define the dates for the golf league
  const dates = [
    { date: '2024-04-28', label: '28-Apr' },
    { date: '2024-05-05', label: '05-May' },
    { date: '2024-05-12', label: '12-May' },
    { date: '2024-05-19', label: '19-May' },
    { date: '2024-05-26', label: 'No Play', special: 'Memorial Day' },
    { date: '2024-07-02', label: '02-Jul' },
    { date: '2024-07-09', label: '09-Jul' },
    { date: '2024-07-16', label: '16-Jul' },
    { date: '2024-07-23', label: '23-Jul', special: 'Position Night' },
    { date: '2024-07-30', label: '30-Jul' },
    { date: '2024-08-07', label: '07-Aug' },
    { date: '2024-08-14', label: '14-Aug' },
    { date: '2024-08-18', label: '18-Aug', special: 'Champion Round' },
  ];

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

  const isPlayerScheduled = (playerId: string, date: string) => {
    return schedules.some(
      (schedule) => schedule.playerId === playerId && schedule.weekId === date
    );
  };

  const getTotalPlayers = (date: string) => {
    return schedules.filter((schedule) => schedule.weekId === date).length;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Golf League Schedule
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              {dates.map((date) => (
                <TableCell key={date.date} align="center">
                  {date.label}
                  {date.special && (
                    <Typography variant="caption" display="block">
                      {date.special}
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell component="th" scope="row">
                  {player.name} ({player.percentage}%)
                </TableCell>
                {dates.map((date) => (
                  <TableCell
                    key={`${player.id}-${date.date}`}
                    align="center"
                    sx={{
                      backgroundColor: date.special === 'Memorial Day' ? '#f5f5f5' : 'inherit',
                    }}
                  >
                    {isPlayerScheduled(player.id, date.date) ? '1' : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Total Players</TableCell>
              {dates.map((date) => (
                <TableCell key={`total-${date.date}`} align="center">
                  {getTotalPlayers(date.date)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>Tee Time</TableCell>
              {dates.map((date) => (
                <TableCell key={`tee-${date.date}`} align="center"></TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>Front/Back</TableCell>
              {dates.map((date) => (
                <TableCell key={`course-${date.date}`} align="center"></TableCell>
              ))}
            </TableRow>
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