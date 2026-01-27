import { useState, useEffect } from 'react'
import { tasksAPI, usersAPI, projectsAPI } from '../services/dashboard'

interface User {
  id: string
  full_name: string
  email: string
}

interface Project {
  id: string
  name: string
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskCreated: () => void
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [projectId, setProjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (isOpen) {
      // Fetch users and projects when modal opens
      fetchUsersAndProjects()
    }
  }, [isOpen])

  const fetchUsersAndProjects = async () => {
    try {
      const [usersResponse, projectsResponse] = await Promise.all([
        usersAPI.getUsers(),
        projectsAPI.getProjects()
      ])
      
      if (usersResponse.success) {
        setUsers(usersResponse.data)
      }
      
      if (projectsResponse.success && projectsResponse.data.length > 0) {
        setProjects(projectsResponse.data)
        setProjectId(projectsResponse.data[0].id) // Set first project as default
      }
    } catch (error) {
      console.error('Failed to fetch users and projects:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !projectId) return

    setLoading(true)
    try {
      await tasksAPI.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId,
        assignee_id: assigneeId || undefined,
        due_date: dueDate || undefined,
        priority,
      })
      
      // Reset form
      setTitle('')
      setDescription('')
      setAssigneeId('')
      setDueDate('')
      setPriority('Medium')
      
      onTaskCreated()
      onClose()
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[640px] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex flex-col">
            <h2 className="text-gray-900 text-xl font-bold leading-tight">Create New Task</h2>
            <p className="text-gray-600 text-xs font-normal">Add details to organize and assign work to your team.</p>
          </div>
          <button 
            className="text-slate-400 hover:text-slate-600 transition-colors"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body (Form) */}
        <div className="px-6 py-4 overflow-y-auto max-h-[80vh]">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Task Name */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 text-sm font-semibold">Task Name</label>
              <input 
                className="w-full rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 h-12 px-4 placeholder:text-slate-400" 
                placeholder="e.g. Design system update" 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Assignee & Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assignee */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 text-sm font-semibold">Assignee</label>
                <div className="relative">
                  <select 
                    className="w-full rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 h-12 pl-10 pr-4 appearance-none"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    <option value="">Select a team member</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.full_name}</option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-lg text-slate-500">person</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-2">
                <label className="text-gray-900 text-sm font-semibold">Due Date</label>
                <div className="relative">
                  <input 
                    className="w-full rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 h-12 pl-10 px-4" 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 text-sm font-semibold">Priority</label>
              <div className="flex gap-2">
                <button 
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                    priority === 'Low' 
                      ? 'border-2 border-blue-600/40 bg-blue-600/5 text-blue-600 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  type="button"
                  onClick={() => setPriority('Low')}
                >
                  <span className="size-2 rounded-full bg-emerald-500"></span>
                  Low
                </button>
                <button 
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                    priority === 'Medium' 
                      ? 'border-2 border-blue-600/40 bg-blue-600/5 text-blue-600 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  type="button"
                  onClick={() => setPriority('Medium')}
                >
                  <span className="size-2 rounded-full bg-amber-500"></span>
                  Medium
                </button>
                <button 
                  className={`flex-1 py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm font-medium ${
                    priority === 'High' 
                      ? 'border-2 border-blue-600/40 bg-blue-600/5 text-blue-600 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  type="button"
                  onClick={() => setPriority('High')}
                >
                  <span className="size-2 rounded-full bg-rose-500"></span>
                  High
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-900 text-sm font-semibold">Description</label>
                <div className="flex gap-1">
                  <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors" type="button">
                    <span className="material-symbols-outlined text-lg">format_bold</span>
                  </button>
                  <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors" type="button">
                    <span className="material-symbols-outlined text-lg">format_italic</span>
                  </button>
                  <button className="p-1 text-slate-400 hover:text-blue-600 transition-colors" type="button">
                    <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                  </button>
                </div>
              </div>
              <textarea 
                className="w-full rounded-lg text-gray-900 border-gray-300 bg-white focus:ring-blue-600 focus:border-blue-600 min-h-[120px] p-4 text-sm placeholder:text-slate-400" 
                placeholder="Describe the work to be done..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Attachments Placeholder */}
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:border-blue-600/50 hover:text-blue-600 transition-all cursor-pointer">
              <span className="material-symbols-outlined">attach_file</span>
              <span className="text-sm font-medium">Drop files to attach or click to browse</span>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-3">
          <button 
            className="px-5 py-2.5 rounded-lg text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors" 
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50" 
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}