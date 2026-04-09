import { useEffect, useMemo, useState } from "react";
import { usersAPI } from "../services/dashboard";
import { inviteAPI, InviteData, Invite } from "../services/inviteService";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import RingLoader from "./RingLoader";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: "Admin" | "Member" | "Viewer";
  avatar_url?: string;
}

type TeamRow = {
  id: string;
  full_name: string;
  email: string;
  role: "Admin" | "Member" | "Viewer" | "Invited";
  status: "Active" | "Invited" | "Expired";
  avatar_url?: string;
  isInvite?: boolean;
  invite_code?: string;
};

export default function TeamManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | TeamMember["role"]>(
    "All",
  );
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Invited" | "Expired"
  >(
    "All",
  );
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);
  
  // Invite modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData>({ email: '', role: 'Member' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  
  // Invites management
  const [invites, setInvites] = useState<Invite[]>([]);

  useEffect(() => {
    fetchMembers();
    if (user?.role === 'Admin') {
      fetchInvites();
    }
  }, [paginationModel, user]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await usersAPI.getUsers({
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
      });
      if (response.success) {
        setMembers(response.data);
        setTotalRows(response.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      setError("Unable to load team members right now.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await inviteAPI.getMyInvites();
      if (response.success) {
        setInvites(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteData.email.trim()) {
      setInviteError('Email is required');
      return;
    }

    setInviteLoading(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const response = await inviteAPI.sendInvite(inviteData);
      if (response.success) {
        const orgCodeText = response.data?.orgCode
          ? ` Personal org code: ${response.data.orgCode}`
          : "";
        setInviteSuccess(`Invite sent successfully to ${inviteData.email}.${orgCodeText}`);
        setInviteData({ email: '', role: 'Member' });
        fetchInvites(); // Refresh invites list
        setTimeout(() => {
          setInviteModalOpen(false);
          setInviteSuccess('');
        }, 2000);
      } else {
        setInviteError(response.error || 'Failed to send invite');
      }
    } catch (error: any) {
      setInviteError(error.response?.data?.error || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
    setInviteData({ email: '', role: 'Member' });
    setInviteError('');
    setInviteSuccess('');
  };

  const roleCounts = useMemo(
    () => ({
      admins: members.filter((m) => m.role === "Admin").length,
      members: members.filter((m) => m.role === "Member").length,
      viewers: members.filter((m) => m.role === "Viewer").length,
    }),
    [members],
  );

  const inviteRows = useMemo<TeamRow[]>(
    () =>
      invites.map((invite) => ({
        id: `invite-${invite.id}`,
        full_name:
          invite.invitee?.full_name ||
          invite.invitee_email.split("@")[0] ||
          "Invited User",
        email: invite.invitee_email,
        role: (invite.invitee?.role as TeamRow["role"]) || "Invited",
        status:
          invite.status === "pending"
            ? "Invited"
            : invite.status === "expired"
              ? "Expired"
              : "Active",
        avatar_url: invite.invitee?.avatar_url,
        isInvite: true,
        invite_code: invite.invite_code,
      })),
    [invites],
  );

  const memberRows = useMemo<TeamRow[]>(
    () =>
      members.map((member) => ({
        id: member.id,
        full_name: member.full_name,
        email: member.email,
        role: member.role,
        status: "Active",
        avatar_url: member.avatar_url,
      })),
    [members],
  );

  const combinedRows = useMemo<TeamRow[]>(
    () => [...inviteRows, ...memberRows],
    [inviteRows, memberRows],
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return combinedRows.filter((member) => {
      const matchesQuery =
        query.length === 0 ||
        member.full_name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "All" || member.role === roleFilter;
      const matchesStatus =
        statusFilter === "All" ? true : member.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [combinedRows, roleFilter, searchQuery, statusFilter]);

  const quickStats = useMemo(
    () => [
      {
        label: "Total members",
        value: totalRows,
        icon: "groups",
        accent: "text-blue-600",
      },
      {
        label: "Admins",
        value: roleCounts.admins,
        icon: "admin_panel_settings",
        accent: "text-indigo-500",
      },
      {
        label: "Members",
        value: roleCounts.members,
        icon: "person",
        accent: "text-emerald-500",
      },
      {
        label: "Viewers",
        value: roleCounts.viewers,
        icon: "visibility",
        accent: "text-slate-500",
      },
    ],
    [roleCounts, totalRows],
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return {
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          color: "rgb(37, 99, 235)",
          borderColor: "rgba(37, 99, 235, 0.2)",
        };
      case "Member":
        return {
          backgroundColor: "rgb(241, 245, 249)",
          color: "rgb(51, 65, 85)",
          borderColor: "rgb(226, 232, 240)",
        };
      case "Viewer":
        return {
          backgroundColor: "rgb(248, 250, 252)",
          color: "rgb(100, 116, 139)",
          borderColor: "rgb(241, 245, 249)",
        };
      case "Invited":
        return {
          backgroundColor: "rgba(234, 179, 8, 0.12)",
          color: "rgb(161, 98, 7)",
          borderColor: "rgba(234, 179, 8, 0.25)",
        };
      default:
        return {
          backgroundColor: "rgb(241, 245, 249)",
          color: "rgb(51, 65, 85)",
          borderColor: "rgb(226, 232, 240)",
        };
    }
  };

  const exportToCSV = async () => {
    try {
      // Fetch all users for export
      const response = await usersAPI.getUsers({ limit: 1000 });
      if (response.success) {
        const inviteRowsForExport = invites.map((invite) => ({
          Name:
            invite.invitee?.full_name ||
            invite.invitee_email.split("@")[0] ||
            "Invited User",
          Email: invite.invitee_email,
          Role: invite.invitee?.role || "Invited",
          Status:
            invite.status === "pending"
              ? "Invited"
              : invite.status === "expired"
                ? "Expired"
                : "Active",
        }));

        const csvData = [
          ...inviteRowsForExport,
          ...response.data.map((member) => ({
            Name: member.full_name,
            Email: member.email,
            Role: member.role,
            Status: "Active",
          })),
        ];

        if (!csvData.length) return;

        const headers = Object.keys(csvData[0]);
        const escapeCell = (value: string) =>
          `"${String(value).replace(/"/g, '""')}"`;
        const csvContent = [
          headers.join(","),
          ...csvData.map((row) =>
            headers.map((key) => escapeCell((row as any)[key])).join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "team-members.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export CSV:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const columns: GridColDef[] = [
    {
      field: "full_name",
      headerName: "NAME",
      flex: 1,
      minWidth: 250,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: "100%", minWidth: 0, overflow: "hidden" }}
        >
          <Avatar
            src={params.row.avatar_url}
            alt={params.value}
            sx={{
              bgcolor: "rgba(37, 99, 235, 0.1)",
              color: "rgb(37, 99, 235)",
              fontWeight: 700,
              width: 36,
              height: 36,
              flexShrink: 0,
            }}
          >
            {getInitials(params.value)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 700,
                color: "rgb(15, 23, 42)",
                lineHeight: 1.2,
              }}
            >
              {params.value}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: "email",
      headerName: "EMAIL",
      flex: 1,
      minWidth: 200,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => (
        <Typography sx={{ color: "rgb(100, 116, 139)" }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: "role",
      headerName: "ROLE",
      width: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const isInvited = params.row.status === "Invited";
        const label = isInvited ? "Invited" : params.value;
        return (
          <Chip
            label={label}
            size="small"
            variant="outlined"
            sx={{
              fontWeight: 700,
              borderWidth: 1,
              ...getRoleColor(label),
            }}
          />
        );
      },
    },
    {
      field: "status",
      headerName: "STATUS",
      width: 140,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const status = params.row.status as TeamRow["status"];
        const statusColor =
          status === "Active"
            ? "rgb(34, 197, 94)"
            : status === "Invited"
              ? "rgb(234, 179, 8)"
              : "rgb(248, 113, 113)";
        return (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "9999px",
                bgcolor: statusColor,
              }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "rgb(15, 23, 42)" }}
            >
              {status}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: "actions",
      headerName: "ACTIONS",
      width: 100,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: () => (
        <IconButton
          onClick={() => navigate("/coming-soon")}
          sx={{ color: "rgb(100, 116, 139)" }}
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </IconButton>
      ),
    },
  ];

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 p-4 pb-20 sm:gap-6 sm:p-6 sm:pb-20 lg:p-8 lg:pb-8">
        {/* Page Heading */}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-slate-900 shadow-sm sm:px-6 sm:py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <nav className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 sm:flex">
                <button
                  onClick={() => navigate("/coming-soon")}
                  className="hover:text-blue-600 transition-colors"
                >
                  Organization
                </button>
                <span className="material-symbols-outlined text-xs">
                  chevron_right
                </span>
                <span className="text-blue-600">Team Management</span>
              </nav>
              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Team Management
              </h1>
              <p className="max-w-xl text-sm text-slate-600">
                Manage roles, visibility, and invitations with a clean,
                centralized control hub for your workspace.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                onClick={exportToCSV}
              >
                <span className="material-symbols-outlined text-lg">
                  file_download
                </span>
                Export CSV
              </button>
              <button
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-50"
                onClick={() => setInviteModalOpen(true)}
                disabled={user?.role !== 'Admin'}
                title={user?.role !== 'Admin' ? 'Only administrators can send invites' : 'Send invite to new team member'}
              >
                <span className="material-symbols-outlined text-lg">
                  person_add
                </span>
                Invite Member
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-center justify-between gap-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchMembers}
                className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </div>
              <span className={`material-symbols-outlined ${stat.accent}`}>
                {stat.icon}
              </span>
            </div>
          ))}
        </div>

        {/* Filters + Actions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name or email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["All", "Admin", "Member", "Viewer"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      roleFilter === role
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["All", "Active", "Invited", "Expired"] as const).map(
                (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === status
                      ? "bg-emerald-500 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {status}
                </button>
              ))}
              <button
                onClick={() => navigate("/coming-soon")}
                className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                Advanced
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-col items-start justify-between gap-2 text-xs text-slate-500 sm:flex-row sm:items-center">
            <span>
              Showing {filteredRows.length} of {combinedRows.length} rows.
            </span>
            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("All");
                setStatusFilter("All");
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* Members DataGrid */}
        <div className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
          <DataGrid
            rows={filteredRows}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={totalRows + invites.length}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            paginationMode="server"
            disableRowSelectionOnClick
            rowHeight={72}
            columnHeaderHeight={48}
            sx={{
              border: 0,
              height: 520,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "rgba(248, 250, 252, 0.8)",
                color: "rgb(15, 23, 42)",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                borderBottom: "none",
                alignItems: "center",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none",
                borderRight: "none",
                display: "flex",
                alignItems: "center",
              },
              "& .MuiDataGrid-virtualScroller": {
                backgroundImage:
                  "linear-gradient(180deg, rgba(248,250,252,0.6) 0%, rgba(255,255,255,1) 120px)",
              },
              "& .MuiDataGrid-row": {
                minHeight: "72px !important",
                maxHeight: "72px !important",
                "&:not(:last-child)": {
                  borderBottom: "none",
                },
              },
              "& .MuiDataGrid-row .MuiDataGrid-cell": {
                borderBottom: "none",
                padding: "12px 16px",
                overflow: "hidden",
              },
              "& .MuiDataGrid-cellContent": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(226, 232, 240, 0.4)",
              },
              "& .MuiDataGrid-columnSeparator": {
                display: "none",
              },
            }}
          />
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
              <RingLoader size="sm" />
              Loading team members...
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              No team members found.
            </div>
          ) : (
            filteredRows.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={member.avatar_url}
                    alt={member.full_name}
                    sx={{
                      bgcolor: "rgba(37, 99, 235, 0.1)",
                      color: "rgb(37, 99, 235)",
                      fontWeight: 700,
                      width: 36,
                      height: 36,
                    }}
                  >
                    {getInitials(member.full_name)}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {member.full_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{member.email}</p>
                  </div>
                  <Chip
                    label={member.status === "Invited" ? "Invited" : member.role}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 700,
                      borderWidth: 1,
                      ...getRoleColor(
                        member.status === "Invited" ? "Invited" : member.role,
                      ),
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onClose={handleCloseInviteModal} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {inviteError && (
              <Alert severity="error">{inviteError}</Alert>
            )}
            {inviteSuccess && (
              <Alert severity="success">{inviteSuccess}</Alert>
            )}
            
            <TextField
              label="Email Address"
              type="email"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              fullWidth
              required
              placeholder="Enter email address"
              disabled={inviteLoading}
            />
            
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteData.role}
                label="Role"
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'Admin' | 'Member' | 'Viewer' })}
                disabled={inviteLoading}
              >
                <MenuItem value="Viewer">Viewer - Can view projects and tasks</MenuItem>
                <MenuItem value="Member">Member - Can create and edit tasks</MenuItem>
                <MenuItem value="Admin">Admin - Full access including user management</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Note:</strong> Each invited user gets their own unique organization access code.
                That code is safer than sharing one common code across the whole organization.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInviteModal} disabled={inviteLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendInvite} 
            variant="contained" 
            disabled={inviteLoading || !inviteData.email.trim()}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {inviteLoading ? <RingLoader size="sm" className="text-white" /> : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  );
}
