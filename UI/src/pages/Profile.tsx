import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { projectService } from '../services/projectService';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    projectsLead: 0,
    teamContributions: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      const tasksResponse = await taskService.getTasks({ 
        assigneeId: user.id,
        status: 'Done'
      });
      
      const projectsResponse = await projectService.getProjects({
        ownerId: user.id
      });
      
      const allTasksResponse = await taskService.getTasks({
        assigneeId: user.id
      });
      
      setStats({
        tasksCompleted: tasksResponse.success ? tasksResponse.data.length : 0,
        projectsLead: projectsResponse.success ? projectsResponse.data.length : 0,
        teamContributions: allTasksResponse.success ? allTasksResponse.data.length : 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = () => {
    setNewName(user?.full_name || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim() || !user?.id) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ full_name: newName.trim() })
      });
      
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating name:', error);
    } finally {
      setUpdating(false);
      setEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNewName('');
  };

  return (
    <div className="max-w-[1440px] mx-auto flex gap-8 px-6 py-8 lg:px-10">
      <main className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-900">User Summary</h1>
            <p className="text-slate-500 text-sm mt-1">Review your personal details and account status.</p>
          </div>
          <div className="p-8 space-y-10">
            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider">Profile Photo</h3>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="size-24 rounded-full border-4 border-slate-100 bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{user?.full_name || 'Unknown User'}</p>
                  <p className="text-sm text-slate-500">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-slate-900 mb-6 uppercase tracking-wider">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Full Name</span>
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="text-base font-medium text-slate-900 border border-slate-300 rounded px-2 py-1 flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={updating || !newName.trim()}
                        className="text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">check</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined text-lg">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-base font-medium text-slate-900">{user?.full_name || 'Not provided'}</span>
                      <button
                        onClick={handleEditName}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Email Address</span>
                  <span className="text-base font-medium text-slate-900">{user?.email || 'Not provided'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Role</span>
                  <span className="text-base font-medium text-slate-900 capitalize">{user?.role || 'Member'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-tight">Status</span>
                  <span className="text-base font-medium text-emerald-600">Active</span>
                </div>
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span>This profile is verified and managed by the organization.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside className="w-full lg:w-80 shrink-0 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Stats</h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined">task_alt</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Tasks Completed</p>
                <p className="text-xl font-bold text-slate-900">{loading ? '...' : stats.tasksCompleted}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <span className="material-symbols-outlined">star</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Projects Lead</p>
                <p className="text-xl font-bold text-slate-900">{loading ? '...' : stats.projectsLead}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Team Contributions</p>
                <p className="text-xl font-bold text-slate-900">{loading ? '...' : stats.teamContributions}</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">Profile Completion</span>
              <span className="text-sm font-bold text-blue-600">100%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <h4 className="font-bold mb-2">Enterprise Plan</h4>
          <p className="text-blue-100 text-sm mb-4">You have full access to advanced reporting and unlimited team members.</p>
          <button className="w-full bg-white text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition-colors">
            View Details
          </button>
        </div>
      </aside>
    </div>
  );
};

export default Profile;