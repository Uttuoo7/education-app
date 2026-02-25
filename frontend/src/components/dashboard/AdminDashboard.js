import { useState, useEffect } from 'react';
import { Users, Calendar, Video, BookOpen, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

import API_BASE from '@/config';

const AdminDashboard = ({ activeTab, user }) => {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meetLinkInputs, setMeetLinkInputs] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, classesRes, videosRes] = await Promise.all([
        fetch(`${API_BASE}/users`, { credentials: 'include' }),
        fetch(`${API_BASE}/classes`, { credentials: 'include' }),
        fetch(`${API_BASE}/videos`, { credentials: 'include' })
      ]);

      if (usersRes.ok && classesRes.ok && videosRes.ok) {
        setUsers(await usersRes.json());
        setClasses(await classesRes.json());
        setVideos(await videosRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        toast.success('User role updated');
        fetchData();
      } else {
        toast.error('Failed to update role');
      }
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleMeetLinkUpdate = async (userId, meetLink) => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ meet_link: meetLink })
      });

      if (response.ok) {
        toast.success('Meet link updated!');
        fetchData();
      } else {
        toast.error('Failed to update meet link');
      }
    } catch (error) {
      toast.error('Failed to update meet link');
    }
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (activeTab === 'overview') {
    const stats = {
      totalUsers: users.length,
      students: users.filter(u => u.role === 'student').length,
      teachers: users.filter(u => u.role === 'teacher').length,
      classes: classes.length,
      videos: videos.length
    };

    return (
      <div className="space-y-8" data-testid="admin-dashboard">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Admin Dashboard
          </h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            System overview and management
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Total Users</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.totalUsers}</p>
          </Card>

          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Students</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.students}</p>
          </Card>

          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Teachers</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.teachers}</p>
          </Card>

          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Classes</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{stats.classes}</p>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Recent Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Latest Classes</h3>
              <div className="space-y-3">
                {classes.slice(0, 5).map(cls => (
                  <div key={cls.class_id} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{cls.title}</p>
                      <p className="text-xs text-stone-500">{cls.teacher_name}</p>
                    </div>
                    <span className="text-xs text-stone-500">{cls.enrolled_count} enrolled</span>
                  </div>
                ))}
                {classes.length === 0 && (
                  <p className="text-sm text-stone-500 text-center py-4">No classes yet</p>
                )}
              </div>
            </Card>

            <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Latest Videos</h3>
              <div className="space-y-3">
                {videos.slice(0, 5).map(video => (
                  <div key={video.video_id} className="flex justify-between items-center py-2 border-b border-stone-100 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{video.title}</p>
                      <p className="text-xs text-stone-500">{video.class_id}</p>
                    </div>
                    <Video className="w-4 h-4 text-stone-400" />
                  </div>
                ))}
                {videos.length === 0 && (
                  <p className="text-sm text-stone-500 text-center py-4">No videos yet</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'users') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            User Management
          </h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Manage users and their roles
          </p>
        </div>

        <Card className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>User</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Email</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Role</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Meet Link (Teachers)</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {users.map(u => (
                  <tr key={u.user_id} data-testid={`user-row-${u.user_id}`} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.picture || 'https://via.placeholder.com/40'} alt={u.name} className="w-10 h-10 rounded-full" />
                        <span className="font-medium text-slate-900" style={{ fontFamily: 'Manrope, sans-serif' }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600" style={{ fontFamily: 'Manrope, sans-serif' }}>{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.role === 'teacher' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            placeholder="https://meet.google.com/..."
                            defaultValue={u.meet_link || ''}
                            onChange={(e) => setMeetLinkInputs(prev => ({ ...prev, [u.user_id]: e.target.value }))}
                            className="flex-1 px-3 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-[200px]"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleMeetLinkUpdate(u.user_id, meetLinkInputs[u.user_id] ?? u.meet_link ?? '')}
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded-full"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Set
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.user_id !== user.user_id && (
                        <select
                          data-testid={`role-select-${u.user_id}`}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                          className="px-3 py-1 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (activeTab === 'classes') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            All Classes
          </h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Overview of all classes in the system
          </p>
        </div>

        {classes.length === 0 ? (
          <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center">
            <p className="text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>No classes created yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {classes.map(cls => (
              <Card key={cls.class_id} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card class-card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{cls.title}</h3>
                    <p className="text-sm text-stone-500 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>Teacher: {cls.teacher_name}</p>
                    {cls.description && (
                      <p className="text-sm text-stone-600 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{cls.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(cls.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{cls.enrolled_count}/{cls.max_students} enrolled</span>
                      </div>
                    </div>
                  </div>
                  {cls.meet_link && (
                    <Button
                      onClick={() => window.open(cls.meet_link, '_blank')}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full"
                    >
                      View Meeting
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'videos') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            All Videos
          </h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Overview of all videos in the system
          </p>
        </div>

        {videos.length === 0 ? (
          <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center">
            <Video className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>No videos uploaded yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map(video => (
              <Card key={video.video_id} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-card video-card">
                <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                  <Video className="w-12 h-12 text-stone-300" />
                  <div className="video-overlay">
                    {video.video_url && (
                      <Button
                        onClick={() => window.open(video.video_url, '_blank')}
                        className="bg-white hover:bg-orange-50 text-orange-600 font-medium px-6 py-3 rounded-full"
                      >
                        Watch Video
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-stone-500 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>{video.description}</p>
                  )}
                  <p className="text-xs text-stone-400">Class ID: {video.class_id}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AdminDashboard;