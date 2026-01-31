import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ActivityItem {
  id: string;
  type: 'comment' | 'status_change' | 'assignment' | 'priority_change';
  user: {
    name: string;
    avatar: string;
  };
  action: string;
  target?: string;
  targetUrl?: string;
  comment?: string;
  timestamp: string;
  badge: {
    type: 'success' | 'info' | 'warning' | 'assignment';
    icon: string;
  };
}

const ActivityLog: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filters, setFilters] = useState({
    comments: true,
    statusChanges: true,
    assignments: false,
    attachments: false,
    teamMember: 'all',
    dateRange: 'last7days'
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = () => {
    // Mock activity data
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'status_change',
        user: {
          name: 'Sarah Chen',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
        },
        action: 'moved',
        target: 'Initial UI Prototype',
        targetUrl: '#',
        timestamp: '10:45 AM',
        badge: {
          type: 'success',
          icon: 'done_all'
        }
      },
      {
        id: '2',
        type: 'comment',
        user: {
          name: 'James Wilson',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        },
        action: 'commented on',
        target: 'Database Migration Plan',
        targetUrl: '#',
        comment: "I've double-checked the schema and it looks ready for the staging environment.",
        timestamp: '9:20 AM',
        badge: {
          type: 'info',
          icon: 'chat'
        }
      },
      {
        id: '3',
        type: 'priority_change',
        user: {
          name: 'System',
          avatar: 'https://images.unsplash.com/photo-1518085901417-527c0ad04675?w=150'
        },
        action: 'changed priority of',
        target: 'API Security Audit',
        targetUrl: '#',
        timestamp: '4:15 PM',
        badge: {
          type: 'warning',
          icon: 'priority_high'
        }
      },
      {
        id: '4',
        type: 'assignment',
        user: {
          name: 'Emily Blunt',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
        },
        action: 'assigned Marcus Wright to',
        target: 'Q4 Budget Review',
        targetUrl: '#',
        timestamp: '11:30 AM',
        badge: {
          type: 'assignment',
          icon: 'person_add'
        }
      }
    ];
    setActivities(mockActivities);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'info': return 'bg-blue-600';
      case 'warning': return 'bg-orange-500';
      case 'assignment': return 'bg-slate-400';
      default: return 'bg-slate-400';
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    return {
      today: activities.slice(0, 2),
      yesterday: activities.slice(2)
    };
  };

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Activity Feed */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2">Activity Log</h2>
            <p className="text-slate-500">Real-time stream of updates from your team members.</p>
          </div>

          {/* Today Section */}
          <div className="mb-10">
            <h3 className="sticky top-0 bg-white py-2 text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-6">
              Today
            </h3>
            <div className="space-y-6">
              {groupedActivities.today.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex-shrink-0 relative">
                    <div 
                      className="size-10 rounded-full bg-cover bg-center ring-2 ring-white"
                      style={{ backgroundImage: `url(${activity.user.avatar})` }}
                    />
                    <div className={`absolute -bottom-1 -right-1 size-5 ${getBadgeColor(activity.badge.type)} rounded-full border-2 border-white flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-[12px] text-white">
                        {activity.badge.icon}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold">{activity.user.name}</span> {activity.action}{' '}
                      {activity.target && (
                        <a className="text-blue-600 font-medium hover:underline" href={activity.targetUrl}>
                          {activity.target}
                        </a>
                      )}
                      {activity.type === 'status_change' && (
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[11px] font-bold uppercase ml-1">
                          Done
                        </span>
                      )}
                      {activity.type === 'priority_change' && (
                        <span className="font-bold text-orange-600 ml-1">High</span>
                      )}
                    </p>
                    {activity.comment && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg border-l-4 border-blue-600/40 italic text-sm text-slate-600">
                        "{activity.comment}"
                      </div>
                    )}
                    <span className="text-xs text-slate-400 mt-1 block">{activity.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Yesterday Section */}
          <div className="mb-10">
            <h3 className="sticky top-0 bg-white py-2 text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-6">
              Yesterday
            </h3>
            <div className="space-y-6">
              {groupedActivities.yesterday.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="flex-shrink-0 relative">
                    <div 
                      className="size-10 rounded-full bg-cover bg-center ring-2 ring-white"
                      style={{ backgroundImage: `url(${activity.user.avatar})` }}
                    />
                    <div className={`absolute -bottom-1 -right-1 size-5 ${getBadgeColor(activity.badge.type)} rounded-full border-2 border-white flex items-center justify-center`}>
                      <span className="material-symbols-outlined text-[12px] text-white">
                        {activity.badge.icon}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold">{activity.user.name}</span> {activity.action}{' '}
                      {activity.target && (
                        <a className="text-blue-600 font-medium hover:underline" href={activity.targetUrl}>
                          {activity.target}
                        </a>
                      )}
                      {activity.type === 'priority_change' && (
                        <span className="font-bold text-orange-600 ml-1">High</span>
                      )}
                    </p>
                    <span className="text-xs text-slate-400 mt-1 block">{activity.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Sidebar */}
      <aside className="w-72 border-l border-slate-200 bg-slate-50 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500">Filters</h4>
          <button 
            onClick={() => setFilters({
              comments: false,
              statusChanges: false,
              assignments: false,
              attachments: false,
              teamMember: 'all',
              dateRange: 'last7days'
            })}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Clear all
          </button>
        </div>

        {/* Action Type Filter */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 mb-4 uppercase">Action Type</p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filters.comments}
                onChange={(e) => handleFilterChange('comments', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                Comments
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filters.statusChanges}
                onChange={(e) => handleFilterChange('statusChanges', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                Status Changes
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filters.assignments}
                onChange={(e) => handleFilterChange('assignments', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                Assignments
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={filters.attachments}
                onChange={(e) => handleFilterChange('attachments', e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-600 h-4 w-4"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                Attachments
              </span>
            </label>
          </div>
        </div>

        {/* Team Member Filter */}
        <div className="mb-8">
          <p className="text-xs font-bold text-slate-400 mb-4 uppercase">Team Member</p>
          <div className="space-y-3">
            {[
              { name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' },
              { name: 'James Wilson', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' }
            ].map((member) => (
              <label key={member.name} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div 
                    className="size-6 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${member.avatar})` }}
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900">
                    {member.name}
                  </span>
                </div>
                <input 
                  type="radio" 
                  name="team" 
                  value={member.name}
                  checked={filters.teamMember === member.name}
                  onChange={(e) => handleFilterChange('teamMember', e.target.value)}
                  className="border-slate-300 text-blue-600 focus:ring-blue-600 h-3 w-3"
                />
              </label>
            ))}
            <label className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold">+2</span>
                </div>
                <span className="text-sm text-slate-600">Others</span>
              </div>
              <input 
                type="radio" 
                name="team" 
                value="others"
                checked={filters.teamMember === 'others'}
                onChange={(e) => handleFilterChange('teamMember', e.target.value)}
                className="border-slate-300 text-blue-600 focus:ring-blue-600 h-3 w-3"
              />
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <p className="text-xs font-bold text-slate-400 mb-4 uppercase">Date Period</p>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
              calendar_today
            </span>
            <select 
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="last7days">Last 7 days</option>
              <option value="last30days">Last 30 days</option>
              <option value="thismonth">This month</option>
              <option value="custom">Custom range...</option>
            </select>
          </div>
        </div>

        <div className="mt-auto">
          <button className="w-full py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
            Apply Changes
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ActivityLog;