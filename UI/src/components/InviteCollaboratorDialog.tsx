import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import RingLoader from "./RingLoader";
import { inviteAPI } from "../services/inviteService";

interface InviteCollaboratorDialogProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  onAddInvite: (invitee: { full_name: string; email: string }) => boolean;
  sendInviteImmediately?: boolean;
  defaultRole?: "Admin" | "Member" | "Viewer";
  showRoleSelector?: boolean;
}

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function InviteCollaboratorDialog({
  open,
  title = "Invite Collaborator",
  onClose,
  onAddInvite,
  sendInviteImmediately = false,
  defaultRole = "Member",
  showRoleSelector = false,
}: InviteCollaboratorDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"Admin" | "Member" | "Viewer">(defaultRole);

  const handleClose = () => {
    setError("");
    setFullName("");
    setEmail("");
    onClose();
  };

  const handleAdd = async () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Full name is required");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      if (sendInviteImmediately) {
        const response = await inviteAPI.sendInvite({
          email: trimmedEmail,
          role: showRoleSelector ? role : defaultRole,
        });
        if (!response.success) {
          setError(response.error || "Failed to send invite");
          return;
        }
      }

      const added = onAddInvite({ full_name: trimmedName, email: trimmedEmail });
      if (!added) {
        setError("This email is already invited");
        return;
      }

      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            fullWidth
            required
            placeholder="Enter full name"
          />

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            placeholder="Enter email address"
          />

          {showRoleSelector && (
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                label="Role"
                onChange={(e) =>
                  setRole(e.target.value as "Admin" | "Member" | "Viewer")
                }
              >
                <MenuItem value="Viewer">Viewer - Can view projects and tasks</MenuItem>
                <MenuItem value="Member">Member - Can create and edit tasks</MenuItem>
                <MenuItem value="Admin">Admin - Full access including user management</MenuItem>
              </Select>
            </FormControl>
          )}

          {showRoleSelector && (
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <strong>Note:</strong> The invited user will receive an email with a temporary
              password. They will be required to change it on their first login.
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleAdd} disabled={loading}>
          {loading ? <RingLoader size="sm" className="text-white" /> : "Add Invite"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
