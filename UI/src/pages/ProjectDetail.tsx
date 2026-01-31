import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { Project } from '../types/project';
import { Task } from '../types/task';
import CreateTaskModal from '../components/CreateTaskModal';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showDependencies, setShowDependencies] = useState(true);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showMembersTooltip, setShowMembersTooltip] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  useEffect(() => {
    console.log('Project ID from URL:', id);
    if (id) {
      fetchProjectData();
    } else {
      console.error('No project ID provided in URL');
      setLoading(false);
    }
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      console.log('Fetching project data for ID:', id);
      
      // Fetch project first
      try {
        const projectResponse = await projectService.getProject(id!);
        console.log('Project response:', projectResponse);
        
        if (projectResponse.success && projectResponse.data) {
          setProject(projectResponse.data);
        } else {
          console.error('Project not found or access denied');
          return;
        }
      } catch (projectError) {
        console.error('Error fetching project:', projectError);
        return;
      }
      
      // Fetch tasks separately
      try {
        const tasksResponse = await taskService.getTasks({ projectId: id });
        console.log('Tasks response:', tasksResponse);
        
        if (tasksResponse.success && tasksResponse.data) {
          setTasks(tasksResponse.data);
        }
      } catch (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        setTasks([]);
      }

      // Fetch files separately
      try {
        const filesResponse = await projectService.getProjectFiles(id!);
        console.log('Files response:', filesResponse);
        
        if (filesResponse.success && filesResponse.data) {
          setFiles(filesResponse.data);
        }
      } catch (filesError) {
        console.error('Error fetching files:', filesError);
        setFiles([]);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!project) return;
    try {
      await projectService.updateProject(project.id, { status: newStatus as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' });
      setProject({ ...project, status: newStatus as 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' });
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !project) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/projects/${project.id}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setFiles([result.data, ...files]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Do': return 'text-slate-500';
      case 'In Progress': return 'text-blue-600';
      case 'Done': return 'text-emerald-500';
      default: return 'text-slate-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  const getFilteredTasks = () => {
    if (currentWeekOffset === 0) return tasks;
    
    const currentDate = new Date();
    
    if (viewMode === 'day') {
      const targetDate = new Date();
      targetDate.setDate(currentDate.getDate() + currentWeekOffset);
      
      return tasks.filter(task => {
        if (!task.dueDate && !task.startDate) return false;
        const taskDate = new Date(task.dueDate || task.startDate || task.createdAt);
        return taskDate.toDateString() === targetDate.toDateString();
      });
    } else if (viewMode === 'week') {
      const targetWeekStart = new Date();
      targetWeekStart.setDate(currentDate.getDate() + (currentWeekOffset * 7));
      const targetWeekEnd = new Date(targetWeekStart);
      targetWeekEnd.setDate(targetWeekStart.getDate() + 6);
      
      return tasks.filter(task => {
        if (!task.dueDate && !task.startDate) return false;
        const taskDate = new Date(task.dueDate || task.startDate || task.createdAt);
        return taskDate >= targetWeekStart && taskDate <= targetWeekEnd;
      });
    } else if (viewMode === 'month') {
      const targetDate = new Date();
      targetDate.setMonth(currentDate.getMonth() + currentWeekOffset);
      
      return tasks.filter(task => {
        if (!task.dueDate && !task.startDate) return false;
        const taskDate = new Date(task.dueDate || task.startDate || task.createdAt);
        return taskDate.getMonth() === targetDate.getMonth() && taskDate.getFullYear() === targetDate.getFullYear();
      });
    }
    
    return tasks;
  };

  const filteredTasks = getFilteredTasks();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error</span>
        <h2 className="text-xl font-bold text-slate-600 mb-2">Project Not Found</h2>
        <p className="text-slate-500 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <button 
          onClick={() => navigate('/projects')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const todoTasks = getTasksByStatus('To Do');
  const inProgressTasks = getTasksByStatus('In Progress');
  const doneTasks = getTasksByStatus('Done');

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 pt-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="relative size-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    className="text-slate-100" 
                    cx="32" 
                    cy="32" 
                    fill="transparent" 
                    r="28" 
                    stroke="currentColor" 
                    strokeWidth="6"
                  />
                  <circle 
                    className="text-blue-600" 
                    cx="32" 
                    cy="32" 
                    fill="transparent" 
                    r="28" 
                    stroke="currentColor" 
                    strokeDasharray="175.9" 
                    strokeDashoffset={175.9 - (175.9 * (project.progress || 0)) / 100}
                    strokeWidth="6"
                  />
                </svg>
                <span className="absolute text-sm font-black">{project.progress || 0}%</span>
              </div>
              <div>
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <a className="hover:text-blue-600 text-xs font-medium" href="/projects">Projects</a>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span className="text-xs font-medium">{project.name}</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  {project.name}
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-wide border-none cursor-pointer hover:bg-emerald-200 transition-colors"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 relative">
                    <div 
                      className="flex -space-x-2 cursor-pointer"
                      onClick={() => setShowMembersTooltip(!showMembersTooltip)}
                    >
                      {project.members?.slice(0, 4).map((member, index) => (
                        <div
                          key={member.id}
                          className="size-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold hover:z-10 transition-all"
                        >
                          {(member.user?.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {(project.members?.length || 0) > 4 && (
                        <div className="size-8 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                          +{(project.members?.length || 0) - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-slate-500 font-medium">
                      {project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}
                    </span>
                    
                    {/* Members Tooltip */}
                    {showMembersTooltip && (
                      <div className="absolute top-10 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-50 min-w-64">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Team Members</div>
                        <div className="space-y-2">
                          {project.members?.map((member) => (
                            <div key={member.id} className="flex items-center gap-3">
                              <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                {(member.user?.full_name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-700">{member.user?.full_name || 'Unknown'}</div>
                                <div className="text-xs text-slate-500">{member.role}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg bg-white transition-all">
                <span className="material-symbols-outlined">share</span>
              </button>
              <button className="p-2.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg bg-white transition-all">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
              <button 
                onClick={() => setShowCreateTaskModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>New Task</span>
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-8 border-b border-transparent">
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`px-1 py-4 border-b-2 text-sm font-bold flex items-center gap-2 ${
                activeTab === 'tasks' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-xl">format_list_bulleted</span>
              Tasks
            </button>
            <button 
              onClick={() => setActiveTab('roadmap')}
              className={`px-1 py-4 border-b-2 text-sm font-bold flex items-center gap-2 ${
                activeTab === 'roadmap' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-xl">map</span>
              Roadmap
            </button>
            <button 
              onClick={() => setActiveTab('files')}
              className={`px-1 py-4 border-b-2 text-sm font-bold flex items-center gap-2 ${
                activeTab === 'files' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-xl">folder</span>
              Files
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-8 py-8 max-w-7xl mx-auto w-full">
        {activeTab === 'tasks' && (
          <>
            {/* Task Filters */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                  <input 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-blue-600/20 focus:border-blue-600 transition-all" 
                    placeholder="Filter tasks..." 
                    type="text"
                  />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                  <span className="material-symbols-outlined text-lg">tune</span>
                  Filters
                </button>
              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* To Do Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">To Do</h3>
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                      {todoTasks.length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {todoTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group cursor-pointer"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(task.priority)} bg-slate-100`}>
                          {task.priority}
                        </span>
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 transition-colors">drag_indicator</span>
                      </div>
                      <h4 className="text-sm font-bold mb-4 line-clamp-2">{task.title}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <span className="material-symbols-outlined text-sm">calendar_today</span>
                              <span className="text-[10px] font-medium">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In Progress Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600">In Progress</h3>
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                      {inProgressTasks.length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {inProgressTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group cursor-pointer border-l-4 border-l-blue-600"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPriorityColor(task.priority)} bg-slate-100`}>
                          {task.priority}
                        </span>
                        <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-500 transition-colors">drag_indicator</span>
                      </div>
                      <h4 className="text-sm font-bold mb-4 line-clamp-2">{task.title}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <span className="material-symbols-outlined text-sm">calendar_today</span>
                              <span className="text-[10px] font-medium">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Done Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500">Done</h3>
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                      {doneTasks.length}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {doneTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-white/60 border border-slate-200 rounded-xl p-4 shadow-sm group opacity-75 cursor-pointer"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase">
                          Completed
                        </span>
                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                      </div>
                      <h4 className="text-sm font-bold mb-4 line-clamp-2 line-through text-slate-500">{task.title}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-slate-400">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            <span className="text-[10px] font-medium">Completed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'roadmap' && (
          <div className="flex-1 overflow-auto bg-slate-50 flex flex-col">
            {/* Roadmap Controls */}
            <div className="px-8 py-4 bg-white border-b border-slate-200 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-6">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${
                      viewMode === 'day' ? 'bg-white rounded shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Day
                  </button>
                  <button 
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${
                      viewMode === 'week' ? 'bg-white rounded shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Week
                  </button>
                  <button 
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 text-xs font-medium transition-all ${
                      viewMode === 'month' ? 'bg-white rounded shadow-sm font-bold' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Month
                  </button>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input 
                    className="sr-only peer" 
                    type="checkbox" 
                    checked={showDependencies}
                    onChange={(e) => setShowDependencies(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-semibold text-slate-600 group-hover:text-slate-900">Task Dependencies</span>
                </label>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    {(() => {
                      if (viewMode === 'day') {
                        if (currentWeekOffset === 0) return 'Current Day';
                        const date = new Date();
                        date.setDate(date.getDate() + currentWeekOffset);
                        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
                      } else if (viewMode === 'week') {
                        if (currentWeekOffset === 0) return 'Current Week';
                        const date = new Date();
                        date.setDate(date.getDate() + (currentWeekOffset * 7));
                        return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                      } else {
                        if (currentWeekOffset === 0) return 'Current Month';
                        const date = new Date();
                        date.setMonth(date.getMonth() + currentWeekOffset);
                        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      }
                    })()
                  }</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}
                      className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button 
                      onClick={() => setCurrentWeekOffset(0)}
                      className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">today</span>
                    </button>
                    <button 
                      onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                      className="p-1 hover:bg-slate-100 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Live Data <span className="text-[10px] opacity-70 italic ml-1">(synced)</span></span>
              </div>
            </div>

            {/* Gantt Chart */}
            <div className="min-w-max flex-1 flex">
              {/* Task Names Column */}
              <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 sticky left-0 z-20">
                <div className="h-10 border-b border-slate-200 flex items-center px-4 bg-slate-50/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Task Details & Timeline</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {filteredTasks.map((task, index) => (
                    <div key={task.id} className="h-12 flex items-center px-4 group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
                      <div className="flex items-center gap-3 w-full">
                        <span className="material-symbols-outlined text-slate-300 text-lg group-hover:text-blue-600 cursor-grab">drag_indicator</span>
                        <span className="text-sm font-semibold truncate text-slate-700">{task.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timeline Grid */}
              <div className="flex-1 gantt-grid relative min-h-[600px]">
                {/* Timeline Header */}
                <div className="h-10 border-b border-slate-200 flex sticky top-0 bg-white/95 backdrop-blur-md z-10">
                  {(() => {
                    if (viewMode === 'day') {
                      return Array.from({length: 24}, (_, i) => {
                        const hour = i;
                        const isCurrentHour = new Date().getHours() === hour;
                        return (
                          <div key={i} className={`w-20 border-r border-slate-200 flex flex-col items-center justify-center ${
                            isCurrentHour ? 'bg-blue-600/5' : ''
                          }`}>
                            <span className={`text-[9px] uppercase font-bold ${
                              isCurrentHour ? 'text-blue-600' : 'text-slate-400'
                            }`}>{hour === 0 ? '12 AM' : hour <= 12 ? `${hour} AM` : `${hour - 12} PM`}</span>
                          </div>
                        );
                      });
                    } else if (viewMode === 'week') {
                      return Array.from({length: 7}, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i + (currentWeekOffset * 7));
                        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        const isToday = currentWeekOffset === 0 && i === new Date().getDay();
                        return (
                          <div key={i} className={`w-40 border-r border-slate-200 flex flex-col items-center justify-center ${
                            isToday ? 'bg-blue-600/5' : i === 0 || i === 6 ? 'bg-slate-50/50' : ''
                          }`}>
                            <span className={`text-[9px] uppercase font-bold ${
                              isToday ? 'text-blue-600' : 'text-slate-400'
                            }`}>{dayNames[date.getDay()]}</span>
                            <span className={`text-[11px] font-bold ${
                              isToday ? 'text-blue-600' : 'text-slate-600'
                            }`}>{date.getDate()}</span>
                          </div>
                        );
                      });
                    } else {
                      return Array.from({length: 4}, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() + i + currentWeekOffset);
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const isCurrentMonth = currentWeekOffset === 0 && i === 0;
                        return (
                          <div key={i} className={`w-60 border-r border-slate-200 flex flex-col items-center justify-center ${
                            isCurrentMonth ? 'bg-blue-600/5' : ''
                          }`}>
                            <span className={`text-[9px] uppercase font-bold ${
                              isCurrentMonth ? 'text-blue-600' : 'text-slate-400'
                            }`}>{monthNames[date.getMonth()]}</span>
                            <span className={`text-[11px] font-bold ${
                              isCurrentMonth ? 'text-blue-600' : 'text-slate-600'
                            }`}>{date.getFullYear()}</span>
                          </div>
                        );
                      });
                    }
                  })()}
                </div>

                {/* Current Time Indicator */}
                {currentWeekOffset === 0 && (
                  <div className={`absolute top-0 bottom-0 w-px bg-blue-600 z-10 ${
                    viewMode === 'day' ? 'left-' + (new Date().getHours() * 20 + 320) :
                    viewMode === 'week' ? 'left-' + (new Date().getDay() * 160 + 320) :
                    'left-320'
                  }`}>
                    <div className="size-2 rounded-full bg-blue-600 -ml-[4px] mt-10 shadow-sm shadow-blue-600/50"></div>
                    <div className="h-full w-px bg-gradient-to-b from-blue-600 via-blue-600/20 to-transparent"></div>
                  </div>
                )}

                {/* Task Bars */}
                <div className="divide-y divide-slate-100">
                  {filteredTasks.map((task, index) => {
                    const getStatusColor = () => {
                      switch (task.status) {
                        case 'Done': return 'bg-emerald-500 border-emerald-400/20 shadow-emerald-500/10';
                        case 'In Progress': return 'bg-purple-500 border-purple-400/20 shadow-purple-500/10';
                        default: return 'bg-slate-400 border-slate-300/20 shadow-slate-500/10';
                      }
                    };

                    const getStatusText = () => {
                      switch (task.status) {
                        case 'Done': return 'Done • 100%';
                        case 'In Progress': return 'In Progress • 60%';
                        default: return 'Planned';
                      }
                    };

                    const getBarWidth = () => {
                      if (viewMode === 'day') return task.status === 'Done' ? 80 : task.status === 'In Progress' ? 120 : 100;
                      if (viewMode === 'week') return task.status === 'Done' ? 192 : task.status === 'In Progress' ? 288 : 224;
                      return task.status === 'Done' ? 240 : task.status === 'In Progress' ? 360 : 300;
                    };
                    const barWidth = getBarWidth();
                    const leftPosition = 10 + (index * 20);

                    return (
                      <div key={task.id} className="h-12 flex items-center px-4 relative">
                        <div 
                          className={`absolute h-7 rounded-full flex items-center px-3 shadow-lg group cursor-pointer hover:scale-[1.02] transition-transform ${
                            getStatusColor()
                          }`}
                          style={{
                            left: `${leftPosition}px`,
                            width: `${barWidth}px`
                          }}
                        >
                          {task.status === 'In Progress' && (
                            <div className="absolute inset-0 bg-white/20 w-[60%] rounded-l-full"></div>
                          )}
                          <span className="text-[10px] font-black text-white uppercase tracking-wider relative z-10">
                            {getStatusText()}
                          </span>
                          {task.status === 'In Progress' && (
                            <span className="material-symbols-outlined text-white text-sm ml-auto relative z-10">pending</span>
                          )}
                          {task.status === 'Done' && (
                            <span className="material-symbols-outlined text-white text-[12px] ml-auto opacity-0 group-hover:opacity-100">open_in_full</span>
                          )}
                          {showDependencies && index > 0 && (
                            <div className="absolute -left-4 top-1/2 w-4 h-px bg-slate-300">
                              <div className="absolute -left-1 -top-1 size-2 rounded-full bg-slate-300"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend Footer */}
            <footer className="flex-shrink-0 bg-white border-t border-slate-200 px-8 py-3 flex items-center justify-between sticky bottom-0 z-30">
              <div className="flex items-center gap-6">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Legend</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-slate-400"></div>
                    <span className="text-xs font-semibold text-slate-600">Planned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-purple-500"></div>
                    <span className="text-xs font-semibold text-slate-600">In Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-semibold text-slate-600">Done</span>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm" placeholder="Search files, folders..." type="text"/>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                  <span className="material-symbols-outlined text-lg">create_new_folder</span>
                  New Folder
                </button>
                <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm cursor-pointer">
                  <span className="material-symbols-outlined text-lg">upload</span>
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            </div>
            
            {files.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">folder</span>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Files Yet</h3>
                <p className="text-slate-500 mb-4">Upload files to share with your team members.</p>
                <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Upload First File
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">File Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded By</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {files.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-blue-500">description</span>
                            <span className="text-sm font-semibold">{file.original_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">{(file.file_size / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(file.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {file.uploader?.full_name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-sm font-medium">{file.uploader?.full_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Preview">
                              <span className="material-symbols-outlined text-xl">visibility</span>
                            </button>
                            <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Download">
                              <span className="material-symbols-outlined text-xl">download</span>
                            </a>
                            <button className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      <CreateTaskModal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onTaskCreated={fetchProjectData}
      />
    </div>
  );
};

export default ProjectDetail;