import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Video,
  Users,
  LogOut,
  Plus,
  Clock,
  BookOpen,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudentDashboard from '@/components/dashboard/StudentDashboard';
import TeacherDashboard from '@/components/dashboard/TeacherDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';



const Dashboard = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const roleLabels = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Administrator'
  };

  const menuItems = user.role === 'admin'
    ? [
      { id: 'overview', label: 'Overview', icon: BarChart3 },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'classes', label: 'Classes', icon: BookOpen },
      { id: 'calendar', label: 'Calendar', icon: Calendar },
      { id: 'videos', label: 'Videos', icon: Video },
      { id: 'billing', label: 'Billing', icon: Plus },
    ]
    : user.role === 'teacher'
      ? [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'classes', label: 'My Classes', icon: BookOpen },
        { id: 'homework', label: 'Homework', icon: BookOpen },
        { id: 'attendance', label: 'Attendance', icon: Clock },
        { id: 'notes', label: 'Lesson Notes', icon: Plus },
        { id: 'progress', label: 'Progress', icon: BarChart3 },
        { id: 'videos', label: 'Video Library', icon: Video },
      ]
      : [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'classes', label: 'My Classes', icon: BookOpen },
        { id: 'homework', label: 'Homework', icon: BookOpen },
        { id: 'progress', label: 'Progress', icon: BarChart3 },
        { id: 'announcements', label: 'Announcements', icon: Users },
        { id: 'billing', label: 'Billing', icon: Plus },
        { id: 'videos', label: 'Videos', icon: Video },
      ];

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <nav className="border-b border-stone-200 bg-white sticky top-0 z-50">
        <div className="px-4 md:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="StarZEdu Classes" className="h-11 w-auto" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={user.picture || 'https://via.placeholder.com/40'}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-orange-100"
                />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{user.name}</p>
                  <p className="text-xs text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>{roleLabels[user.role]}</p>
                </div>
              </div>
              <Button
                onClick={logout}
                data-testid="logout-btn"
                variant="ghost"
                className="text-slate-600 hover:text-slate-900 hover:bg-stone-100 px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-stone-200 p-6 hidden md:block">
          <nav className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  data-testid={`nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-slate-900'
                    }`}
                  style={{ fontFamily: 'Manrope, sans-serif' }}
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {user.role === 'student' && <StudentDashboard activeTab={activeTab} user={user} />}
            {user.role === 'teacher' && <TeacherDashboard activeTab={activeTab} user={user} />}
            {user.role === 'admin' && <AdminDashboard activeTab={activeTab} user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;