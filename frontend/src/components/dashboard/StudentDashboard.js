import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, Video, Users, BookOpen, TrendingUp, Megaphone, CreditCard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API_BASE from '@/config';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const CLASS_COLORS = ['#ea580c', '#2563eb', '#16a34a', '#7c3aed', '#db2777', '#0891b2'];

const StudentDashboard = ({ activeTab, user }) => {
  const [classes, setClasses] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [billing, setBilling] = useState({ balance: 0, transactions: [] });
  const [invoices, setInvoices] = useState([]);
  const [calendarEvent, setCalendarEvent] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [classesRes, enrollmentsRes, videosRes] = await Promise.all([
        fetch(`${API_BASE}/classes`, { credentials: 'include' }),
        fetch(`${API_BASE}/enrollments`, { credentials: 'include' }),
        fetch(`${API_BASE}/videos`, { credentials: 'include' })
      ]);
      if (classesRes.ok && enrollmentsRes.ok) {
        const classesData = await classesRes.json();
        const enrollmentsData = await enrollmentsRes.json();
        const enrolledIds = enrollmentsData.map(e => e.class_id);
        const enrolled = classesData.filter(c => enrolledIds.includes(c.class_id));
        setEnrolledClasses(enrolled);
        setClasses(classesData);
      }
      if (videosRes.ok) setVideos(await videosRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, activeTab]);

  // Fetch feature data
  useEffect(() => {
    const load = async () => {
      const [asnRes, progRes, invRes, credRes] = await Promise.all([
        fetch(`${API_BASE}/assignments`, { credentials: 'include' }),
        fetch(`${API_BASE}/progress`, { credentials: 'include' }),
        fetch(`${API_BASE}/invoices`, { credentials: 'include' }),
        fetch(`${API_BASE}/students/${user.user_id}/credits`, { credentials: 'include' }),
      ]);
      if (asnRes.ok) setAssignments(await asnRes.json());
      if (progRes.ok) setProgress(await progRes.json());
      if (invRes.ok) setInvoices(await invRes.json());
      if (credRes.ok) setBilling(await credRes.json());
    };
    if (user?.user_id) load();
  }, [user, activeTab]);

  // Fetch announcements from all enrolled classes
  useEffect(() => {
    if (!enrolledClasses.length) return;
    const load = async () => {
      const results = await Promise.all(
        enrolledClasses.map(cls => fetch(`${API_BASE}/classes/${cls.class_id}/announcements`, { credentials: 'include' }).then(r => r.ok ? r.json() : []))
      );
      const all = results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setAnnouncements(all);
    };
    load();
  }, [enrolledClasses]);

  const handleEnroll = async (classId) => {
    const r = await fetch(`${API_BASE}/enrollments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ class_id: classId })
    });
    if (r.ok) { toast.success('Enrolled!'); fetchData(); }
    else { const e = await r.json(); toast.error(e.detail || 'Failed to enroll'); }
  };

  const formatDate = (ds) => new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatDateTime = (ds) => new Date(ds).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" /></div>;

  // ── CALENDAR ──────────────────────────────────────────────────────────────
  if (activeTab === 'calendar') {
    const events = enrolledClasses.map((cls, i) => ({
      id: cls.class_id, title: cls.title,
      start: new Date(cls.start_time), end: new Date(cls.end_time),
      resource: cls, color: CLASS_COLORS[i % CLASS_COLORS.length],
    }));
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>My Schedule</h1>
          <p className="text-stone-500 mt-1">View all your enrolled classes</p>
        </div>
        <Card className="bg-white border border-stone-100 rounded-2xl p-4 shadow-card" style={{ height: 600 }}>
          <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" style={{ height: '100%' }}
            eventPropGetter={e => ({ style: { backgroundColor: e.color, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13 } })}
            onSelectEvent={e => setCalendarEvent(e.resource)}
            views={['month', 'week', 'day', 'agenda']} defaultView="week" />
        </Card>
        {calendarEvent && (
          <Card className="bg-white border border-orange-200 rounded-2xl p-6 shadow-card">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{calendarEvent.title}</h2>
                <p className="text-stone-500 mt-1">By {calendarEvent.teacher_name}</p>
                <div className="flex gap-4 text-sm text-stone-500 mt-2">
                  <span><Clock className="w-4 h-4 inline mr-1" />{formatDateTime(calendarEvent.start_time)}</span>
                  <span><Users className="w-4 h-4 inline mr-1" />{calendarEvent.enrolled_count}/{calendarEvent.max_students}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {calendarEvent.meet_link && <Button onClick={() => window.open(calendarEvent.meet_link, '_blank')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Join Meeting</Button>}
                <Button variant="ghost" onClick={() => setCalendarEvent(null)} className="text-stone-500">✕</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  if (activeTab === 'overview') {
    const upcoming = enrolledClasses.filter(c => new Date(c.start_time) > new Date()).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).slice(0, 3);
    const recentAnn = announcements.slice(0, 3);
    return (
      <div className="space-y-8" data-testid="student-dashboard">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Welcome back, {user.name.split(' ')[0]}!</h1>
          <p className="text-lg text-stone-500 mt-1">Enrolled in {enrolledClasses.length} classes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{ icon: CalendarIcon, label: 'Enrolled', value: enrolledClasses.length, bg: 'bg-orange-50', color: 'text-orange-600' },
          { icon: Clock, label: 'Upcoming', value: upcoming.length, bg: 'bg-blue-50', color: 'text-blue-600' },
          { icon: BookOpen, label: 'Assignments', value: assignments.length, bg: 'bg-green-50', color: 'text-green-600' }
          ].map(({ icon: Icon, label, value, bg, color }) => (
            <Card key={label} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2"><div className={`p-2 ${bg} rounded-lg`}><Icon className={`w-5 h-5 ${color}`} /></div><p className="text-sm font-medium text-stone-500 uppercase tracking-wide">{label}</p></div>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
            </Card>
          ))}
        </div>

        {recentAnn.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Megaphone className="w-5 h-5 text-orange-500" /> Recent Announcements</h2>
            <div className="space-y-3">
              {recentAnn.map(a => (
                <Card key={a.announcement_id} className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                  <p className="font-semibold text-slate-900">{a.title}</p>
                  <p className="text-sm text-stone-600 mt-1">{a.content}</p>
                  <p className="text-xs text-stone-400 mt-2">Posted by {a.posted_by_name} · {formatDate(a.created_at)}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-3">Upcoming Classes</h2>
          {upcoming.length === 0 ? <Card className="p-8 text-center"><p className="text-stone-500">No upcoming classes</p></Card> : (
            <div className="space-y-3">
              {upcoming.map(cls => (
                <Card key={cls.class_id} data-testid={`class-card-${cls.class_id}`} className="bg-white border border-stone-100 rounded-2xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{cls.title}</h3>
                      <p className="text-sm text-stone-500">By {cls.teacher_name} · {formatDateTime(cls.start_time)}</p>
                    </div>
                    {cls.meet_link && <Button data-testid={`join-meet-${cls.class_id}`} onClick={() => window.open(cls.meet_link, '_blank')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">Join</Button>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MY CLASSES ────────────────────────────────────────────────────────────
  if (activeTab === 'classes') {
    const available = classes.filter(c => !enrolledClasses.find(e => e.class_id === c.class_id));
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>My Classes</h1>
        <div>
          <h2 className="text-xl font-semibold mb-3">Enrolled</h2>
          {enrolledClasses.length === 0 ? <Card className="p-8 text-center"><p className="text-stone-500">Not enrolled in any classes</p></Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrolledClasses.map(cls => (
                <Card key={cls.class_id} className="bg-white border border-stone-100 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{cls.title}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Enrolled</span>
                  </div>
                  <p className="text-sm text-stone-500 mb-3">By {cls.teacher_name}</p>
                  {cls.meet_link && <Button onClick={() => window.open(cls.meet_link, '_blank')} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full">Join Meeting</Button>}
                </Card>
              ))}
            </div>
          )}
        </div>
        {available.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Available to Join</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {available.map(cls => (
                <Card key={cls.class_id} data-testid={`available-class-${cls.class_id}`} className="bg-white border border-stone-100 rounded-2xl p-5">
                  <h3 className="text-lg font-semibold mb-1">{cls.title}</h3>
                  <p className="text-sm text-stone-500 mb-3">By {cls.teacher_name} · {cls.enrolled_count}/{cls.max_students} enrolled</p>
                  <Button data-testid={`enroll-btn-${cls.class_id}`} onClick={() => handleEnroll(cls.class_id)} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full">Enroll Now</Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── HOMEWORK ──────────────────────────────────────────────────────────────
  if (activeTab === 'homework') {
    const now = new Date();
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Homework</h1>
        {assignments.length === 0 ? <Card className="p-8 text-center"><BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No assignments yet</p></Card> : (
          <div className="space-y-3">
            {assignments.map(a => {
              const due = new Date(a.due_date);
              const overdue = due < now;
              return (
                <Card key={a.assignment_id} className="bg-white border border-stone-100 rounded-xl p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      {a.description && <p className="text-sm text-stone-500 mt-1">{a.description}</p>}
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${overdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {overdue ? '⚠ Overdue' : 'Due'}: {formatDate(a.due_date)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── PROGRESS ──────────────────────────────────────────────────────────────
  if (activeTab === 'progress') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>My Progress</h1>
        {progress.length === 0 ? <Card className="p-8 text-center"><TrendingUp className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No grades yet</p></Card> : (
          <div className="space-y-3">
            {progress.map(p => (
              <Card key={p.progress_id} className="bg-white border border-stone-100 rounded-xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-stone-500 mb-1">{enrolledClasses.find(c => c.class_id === p.class_id)?.title || p.class_id}</p>
                    {p.grade && <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-sm">Grade: {p.grade}</span>}
                    {p.comment && <p className="text-stone-600 mt-2 text-sm italic">"{p.comment}"</p>}
                  </div>
                  <p className="text-xs text-stone-400">{formatDate(p.created_at)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────
  if (activeTab === 'announcements') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Announcements</h1>
        {announcements.length === 0 ? <Card className="p-8 text-center"><Megaphone className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No announcements</p></Card> : (
          <div className="space-y-3">
            {announcements.map(a => (
              <Card key={a.announcement_id} className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                <p className="font-semibold text-slate-900 mb-1">{a.title}</p>
                <p className="text-stone-700">{a.content}</p>
                <p className="text-xs text-stone-400 mt-3">Posted by {a.posted_by_name} · {formatDate(a.created_at)}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── BILLING ───────────────────────────────────────────────────────────────
  if (activeTab === 'billing') {
    const unpaid = invoices.filter(i => i.status === 'unpaid');
    const paid = invoices.filter(i => i.status === 'paid');
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Billing</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6">
            <p className="text-orange-100 text-sm font-medium uppercase tracking-wide mb-1">Credit Balance</p>
            <p className="text-4xl font-bold">₹{billing.balance?.toFixed(2) || '0.00'}</p>
            {billing.transactions?.length > 0 && <p className="text-orange-100 text-sm mt-2">{billing.transactions.length} transaction(s)</p>}
          </Card>
          <Card className="bg-white border border-stone-100 rounded-2xl p-6">
            <p className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-1">Unpaid Invoices</p>
            <p className="text-4xl font-bold text-red-600">{unpaid.length}</p>
            <p className="text-stone-500 text-sm mt-2">Total: ₹{unpaid.reduce((s, i) => s + i.amount, 0).toFixed(2)}</p>
          </Card>
        </div>

        {billing.transactions?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Credit History</h2>
            <Card className="bg-white border border-stone-100 rounded-2xl overflow-hidden">
              {billing.transactions.map(tx => (
                <div key={tx.tx_id} className="flex justify-between items-center px-5 py-3 border-b border-stone-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tx.note || 'Credit adjustment'}</p>
                    <p className="text-xs text-stone-400">{formatDate(tx.created_at)}</p>
                  </div>
                  <span className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount >= 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-3">Invoices</h2>
          {invoices.length === 0 ? <Card className="p-6 text-center"><p className="text-stone-500">No invoices</p></Card> : (
            <div className="space-y-3">
              {invoices.map(inv => (
                <Card key={inv.invoice_id} className="bg-white border border-stone-100 rounded-xl p-5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-900">{inv.description}</p>
                    <p className="text-sm text-stone-500">Due: {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lg">₹{inv.amount.toFixed(2)}</p>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {inv.status}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Videos still accessible */}
        {videos.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Class Recordings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {videos.map(v => (
                <Card key={v.video_id} data-testid={`video-${v.video_id}`} className="bg-white border border-stone-100 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-slate-100 flex items-center justify-center">
                    <Video className="w-10 h-10 text-stone-300" />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{v.title}</p>
                    {v.video_url && <Button onClick={() => window.open(v.video_url, '_blank')} className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-sm">Watch</Button>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── VIDEOS ────────────────────────────────────────────────────────────────
  if (activeTab === 'videos') {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Video Library</h1>
        {videos.length === 0 ? <Card className="p-8 text-center"><Video className="w-12 h-12 text-stone-300 mx-auto mb-3" /><p className="text-stone-500">No videos yet</p></Card> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map(v => (
              <Card key={v.video_id} data-testid={`video-${v.video_id}`} className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-card video-card">
                <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                  <Video className="w-12 h-12 text-stone-300" />
                  <div className="video-overlay">{v.video_url && <Button onClick={() => window.open(v.video_url, '_blank')} className="bg-white text-orange-600 rounded-full">Watch Video</Button>}</div>
                </div>
                <div className="p-4"><h3 className="font-semibold">{v.title}</h3>{v.description && <p className="text-sm text-stone-500">{v.description}</p>}</div>
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