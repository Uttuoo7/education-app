import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, Video, Users, Trash2, Link as LinkIcon, Plus, BookOpen, ClipboardList, FileText, TrendingUp, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API_BASE from '@/config';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CLASS_COLORS = ['#ea580c', '#2563eb', '#16a34a', '#7c3aed', '#db2777', '#0891b2'];

const TeacherDashboard = ({ activeTab, user }) => {
  const [classes, setClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);

  // Per-feature data
  const [assignments, setAssignments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [progress, setProgress] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [newClass, setNewClass] = useState({ title: '', description: '', start_time: '', end_time: '', max_students: 30 });
  const [newVideo, setNewVideo] = useState({ class_id: '', title: '', video_url: '', description: '' });
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', due_date: '' });
  const [newNote, setNewNote] = useState({ content: '', session_date: new Date().toISOString().split('T')[0] });
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [newProgress, setNewProgress] = useState({ student_id: '', grade: '', comment: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });
  const [calendarEvent, setCalendarEvent] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [classesRes, videosRes] = await Promise.all([
        fetch(`${API_BASE}/classes`, { credentials: 'include' }),
        fetch(`${API_BASE}/videos`, { credentials: 'include' })
      ]);
      if (classesRes.ok) setClasses(await classesRes.json());
      if (videosRes.ok) setVideos(await videosRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, activeTab]);

  // Fetch class-specific data when selectedClass changes
  useEffect(() => {
    if (!selectedClass) return;
    const fetchClassData = async () => {
      const [asn, nt, att, prog, ann, enroll] = await Promise.all([
        fetch(`${API_BASE}/classes/${selectedClass}/assignments`, { credentials: 'include' }),
        fetch(`${API_BASE}/classes/${selectedClass}/notes`, { credentials: 'include' }),
        fetch(`${API_BASE}/classes/${selectedClass}/attendance`, { credentials: 'include' }),
        fetch(`${API_BASE}/classes/${selectedClass}/progress`, { credentials: 'include' }),
        fetch(`${API_BASE}/classes/${selectedClass}/announcements`, { credentials: 'include' }),
        fetch(`${API_BASE}/enrollments`, { credentials: 'include' }),
      ]);
      if (asn.ok) setAssignments(await asn.json());
      if (nt.ok) setNotes(await nt.json());
      if (att.ok) setAttendance(await att.json());
      if (prog.ok) setProgress(await prog.json());
      if (ann.ok) setAnnouncements(await ann.json());
      if (enroll.ok) {
        // Get all users and filter to those enrolled in this class
        const usersRes = await fetch(`${API_BASE}/users`, { credentials: 'include' });
        if (usersRes.ok) {
          const allUsers = await usersRes.json();
          setEnrolledStudents(allUsers.filter(u => u.role === 'student'));
        }
      }
    };
    fetchClassData();
  }, [selectedClass]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE}/classes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(newClass)
    });
    if (response.ok) {
      toast.success('Class created!');
      setShowClassDialog(false);
      setNewClass({ title: '', description: '', start_time: '', end_time: '', max_students: 30 });
      fetchData();
    } else { toast.error('Failed to create class'); }
  };

  const handleCreateMeetLink = async (classId) => {
    const r = await fetch(`${API_BASE}/classes/${classId}/meet`, { method: 'POST', credentials: 'include' });
    if (r.ok) { toast.success('Meet link created!'); fetchData(); }
    else toast.error('Failed to create meet link');
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Delete this class?')) return;
    const r = await fetch(`${API_BASE}/classes/${classId}`, { method: 'DELETE', credentials: 'include' });
    if (r.ok) { toast.success('Class deleted'); fetchData(); }
    else toast.error('Failed to delete class');
  };

  const handleCreateVideo = async (e) => {
    e.preventDefault();
    const r = await fetch(`${API_BASE}/videos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(newVideo)
    });
    if (r.ok) { toast.success('Video added!'); setShowVideoDialog(false); setNewVideo({ class_id: '', title: '', video_url: '', description: '' }); fetchData(); }
    else toast.error('Failed to add video');
  };

  const handlePostAssignment = async (e) => {
    e.preventDefault();
    if (!selectedClass) return toast.error('Select a class first');
    const r = await fetch(`${API_BASE}/classes/${selectedClass}/assignments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(newAssignment)
    });
    if (r.ok) {
      toast.success('Assignment posted!');
      setNewAssignment({ title: '', description: '', due_date: '' });
      const res = await fetch(`${API_BASE}/classes/${selectedClass}/assignments`, { credentials: 'include' });
      if (res.ok) setAssignments(await res.json());
    } else toast.error('Failed to post assignment');
  };

  const handleDeleteAssignment = async (assignmentId) => {
    await fetch(`${API_BASE}/classes/${selectedClass}/assignments/${assignmentId}`, { method: 'DELETE', credentials: 'include' });
    const res = await fetch(`${API_BASE}/classes/${selectedClass}/assignments`, { credentials: 'include' });
    if (res.ok) setAssignments(await res.json());
    toast.success('Deleted');
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!selectedClass) return toast.error('Select a class first');
    const r = await fetch(`${API_BASE}/classes/${selectedClass}/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(newNote)
    });
    if (r.ok) {
      toast.success('Note saved!');
      setNewNote({ content: '', session_date: new Date().toISOString().split('T')[0] });
      const res = await fetch(`${API_BASE}/classes/${selectedClass}/notes`, { credentials: 'include' });
      if (res.ok) setNotes(await res.json());
    } else toast.error('Failed to save note');
  };

  const handleDeleteNote = async (noteId) => {
    await fetch(`${API_BASE}/classes/${selectedClass}/notes/${noteId}`, { method: 'DELETE', credentials: 'include' });
    const res = await fetch(`${API_BASE}/classes/${selectedClass}/notes`, { credentials: 'include' });
    if (res.ok) setNotes(await res.json());
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass) return toast.error('Select a class first');
    const records = enrolledStudents.map(s => ({
      student_id: s.user_id,
      status: attendanceRecords[s.user_id] || 'present'
    }));
    const r = await fetch(`${API_BASE}/classes/${selectedClass}/attendance`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ session_date: attendanceDate, records })
    });
    if (r.ok) {
      toast.success('Attendance saved!');
      const res = await fetch(`${API_BASE}/classes/${selectedClass}/attendance`, { credentials: 'include' });
      if (res.ok) setAttendance(await res.json());
    } else toast.error('Failed to save attendance');
  };

  const handleAddProgress = async (e) => {
    e.preventDefault();
    if (!selectedClass) return toast.error('Select a class first');
    const r = await fetch(`${API_BASE}/classes/${selectedClass}/progress`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(newProgress)
    });
    if (r.ok) {
      toast.success('Progress updated!');
      setNewProgress({ student_id: '', grade: '', comment: '' });
      const res = await fetch(`${API_BASE}/classes/${selectedClass}/progress`, { credentials: 'include' });
      if (res.ok) setProgress(await res.json());
    } else toast.error('Failed to update progress');
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!selectedClass) return toast.error('Select a class first');
    const r = await fetch(`${API_BASE}/classes/${selectedClass}/announcements`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(newAnnouncement)
    });
    if (r.ok) {
      toast.success('Announcement posted!');
      setNewAnnouncement({ title: '', content: '' });
      const res = await fetch(`${API_BASE}/classes/${selectedClass}/announcements`, { credentials: 'include' });
      if (res.ok) setAnnouncements(await res.json());
    } else toast.error('Failed to post announcement');
  };

  const formatDateTime = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const ClassSelector = ({ label = 'Select Class' }) => (
    <select
      className="px-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      value={selectedClass}
      onChange={e => setSelectedClass(e.target.value)}
    >
      <option value="">{label}</option>
      {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.title}</option>)}
    </select>
  );

  const CreateClassForm = () => (
    <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-full">
          <Plus className="w-4 h-4 mr-2" /> Create Class
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader><DialogTitle style={{ fontFamily: 'Outfit, sans-serif' }}>Create New Class</DialogTitle></DialogHeader>
        <form onSubmit={handleCreateClass} className="space-y-4">
          <div><Label>Title</Label><Input value={newClass.title} onChange={e => setNewClass({ ...newClass, title: e.target.value })} required /></div>
          <div><Label>Description</Label><Textarea value={newClass.description} onChange={e => setNewClass({ ...newClass, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Start Time</Label><Input type="datetime-local" value={newClass.start_time} onChange={e => setNewClass({ ...newClass, start_time: e.target.value })} required /></div>
            <div><Label>End Time</Label><Input type="datetime-local" value={newClass.end_time} onChange={e => setNewClass({ ...newClass, end_time: e.target.value })} required /></div>
          </div>
          <div><Label>Max Students</Label><Input type="number" value={newClass.max_students} onChange={e => setNewClass({ ...newClass, max_students: parseInt(e.target.value) })} min="1" required /></div>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full">Create Class</Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" /></div>;

  // ── CALENDAR TAB ──────────────────────────────────────────────────────────
  if (activeTab === 'calendar') {
    const events = classes.map((cls, i) => ({
      id: cls.class_id,
      title: cls.title,
      start: new Date(cls.start_time),
      end: new Date(cls.end_time),
      resource: cls,
      color: CLASS_COLORS[i % CLASS_COLORS.length],
    }));
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Class Calendar</h1>
            <p className="text-stone-500 mt-1" style={{ fontFamily: 'Manrope, sans-serif' }}>All your scheduled classes at a glance</p>
          </div>
          <CreateClassForm />
        </div>
        <Card className="bg-white border border-stone-100 rounded-2xl p-4 shadow-card" style={{ height: 600 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={(event) => ({ style: { backgroundColor: event.color, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13 } })}
            onSelectEvent={(event) => setCalendarEvent(event.resource)}
            views={['month', 'week', 'day', 'agenda']}
            defaultView="week"
          />
        </Card>
        {calendarEvent && (
          <Card className="bg-white border border-orange-200 rounded-2xl p-6 shadow-card">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{calendarEvent.title}</h2>
                {calendarEvent.description && <p className="text-stone-500 mb-3">{calendarEvent.description}</p>}
                <div className="flex gap-4 text-sm text-stone-500">
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatDateTime(calendarEvent.start_time)} – {formatDateTime(calendarEvent.end_time)}</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {calendarEvent.enrolled_count}/{calendarEvent.max_students}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {calendarEvent.meet_link && (
                  <Button onClick={() => window.open(calendarEvent.meet_link, '_blank')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">
                    Start Meeting
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setCalendarEvent(null)} className="text-stone-500">✕</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── OVERVIEW TAB ──────────────────────────────────────────────────────────
  if (activeTab === 'overview') {
    const upcomingClasses = classes.filter(c => new Date(c.start_time) > new Date()).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).slice(0, 3);
    return (
      <div className="space-y-8" data-testid="teacher-dashboard">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Welcome, {user.name.split(' ')[0]}!</h1>
          <p className="text-lg text-stone-500" style={{ fontFamily: 'Manrope, sans-serif' }}>You're teaching {classes.length} classes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{ icon: CalendarIcon, label: 'Total Classes', value: classes.length, bg: 'bg-orange-50', color: 'text-orange-600' },
          { icon: Users, label: 'Students', value: classes.reduce((s, c) => s + c.enrolled_count, 0), bg: 'bg-blue-50', color: 'text-blue-600' },
          { icon: Video, label: 'Videos', value: videos.length, bg: 'bg-green-50', color: 'text-green-600' }
          ].map(({ icon: Icon, label, value, bg, color }) => (
            <Card key={label} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2"><div className={`p-2 ${bg} rounded-lg`}><Icon className={`w-5 h-5 ${color}`} /></div><p className="text-sm font-medium text-stone-500 uppercase tracking-wide">{label}</p></div>
              <p className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
            </Card>
          ))}
        </div>

        {/* Announcements quick-post */}
        <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}><Megaphone className="w-5 h-5 text-orange-500" /> Post Announcement</h2>
          <form onSubmit={handlePostAnnouncement} className="space-y-3">
            <div className="flex gap-3">
              <ClassSelector label="— Choose class —" />
              <Input placeholder="Title" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} required className="flex-1" />
            </div>
            <Textarea placeholder="Announcement content..." value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} required />
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Post Announcement</Button>
          </form>
        </Card>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Upcoming Classes</h2>
            <CreateClassForm />
          </div>
          {upcomingClasses.length === 0 ? (
            <Card className="bg-white border border-stone-100 rounded-2xl p-8 text-center"><p className="text-stone-500">No upcoming classes</p></Card>
          ) : (
            <div className="space-y-4">
              {upcomingClasses.map(cls => (
                <Card key={cls.class_id} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>{cls.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDateTime(cls.start_time)}</span>
                        <span className="flex items-center gap-1"><Users className="w-4 h-4" />{cls.enrolled_count}/{cls.max_students} enrolled</span>
                      </div>
                    </div>
                    {cls.meet_link ? (
                      <Button onClick={() => window.open(cls.meet_link, '_blank')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Start Meeting</Button>
                    ) : (
                      <Button onClick={() => handleCreateMeetLink(cls.class_id)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full"><LinkIcon className="w-4 h-4 mr-2" />Create Meet Link</Button>
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

  // ── CLASSES TAB ───────────────────────────────────────────────────────────
  if (activeTab === 'classes') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>My Classes</h1><p className="text-stone-500">Manage your classes</p></div>
          <CreateClassForm />
        </div>
        {classes.length === 0 ? <Card className="p-8 text-center"><p className="text-stone-500">No classes yet</p></Card> : (
          <div className="space-y-4">
            {classes.map(cls => (
              <Card key={cls.class_id} data-testid={`teacher-class-${cls.class_id}`} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>{cls.title}</h3>
                    {cls.description && <p className="text-sm text-stone-500 mb-2">{cls.description}</p>}
                    <div className="flex flex-wrap gap-4 text-sm text-stone-500">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatDateTime(cls.start_time)} – {formatDateTime(cls.end_time)}</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4" />{cls.enrolled_count}/{cls.max_students}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cls.meet_link ? (
                      <Button onClick={() => window.open(cls.meet_link, '_blank')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Start Meeting</Button>
                    ) : (
                      <Button onClick={() => handleCreateMeetLink(cls.class_id)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full"><LinkIcon className="w-4 h-4 mr-2" />Meet Link</Button>
                    )}
                    <Button onClick={() => handleDeleteClass(cls.class_id)} data-testid={`delete-class-${cls.class_id}`} variant="ghost" className="text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── HOMEWORK TAB ──────────────────────────────────────────────────────────
  if (activeTab === 'homework') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Homework & Assignments</h1>
        <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
          <h2 className="text-lg font-semibold mb-4">Post New Assignment</h2>
          <form onSubmit={handlePostAssignment} className="space-y-4">
            <ClassSelector />
            <div><Label>Title</Label><Input value={newAssignment.title} onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })} required /></div>
            <div><Label>Description</Label><Textarea value={newAssignment.description} onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })} /></div>
            <div><Label>Due Date</Label><Input type="datetime-local" value={newAssignment.due_date} onChange={e => setNewAssignment({ ...newAssignment, due_date: e.target.value })} required /></div>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Post Assignment</Button>
          </form>
        </Card>
        {selectedClass && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-900">Posted Assignments</h2>
            {assignments.length === 0 ? <Card className="p-6 text-center"><p className="text-stone-500">No assignments yet</p></Card> : assignments.map(a => (
              <Card key={a.assignment_id} className="bg-white border border-stone-100 rounded-2xl p-5 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-900">{a.title}</p>
                  {a.description && <p className="text-sm text-stone-500 mt-1">{a.description}</p>}
                  <p className="text-xs text-orange-600 mt-2 font-medium">Due: {new Date(a.due_date).toLocaleString()}</p>
                </div>
                <Button variant="ghost" onClick={() => handleDeleteAssignment(a.assignment_id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── ATTENDANCE TAB ────────────────────────────────────────────────────────
  if (activeTab === 'attendance') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Attendance</h1>
        <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
          <div className="flex flex-wrap gap-4 mb-6">
            <ClassSelector />
            <div><Label>Session Date</Label><Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} /></div>
          </div>
          {selectedClass && enrolledStudents.length === 0 && <p className="text-stone-500">No enrolled students for this class.</p>}
          {selectedClass && enrolledStudents.length > 0 && (
            <>
              <div className="space-y-3 mb-4">
                {enrolledStudents.map(s => (
                  <div key={s.user_id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <span className="font-medium text-slate-900">{s.name}</span>
                    <div className="flex gap-2">
                      {['present', 'absent', 'late'].map(status => (
                        <button key={status} onClick={() => setAttendanceRecords(prev => ({ ...prev, [s.user_id]: status }))}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${(attendanceRecords[s.user_id] || 'present') === status ? {
                            present: 'bg-green-500 text-white', absent: 'bg-red-500 text-white', late: 'bg-yellow-500 text-white'
                          }[status] : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}`}>{status}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveAttendance} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Save Attendance</Button>
            </>
          )}
        </Card>
        {selectedClass && attendance.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Past Records</h2>
            <div className="space-y-3">
              {attendance.map(a => (
                <Card key={a.attendance_id} className="bg-white border border-stone-100 rounded-xl p-4">
                  <p className="font-medium text-slate-900 mb-2">📅 {a.session_date}</p>
                  <div className="flex flex-wrap gap-2">
                    {a.records.map(r => (
                      <span key={r.student_id} className={`px-2 py-1 rounded-full text-xs ${r.status === 'present' ? 'bg-green-100 text-green-700' : r.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {enrolledStudents.find(s => s.user_id === r.student_id)?.name || r.student_id}: {r.status}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── NOTES TAB ────────────────────────────────────────────────────────────
  if (activeTab === 'notes') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Lesson Notes</h1>
        <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
          <form onSubmit={handleSaveNote} className="space-y-4">
            <ClassSelector />
            <div><Label>Session Date</Label><Input type="date" value={newNote.session_date} onChange={e => setNewNote({ ...newNote, session_date: e.target.value })} required /></div>
            <div><Label>Notes</Label><Textarea rows={5} placeholder="Write lesson notes here..." value={newNote.content} onChange={e => setNewNote({ ...newNote, content: e.target.value })} required /></div>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Save Notes</Button>
          </form>
        </Card>
        {selectedClass && (
          <div className="space-y-3">
            {notes.map(n => (
              <Card key={n.note_id} className="bg-white border border-stone-100 rounded-xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">📅 {n.session_date}</p>
                  <Button variant="ghost" onClick={() => handleDeleteNote(n.note_id)} className="text-red-400 hover:text-red-600 h-6 w-6 p-0"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{n.content}</p>
              </Card>
            ))}
            {notes.length === 0 && <Card className="p-6 text-center"><p className="text-stone-500">No notes yet for this class</p></Card>}
          </div>
        )}
      </div>
    );
  }

  // ── PROGRESS TAB ─────────────────────────────────────────────────────────
  if (activeTab === 'progress') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Student Progress</h1>
        <Card className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
          <form onSubmit={handleAddProgress} className="space-y-4">
            <ClassSelector />
            <div>
              <Label>Student</Label>
              <select className="w-full px-4 py-2 border border-stone-200 rounded-lg text-sm" value={newProgress.student_id} onChange={e => setNewProgress({ ...newProgress, student_id: e.target.value })} required>
                <option value="">Select student</option>
                {enrolledStudents.map(s => <option key={s.user_id} value={s.user_id}>{s.name}</option>)}
              </select>
            </div>
            <div><Label>Grade</Label><Input placeholder="e.g. A, 85%, Pass" value={newProgress.grade} onChange={e => setNewProgress({ ...newProgress, grade: e.target.value })} /></div>
            <div><Label>Comment</Label><Textarea placeholder="Feedback for the student..." value={newProgress.comment} onChange={e => setNewProgress({ ...newProgress, comment: e.target.value })} /></div>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Update Progress</Button>
          </form>
        </Card>
        {selectedClass && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Progress Records</h2>
            {progress.length === 0 ? <Card className="p-6 text-center"><p className="text-stone-500">No progress records yet</p></Card> : progress.map(p => (
              <Card key={p.progress_id} className="bg-white border border-stone-100 rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-900">{enrolledStudents.find(s => s.user_id === p.student_id)?.name || p.student_id}</p>
                    {p.grade && <span className="inline-block mt-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm font-semibold rounded-full">Grade: {p.grade}</span>}
                    {p.comment && <p className="text-stone-600 mt-2 text-sm">{p.comment}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── VIDEOS TAB ────────────────────────────────────────────────────────────
  if (activeTab === 'videos') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Video Library</h1><p className="text-stone-500">Upload and manage recordings</p></div>
          <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
            <DialogTrigger asChild><Button data-testid="add-video-btn" className="bg-orange-600 hover:bg-orange-700 text-white rounded-full"><Plus className="w-4 h-4 mr-2" />Add Video</Button></DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader><DialogTitle>Add Video</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateVideo} className="space-y-4">
                <div><Label>Class</Label>
                  <select className="w-full px-4 py-2 border border-stone-200 rounded-lg" data-testid="video-class-select" value={newVideo.class_id} onChange={e => setNewVideo({ ...newVideo, class_id: e.target.value })} required>
                    <option value="">Select a class</option>
                    {classes.map(c => <option key={c.class_id} value={c.class_id}>{c.title}</option>)}
                  </select>
                </div>
                <div><Label>Title</Label><Input data-testid="video-title-input" value={newVideo.title} onChange={e => setNewVideo({ ...newVideo, title: e.target.value })} required /></div>
                <div><Label>Video URL</Label><Input data-testid="video-url-input" type="url" value={newVideo.video_url} onChange={e => setNewVideo({ ...newVideo, video_url: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea data-testid="video-description-input" value={newVideo.description} onChange={e => setNewVideo({ ...newVideo, description: e.target.value })} /></div>
                <Button type="submit" data-testid="submit-video-btn" className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full">Add Video</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {videos.length === 0 ? <Card className="p-8 text-center"><Video className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No videos yet</p></Card> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map(video => (
              <Card key={video.video_id} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-card video-card">
                <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                  <Video className="w-12 h-12 text-stone-300" />
                  <div className="video-overlay">{video.video_url && <Button onClick={() => window.open(video.video_url, '_blank')} className="bg-white text-orange-600 rounded-full">Watch Video</Button>}</div>
                </div>
                <div className="p-4"><h3 className="text-lg font-semibold mb-1">{video.title}</h3>{video.description && <p className="text-sm text-stone-500">{video.description}</p>}</div>
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