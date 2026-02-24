import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, Video, Users, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import API_BASE from '@/config';

const TeacherDashboard = ({ activeTab, user }) => {
  const [classes, setClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  const [newClass, setNewClass] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    max_students: 30
  });

  const [newVideo, setNewVideo] = useState({
    class_id: '',
    title: '',
    video_url: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, videosRes] = await Promise.all([
        fetch(`${API_BASE}/classes`, { credentials: 'include' }),
        fetch(`${API_BASE}/videos`, { credentials: 'include' })
      ]);

      if (classesRes.ok && videosRes.ok) {
        setClasses(await classesRes.json());
        setVideos(await videosRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newClass)
      });

      if (response.ok) {
        toast.success('Class created successfully!');
        setShowClassDialog(false);
        setNewClass({ title: '', description: '', start_time: '', end_time: '', max_students: 30 });
        fetchData();
      } else {
        toast.error('Failed to create class');
      }
    } catch (error) {
      toast.error('Failed to create class');
    }
  };

  const handleCreateMeetLink = async (classId) => {
    try {
      const response = await fetch(`${API_BASE}/classes/${classId}/meet`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Google Meet link created!');
        fetchData();
      } else {
        toast.error('Failed to create meet link');
      }
    } catch (error) {
      toast.error('Failed to create meet link');
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      const response = await fetch(`${API_BASE}/classes/${classId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Class deleted successfully');
        fetchData();
      } else {
        toast.error('Failed to delete class');
      }
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  const handleCreateVideo = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newVideo)
      });

      if (response.ok) {
        toast.success('Video added successfully!');
        setShowVideoDialog(false);
        setNewVideo({ class_id: '', title: '', video_url: '', description: '' });
        fetchData();
      } else {
        toast.error('Failed to add video');
      }
    } catch (error) {
      toast.error('Failed to add video');
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
    const upcomingClasses = classes
      .filter(c => new Date(c.start_time) > new Date())
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 3);

    return (
      <div className="space-y-8" data-testid="teacher-dashboard">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Welcome, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
            You're teaching {classes.length} classes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Total Classes</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{classes.length}</p>
          </Card>

          <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Manrope, sans-serif' }}>Students</p>
            </div>
            <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {classes.reduce((sum, c) => sum + c.enrolled_count, 0)}
            </p>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Upcoming Classes
            </h2>
            <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
              <DialogTrigger asChild>
                <Button data-testid="create-class-btn" className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Class
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Create New Class</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      data-testid="class-title-input"
                      value={newClass.title}
                      onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      data-testid="class-description-input"
                      value={newClass.description}
                      onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time</Label>
                      <Input
                        data-testid="class-start-time-input"
                        type="datetime-local"
                        value={newClass.start_time}
                        onChange={(e) => setNewClass({ ...newClass, start_time: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input
                        data-testid="class-end-time-input"
                        type="datetime-local"
                        value={newClass.end_time}
                        onChange={(e) => setNewClass({ ...newClass, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Max Students</Label>
                    <Input
                      data-testid="class-max-students-input"
                      type="number"
                      value={newClass.max_students}
                      onChange={(e) => setNewClass({ ...newClass, max_students: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                  <Button type="submit" data-testid="submit-class-btn" className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full">
                    Create Class
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {upcomingClasses.length === 0 ? (
            <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center">
              <p className="text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>No upcoming classes</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingClasses.map(cls => (
                <Card key={cls.class_id} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card class-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{cls.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTime(cls.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{cls.enrolled_count}/{cls.max_students} enrolled</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {cls.meet_link ? (
                        <Button
                          onClick={() => window.open(cls.meet_link, '_blank')}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full"
                        >
                          Start Meeting
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleCreateMeetLink(cls.class_id)}
                          data-testid={`create-meet-link-${cls.class_id}`}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full"
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Create Meet Link
                        </Button>
                      )}
                    </div>
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
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              My Classes
            </h1>
            <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Manage your classes and schedules
            </p>
          </div>
          <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Create New Class</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newClass.title}
                    onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <Input
                      type="datetime-local"
                      value={newClass.start_time}
                      onChange={(e) => setNewClass({ ...newClass, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input
                      type="datetime-local"
                      value={newClass.end_time}
                      onChange={(e) => setNewClass({ ...newClass, end_time: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Max Students</Label>
                  <Input
                    type="number"
                    value={newClass.max_students}
                    onChange={(e) => setNewClass({ ...newClass, max_students: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full">
                  Create Class
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {classes.length === 0 ? (
          <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center">
            <p className="text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>No classes created yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {classes.map(cls => (
              <Card key={cls.class_id} data-testid={`teacher-class-${cls.class_id}`} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card class-card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{cls.title}</h3>
                    {cls.description && (
                      <p className="text-sm text-stone-600 mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>{cls.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(cls.start_time)} - {formatDateTime(cls.end_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{cls.enrolled_count}/{cls.max_students} enrolled</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cls.meet_link ? (
                      <Button
                        onClick={() => window.open(cls.meet_link, '_blank')}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full"
                      >
                        Start Meeting
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleCreateMeetLink(cls.class_id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full"
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Create Meet Link
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteClass(cls.class_id)}
                      data-testid={`delete-class-${cls.class_id}`}
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Video Library
            </h1>
            <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Upload and manage class recordings
            </p>
          </div>
          <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-video-btn" className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Add Video</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateVideo} className="space-y-4">
                <div>
                  <Label>Class</Label>
                  <select
                    data-testid="video-class-select"
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg"
                    value={newVideo.class_id}
                    onChange={(e) => setNewVideo({ ...newVideo, class_id: e.target.value })}
                    required
                  >
                    <option value="">Select a class</option>
                    {classes.map(cls => (
                      <option key={cls.class_id} value={cls.class_id}>{cls.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    data-testid="video-title-input"
                    value={newVideo.title}
                    onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Video URL</Label>
                  <Input
                    data-testid="video-url-input"
                    type="url"
                    value={newVideo.video_url}
                    onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    data-testid="video-description-input"
                    value={newVideo.description}
                    onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                  />
                </div>
                <Button type="submit" data-testid="submit-video-btn" className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full">
                  Add Video
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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

export default TeacherDashboard;