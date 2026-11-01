import { useState, useEffect, useCallback, useRef } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './components/supabaseClient'
import AdminLogin from './pages/AdminLogin'
import ReportsPage from './pages/ReportsPage'
import AssignmentsPage from './pages/AssignmentsPage'
import AnalysisPage from './pages/AnalysisPage'
import AdminLocations from './pages/AdminLocations'
import Profile from './pages/Profile'
import Sidebar from './components/Sidebar'
import { isManagerRole } from './utils/managerAccess'
import './App.css';

const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function useIdleLogout(timeoutMs) {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleLogout, timeoutMs);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start the timer on mount

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [timeoutMs, handleLogout]);
}

function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.split('/').filter(Boolean)[1] || 'dashboard';

  // Auto log out after 5 minutes of no user activity.
  useIdleLogout(SESSION_TIMEOUT_MS);

  const content = activePage === 'profile'
    ? <Profile />
    : activePage === 'assignments'
    ? <AssignmentsPage selectedCategory={selectedCategory} />
    : activePage === 'analysis'
    ? <AnalysisPage />
    : activePage === 'reports'
    ? (
        <ReportsPage 
          selectedCategory={selectedCategory} 
          onCategoryChange={setSelectedCategory} 
        />
      )
    : <AdminLocations />;

  return (
    <Sidebar
      activePage={activePage}
      onPageChange={(page) => navigate(`/dashboard/${page}`)}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
    >
      {content}
    </Sidebar>
  );
}

function ManagerRoute() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function verifyManagerAccess() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authError || !user) {
        await supabase.auth.signOut();
        if (!cancelled) navigate("/", { replace: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError) {
        await supabase.auth.signOut();
        navigate("/", { replace: true, state: { authError: "Unable to verify manager access. Please contact an administrator." } });
        return;
      }

      if (!isManagerRole(profile?.role)) {
        await supabase.auth.signOut();
        navigate("/", { replace: true, state: { authError: "Only manager accounts can access this portal." } });
        return;
      }

      setCheckingAccess(false);
    }

    verifyManagerAccess();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checkingAccess) {
    return <main aria-live="polite" style={{ padding: 32, textAlign: "center" }}>Verifying manager access...</main>;
  }

  return <Dashboard />;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AdminLogin />} />
        <Route path="/dashboard/*" element={<ManagerRoute />} />
        {/* Any unrecognized path (e.g. a stale/bad link) falls back to login
            instead of rendering a blank screen. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;