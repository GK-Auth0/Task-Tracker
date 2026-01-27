import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ComingSoon() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="bg-gray-50 text-gray-900 antialiased min-h-screen">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between p-6">
          <div className="flex flex-col gap-8">
            {/* Logo/Brand */}
            <div className="flex gap-3 items-center">
              <div className="bg-blue-600 rounded-lg size-10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-gray-900 text-base font-bold leading-tight">TaskTracker</h1>
                <p className="text-gray-600 text-xs font-normal">Pro Team Edition</p>
              </div>
            </div>
            
            {/* Nav Links */}
            <nav className="flex flex-col gap-1">
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="/dashboard">
                <span className="material-symbols-outlined">folder</span>
                <p className="text-sm font-medium">Projects</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="/dashboard">
                <span className="material-symbols-outlined">check_box</span>
                <p className="text-sm font-medium">Tasks</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="#">
                <span className="material-symbols-outlined">group</span>
                <p className="text-sm font-medium">Team</p>
              </a>
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors" href="#">
                <span className="material-symbols-outlined">settings</span>
                <p className="text-sm font-medium">Settings</p>
              </a>
            </nav>
          </div>
          
          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-blue-600/20 text-blue-600 rounded-full size-8 flex items-center justify-center text-xs font-bold">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.role || 'Member'}</p>
              </div>
              <button onClick={logout} className="ml-auto p-1 text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <header className="flex items-center justify-between bg-white border-b border-slate-200 px-8 py-3">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
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
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </div>
            </div>
          </header>

          {/* Coming Soon Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-[800px] w-full bg-white shadow-xl rounded-xl overflow-hidden border border-slate-100">
              {/* Hero Illustration */}
              <div className="w-full h-48 bg-blue-600/5 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{backgroundImage: 'radial-gradient(#1387ec 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                <div className="z-10 bg-white p-6 rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-blue-600 text-6xl">construction</span>
                </div>
              </div>

              {/* Content Container */}
              <div className="px-8 pt-10 pb-12 flex flex-col items-center text-center">
                {/* Headline */}
                <h1 className="text-slate-900 text-3xl font-bold tracking-tight mb-4">We're working on this!</h1>
                
                {/* Description */}
                <p className="text-slate-500 text-base max-w-[540px] leading-relaxed mb-8">
                  Our team is currently building this feature to help you manage tasks even more efficiently. 
                  It's part of our new project management suite designed for high-performance teams.
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-[480px] mb-10 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Development Progress</span>
                    <span className="text-sm font-semibold text-slate-900">85%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full mb-3">
                    <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{width: '85%'}}></div>
                  </div>
                  <p className="text-xs text-slate-500 italic">Finalizing UI polish and integration testing</p>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-12">
                  <button 
                    className="flex items-center justify-center gap-2 min-w-[200px] h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md shadow-blue-600/20"
                    onClick={() => navigate('/dashboard')}
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    <span>Go Back to Dashboard</span>
                  </button>
                </div>

                {/* Secondary Notify Section */}
                <div className="w-full border-t border-slate-100 pt-8">
                  <h3 className="text-slate-900 text-lg font-bold mb-2">Want to be the first to know?</h3>
                  <p className="text-sm text-slate-500 mb-6">Get notified when we launch this feature.</p>
                  <div className="flex justify-center">
                    <label className="flex flex-col w-full max-w-[440px] h-12">
                      <div className="flex w-full flex-1 items-stretch rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <input 
                          className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 px-4 text-sm text-slate-900 placeholder:text-slate-500" 
                          placeholder="Enter your email address" 
                        />
                        <div className="flex items-center justify-center pr-1">
                          <button className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 h-10 rounded-md text-sm font-bold transition-all">
                            Notify me
                          </button>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}