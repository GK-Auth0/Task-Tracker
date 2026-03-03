import { useEffect, useMemo, useState } from "react";
import { usersAPI } from "../services/dashboard";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: "Admin" | "Member" | "Viewer";
  avatar_url?: string;
}

export default function TeamManagement() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    fetchMembers();
  }, [paginationModel]);

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

  const roleCounts = useMemo(
    () => ({
      admins: members.filter((m) => m.role === "Admin").length,
      members: members.filter((m) => m.role === "Member").length,
      viewers: members.filter((m) => m.role === "Viewer").length,
    }),
    [members],
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
        if (!response.data.length) return;

        const csvData = response.data.map((member) => ({
          Name: member.full_name,
          Email: member.email,
          Role: member.role,
          Status: "Active",
        }));

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
      renderCell: (params) => (
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={params.row.avatar_url}
            alt={params.value}
            sx={{
              bgcolor: "rgba(37, 99, 235, 0.1)",
              color: "rgb(37, 99, 235)",
              fontWeight: 700,
              width: 40,
              height: 40,
            }}
          >
            {getInitials(params.value)}
          </Avatar>
          <Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: "rgb(15, 23, 42)" }}
            >
              {params.value}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgb(100, 116, 139)" }}>
              Team Member
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
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          sx={{
            fontWeight: 700,
            borderWidth: 1,
            ...getRoleColor(params.value),
          }}
        />
      ),
    },
    {
      field: "status",
      headerName: "STATUS",
      width: 120,
      renderCell: () => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "9999px",
              bgcolor: "rgb(34, 197, 94)",
            }}
          />
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "rgb(15, 23, 42)" }}
          >
            Active
          </Typography>
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "ACTIONS",
      width: 100,
      sortable: false,
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
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 p-4 pb-24 sm:gap-8 sm:p-6 sm:pb-24 lg:p-8 lg:pb-10">
        {/* Page Heading */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-2">
            <nav className="hidden items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500 sm:flex">
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
            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
              Team Management
            </h1>
            <p className="max-w-xl text-sm text-slate-500 sm:text-base">
              Control access, assign roles, and manage invitations for your
              entire workspace from one centralized dashboard.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
              onClick={exportToCSV}
            >
              <span className="material-symbols-outlined text-lg">
                file_download
              </span>
              Export CSV
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
              onClick={() => navigate("/coming-soon")}
            >
              <span className="material-symbols-outlined text-lg">
                person_add
              </span>
              Invite Member
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                Total Members
              </p>
              <span className="material-symbols-outlined text-blue-600">
                groups
              </span>
            </div>
            <p className="text-slate-900 text-3xl font-bold">{totalRows}</p>
            <div className="flex items-center gap-1 text-green-500 text-xs font-bold">
              <span className="material-symbols-outlined text-xs">
                trending_up
              </span>
              Active team
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                Admins
              </p>
              <span className="material-symbols-outlined text-blue-600">
                admin_panel_settings
              </span>
            </div>
            <p className="text-slate-900 text-3xl font-bold">
              {roleCounts.admins}
            </p>
            <p className="text-slate-500 text-xs font-medium">Full access</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                Members
              </p>
              <span className="material-symbols-outlined text-green-500">
                person
              </span>
            </div>
            <p className="text-slate-900 text-3xl font-bold">
              {roleCounts.members}
            </p>
            <p className="text-slate-500 text-xs font-medium">
              Standard access
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                Viewers
              </p>
              <span className="material-symbols-outlined text-slate-400">
                visibility
              </span>
            </div>
            <p className="text-slate-900 text-3xl font-bold">
              {roleCounts.viewers}
            </p>
            <p className="text-slate-500 text-xs font-medium">
              Read-only access
            </p>
          </div>
        </div>

        {/* Members DataGrid */}
        <div className="hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
          <DataGrid
            rows={members}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={totalRows}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            paginationMode="server"
            disableRowSelectionOnClick
            sx={{
              border: 0,
              minHeight: 420,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "rgb(248, 250, 252)",
                color: "rgb(15, 23, 42)",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                borderBottom: "none",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "none",
                borderRight: "none",
              },
              "& .MuiDataGrid-row": {
                minHeight: "88px !important",
                maxHeight: "88px !important",
                "&:not(:last-child)": {
                  borderBottom: "none",
                },
              },
              "& .MuiDataGrid-row .MuiDataGrid-cell": {
                borderBottom: "none",
                padding: "12px 16px",
                overflow: "visible",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgb(248, 250, 252)",
              },
              "& .MuiDataGrid-columnSeparator": {
                display: "none",
              },
            }}
          />
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Loading team members...
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              No team members found.
            </div>
          ) : (
            members.map((member) => (
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
                      width: 40,
                      height: 40,
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
                    label={member.role}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontWeight: 700,
                      borderWidth: 1,
                      ...getRoleColor(member.role),
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
