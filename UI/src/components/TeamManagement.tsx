import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
    }
  };

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
        const csvData = response.data.map((member) => ({
          Name: member.full_name,
          Email: member.email,
          Role: member.role,
          Status: "Active",
        }));

        const csvContent = [
          Object.keys(csvData[0]).join(","),
          ...csvData.map((row) => Object.values(row).join(",")),
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
    <div className="w-full h-full bg-gray-50 p-8 overflow-y-auto">
      <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-8">
        {/* Page Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-widest">
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
            <h1 className="text-slate-900 text-4xl font-black leading-tight tracking-tight">
              Team Management
            </h1>
            <p className="text-slate-500 text-base max-w-xl">
              Control access, assign roles, and manage invitations for your
              entire workspace from one centralized dashboard.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
              onClick={exportToCSV}
            >
              <span className="material-symbols-outlined text-lg">
                file_download
              </span>
              Export CSV
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              onClick={() => navigate("/coming-soon")}
            >
              <span className="material-symbols-outlined text-lg">
                person_add
              </span>
              Invite Member
            </button>
          </div>
        </div>

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
              {members.filter((m) => m.role === "Admin").length}
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
              {members.filter((m) => m.role === "Member").length}
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
              {members.filter((m) => m.role === "Viewer").length}
            </p>
            <p className="text-slate-500 text-xs font-medium">
              Read-only access
            </p>
          </div>
        </div>

        {/* Members DataGrid */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
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
      </div>
    </div>
  );
}
