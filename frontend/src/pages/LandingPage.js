import { useNavigate } from "react-router-dom";
import { Calendar, Video, Users, Clock, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-orange-600" strokeWidth={2} />
              <span className="text-2xl font-bold text-slate-900 font-outfit">ClassHub</span>
            </div>
            <Button
              onClick={handleLogin}
              data-testid="nav-login-btn"
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-6 py-3 rounded-full shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Login
            </Button>
          </div>
        </div>
      </nav>

      <section className="hero-section py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
            <div className="col-span-full md:col-span-6 animate-fade-left">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6 font-outfit">
                Your Virtual Classroom,
                <span className="text-orange-600"> Simplified</span>
              </h1>
              <p className="text-lg leading-relaxed text-stone-500 mb-8 font-manrope">
                Schedule classes, host live sessions with Google Meet, and manage your learning community all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleLogin}
                  data-testid="hero-get-started-btn"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-8 py-4 rounded-full shadow-sm transition-transform hover:-translate-y-0.5 text-lg"
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outline"
                  className="bg-white border border-stone-200 text-slate-900 hover:bg-stone-50 font-medium px-8 py-4 rounded-full transition-colors text-lg"
                >
                  Learn More
                </Button>
              </div>
            </div>

            <div className="col-span-full md:col-span-6 animate-fade-right">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1758685848208-e108b6af94cc?w=900&q=75&auto=format&fit=crop"
                  alt="Modern teacher using technology in a classroom"
                  width={900}
                  height={600}
                  fetchpriority="high"
                  decoding="async"
                  className="rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] w-full h-auto"
                />
                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 shadow-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-900">Live Class In Session</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 font-outfit">
              Everything You Need
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto font-manrope">
              Powerful features designed for modern online education
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="col-span-full md:col-span-8 bg-white border border-stone-100 rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 animate-fade-up">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Calendar className="w-8 h-8 text-orange-600" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2 font-outfit">Smart Scheduling</h3>
                  <p className="text-base leading-relaxed text-stone-500 font-manrope">
                    Create and manage classes with an intuitive calendar interface. Students can easily browse and enroll in upcoming sessions.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-full md:col-span-4 bg-white border border-stone-100 rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 animate-fade-up">
              <div className="p-3 bg-orange-50 rounded-xl w-fit mb-4">
                <Video className="w-8 h-8 text-orange-600" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2 font-outfit">Google Meet</h3>
              <p className="text-base leading-relaxed text-stone-500 font-manrope">
                Integrated video conferencing powered by Google Meet.
              </p>
            </div>

            <div className="col-span-full md:col-span-4 bg-white border border-stone-100 rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 animate-fade-up">
              <div className="p-3 bg-orange-50 rounded-xl w-fit mb-4">
                <Users className="w-8 h-8 text-orange-600" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2 font-outfit">Role Management</h3>
              <p className="text-base leading-relaxed text-stone-500 font-manrope">
                Separate dashboards for admins, teachers, and students.
              </p>
            </div>

            <div className="col-span-full md:col-span-8 bg-white border border-stone-100 rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 animate-fade-up">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Clock className="w-8 h-8 text-orange-600" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-900 mb-2 font-outfit">Video Library</h3>
                  <p className="text-base leading-relaxed text-stone-500 font-manrope">
                    Store class recordings and upload educational content. Students can access materials anytime, anywhere.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-orange-600">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 font-outfit">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-lg text-orange-100 mb-8 font-manrope">
            Join educators worldwide who are creating engaging online learning experiences
          </p>
          <Button
            onClick={handleLogin}
            data-testid="cta-get-started-btn"
            className="bg-white hover:bg-orange-50 text-orange-600 font-medium px-8 py-4 rounded-full shadow-sm transition-transform hover:-translate-y-0.5 text-lg"
          >
            Start Teaching Today
          </Button>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <GraduationCap className="w-6 h-6 text-orange-600" strokeWidth={2} />
              <span className="text-xl font-bold font-outfit">ClassHub</span>
            </div>
            <p className="text-stone-400 text-sm font-manrope">
              © 2026 ClassHub. Empowering online education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;