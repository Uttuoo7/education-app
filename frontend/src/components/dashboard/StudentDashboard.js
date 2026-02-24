import { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StudentDashboard = ({ activeTab, user }) => {
  const [classes, setClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, enrollmentsRes, videosRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/classes`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/enrollments`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/videos`, { credentials: 'include' })
      ]);

      if (classesRes.ok && enrollmentsRes.ok && videosRes.ok) {
        const classesData = await classesRes.json();
        const enrollmentsData = await enrollmentsRes.json();
        const videosData = await videosRes.json();

        const enrolledIds = enrollmentsData.map(e => e.class_id);
        setEnrolledClasses(classesData.filter(c => enrolledIds.includes(c.class_id)));
        setClasses(classesData);
        setVideos(videosData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (classId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ class_id: classId })
      });

      if (response.ok) {
        toast.success('Enrolled successfully!');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to enroll');
      }
    } catch (error) {
      toast.error('Failed to enroll');
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
    const upcomingClasses = enrolledClasses
      .filter(c => new Date(c.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 3);

    return (
      <div className="space-y-8" data-testid="student-dashboard">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Welcome back, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            You're enrolled in {enrolledClasses.length} classes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Enrolled</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{enrolledClasses.length}</p>
          </Card>

          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Upcoming</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{upcomingClasses.length}</p>
          </Card>

          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Video className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Videos</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{videos.length}</p>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Upcoming Classes
          </h2>
          {upcomingClasses.length === 0 ? (
            <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center">
              <p className="text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>No upcoming classes</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcomingClasses.map(cls => (
                <Card key={cls.class_id} data-testid={`class-card-${cls.class_id}`} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card class-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{cls.title}</h3>
                      <p className="text-sm text-stone-500 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>By {cls.teacher_name}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTime(cls.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{cls.enrolled_count}/{cls.max_students}</span>
                        </div>
                      </div>
                    </div>
                    {cls.meet_link && (
                      <Button
                        onClick={() => window.open(cls.meet_link, '_blank')}
                        data-testid={`join-meet-${cls.class_id}`}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full"
                      >
                        Join Meeting
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'classes') {
    const availableClasses = classes.filter(c => !enrolledClasses.find(e => e.class_id === c.class_id));

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            My Classes
          </h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Manage your enrolled classes
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Enrolled Classes
          </h2>
          {enrolledClasses.length === 0 ? (
            <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center">
              <p className="text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>You haven't enrolled in any classes yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledClasses.map(cls => (
                <Card key={cls.class_id} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card class-card">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{cls.title}</h3>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Enrolled</span>
                    </div>
                    <p className="text-sm text-stone-500 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>By {cls.teacher_name}</p>
                    {cls.description && (
                      <p className="text-sm text-stone-600 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{cls.description}</p>
                    )}
                  </div>
                  <div className="space-y-2 mb-4 text-sm text-stone-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Starts: {formatDateTime(cls.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{cls.enrolled_count}/{cls.max_students} students</span>
                    </div>
                  </div>
                  {cls.meet_link && (
                    <Button
                      onClick={() => window.open(cls.meet_link, '_blank')}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full"
                    >
                      Join Meeting
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Available Classes
          </h2>
          {availableClasses.length === 0 ? (
            <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center">
              <p className="text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>No available classes at the moment</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableClasses.map(cls => (
                <Card key={cls.class_id} data-testid={`available-class-${cls.class_id}`} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card class-card">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{cls.title}</h3>
                    <p className="text-sm text-stone-500 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>By {cls.teacher_name}</p>
                    {cls.description && (
                      <p className="text-sm text-stone-600 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{cls.description}</p>
                    )}
                  </div>
                  <div className="space-y-2 mb-4 text-sm text-stone-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Starts: {formatDateTime(cls.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{cls.enrolled_count}/{cls.max_students} students</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleEnroll(cls.class_id)}
                    data-testid={`enroll-btn-${cls.class_id}`}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full"
                  >
                    Enroll Now
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'videos') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Video Library
          </h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Access class recordings and materials
          </p>
        </div>

        {videos.length === 0 ? (
          <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center">
            <Video className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>No videos available yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map(video => (
              <Card key={video.video_id} data-testid={`video-${video.video_id}`} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-card video-card">
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
                    <p className="text-sm text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>{video.description}</p>
                  )}
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

export default StudentDashboard;