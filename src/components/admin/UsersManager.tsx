"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useToast } from "@/context/ToastContext";
import { ROLE_LABEL } from "@/lib/roles";
import { ROLE_VALUES } from "@/lib/schemas/user";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type UserListItem,
} from "@/hooks/useUsers";

interface FormState {
  email: string;
  name: string;
  password: string;
  role: (typeof ROLE_VALUES)[number];
  disabled: boolean;
}

const emptyForm: FormState = { email: "", name: "", password: "", role: "NURSE", disabled: false };

export default function UsersManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserListItem[];
  currentUserId: string;
}) {
  const { showToast } = useToast();
  const { data: users = [] } = useUsers(initialUsers);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toDelete, setToDelete] = useState<UserListItem | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (u: UserListItem) => {
    setEditing(u);
    setForm({ email: u.email, name: u.name, password: "", role: u.role, disabled: u.disabled });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editing) {
      const input: Record<string, unknown> = {
        name: form.name,
        role: form.role,
        disabled: form.disabled,
      };
      if (form.password) input.password = form.password;
      updateUser.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            showToast("Utente aggiornato", "success");
            setDialogOpen(false);
          },
          onError: (e) => showToast(e.message, "error"),
        }
      );
    } else {
      createUser.mutate(
        { email: form.email, name: form.name, password: form.password, role: form.role },
        {
          onSuccess: () => {
            showToast("Utente creato", "success");
            setDialogOpen(false);
          },
          onError: (e) => showToast(e.message, "error"),
        }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteUser.mutate(toDelete.id, {
      onSuccess: () => {
        showToast("Utente eliminato", "success");
        setToDelete(null);
      },
      onError: (e) => showToast(e.message, "error"),
    });
  };

  const isSelf = (u: UserListItem) => u.id === currentUserId;
  const pending = createUser.isPending || updateUser.isPending;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h1">Gestione utenti</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuovo utente
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Ruolo</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell>Creato</TableCell>
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.name || "—"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{ROLE_LABEL[u.role]}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {u.disabled ? (
                      <Chip label="Disabilitato" size="small" color="default" />
                    ) : (
                      <Chip label="Attivo" size="small" color="success" variant="outlined" />
                    )}
                    {u.forcePasswordChange && (
                      <Chip label="Cambio pwd richiesto" size="small" color="warning" variant="outlined" />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                  {format(new Date(u.createdAt), "d MMM yyyy", { locale: it })}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  <Tooltip title="Modifica">
                    <IconButton
                      size="small"
                      onClick={() => openEdit(u)}
                      aria-label="Modifica utente"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isSelf(u) ? "Non puoi eliminare te stesso" : "Elimina"}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => setToDelete(u)}
                        disabled={isSelf(u)}
                        aria-label="Elimina utente"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? "Modifica utente" : "Nuovo utente"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            disabled={!!editing}
            fullWidth
          />
          <TextField
            label="Nome"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <TextField
            label={editing ? "Nuova password (lascia vuoto per non cambiarla)" : "Password"}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            fullWidth
          />
          <TextField
            select
            label="Ruolo"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as FormState["role"] }))}
            fullWidth
          >
            {ROLE_VALUES.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </MenuItem>
            ))}
          </TextField>
          {editing && (
            <FormControlLabel
              control={
                <Switch
                  checked={form.disabled}
                  onChange={(e) => setForm((f) => ({ ...f, disabled: e.target.checked }))}
                  disabled={isSelf(editing)}
                />
              }
              label="Disabilitato"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={pending}>
            {editing ? "Salva" : "Crea"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)}>
        <DialogTitle>Eliminare l’utente?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toDelete?.email} verrà eliminato. L’operazione non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Annulla</Button>
          <Button color="error" onClick={handleConfirmDelete} disabled={deleteUser.isPending}>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
