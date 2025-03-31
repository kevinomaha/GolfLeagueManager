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
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { playerService } from '../services/api';
import { Player } from '../types';

export const PlayersPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await playerService.getAllPlayers();
      if (response.statusCode === 200) {
        setPlayers(response.body);
      }
    } catch (err) {
      setError('Failed to load players');
    }
  };

  const handleOpenDialog = (player?: Player) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({
        name: player.name,
        email: player.email,
        phoneNumber: player.phoneNumber,
      });
    } else {
      setEditingPlayer(null);
      setFormData({
        name: '',
        email: '',
        phoneNumber: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPlayer(null);
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.phoneNumber) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingPlayer) {
        const response = await playerService.updatePlayer(editingPlayer.id, formData);
        if (response.statusCode === 200) {
          handleCloseDialog();
          loadPlayers();
        } else {
          setError('Failed to update player');
        }
      } else {
        const response = await playerService.createPlayer(formData);
        if (response.statusCode === 201) {
          handleCloseDialog();
          loadPlayers();
        } else {
          setError('Failed to create player');
        }
      }
    } catch (err) {
      setError('An error occurred while saving the player');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (playerId: string) => {
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await playerService.deletePlayer(playerId);
      if (response.statusCode === 200) {
        loadPlayers();
      } else {
        setError('Failed to delete player');
      }
    } catch (err) {
      setError('An error occurred while deleting the player');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Players</Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add Player
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Weeks Scheduled</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell>{player.name}</TableCell>
                <TableCell>{player.email}</TableCell>
                <TableCell>{player.phoneNumber}</TableCell>
                <TableCell>{player.weeksScheduled.length}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => handleOpenDialog(player)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(player.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingPlayer ? 'Edit Player' : 'Add Player'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : editingPlayer ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 