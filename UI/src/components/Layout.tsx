import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'

export default function Layout() {
  const { user } = useAuth()

  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <header className="flex items-center justify-between bg-white border-b border-slate-200 px-8 py-3">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  search
                </span>
                <input
                  className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-600/20"
                  placeholder="Search tasks, members..."
                  type="text"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
              <div className="h-8 w-px bg-slate-200 mx-2"></div>
              <div className="bg-blue-600/20 text-blue-600 rounded-full size-9 flex items-center justify-center text-xs font-bold">
                {user?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}