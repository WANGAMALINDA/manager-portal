import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../components/supabaseClient";
import { isManagerRole, roleLabel } from "../utils/managerAccess";
import "./Profile.css";

const EMPTY_PROFILE = {
  full_name: "",
  username: "",
  email: "",
  phone: "",
  location: "",
  about: "",
  profile_picture: "",
  created_at: "",
  role: "",
};

const STAT_DEFINITIONS = [
  { key: "total", label: "Total reports", Icon: ClipboardList, color: "#047857", background: "#ecfdf5" },
  { key: "awaitingReview", label: "Awaiting review", Icon: AlertCircle, color: "#b45309", background: "#fffbeb" },
  { key: "inProgress", label: "In progress", Icon: Clock3, color: "#1d4ed8", background: "#eff6ff" },
  { key: "resolved", label: "Resolved", Icon: CheckCircle2, color: "#15803d", background: "#f0fdf4" },
  { key: "unassigned", label: "Unassigned", Icon: UserRound, color: "#6d28d9", background: "#f5f3ff" },
];

function formatMemberSince(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function Profile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [draft, setDraft] = useState(EMPTY_PROFILE);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfileAndStats() {
      setLoading(true);
      setErrorMessage("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        if (!cancelled) {
          setErrorMessage(authError?.message || "Sign in with a manager account to view this profile.");
          setLoading(false);
        }
        return;
      }

      const [profileResult, totalResult, reviewResult, progressResult, resolvedResult, unassignedResult] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("reports").select("id", { count: "exact", head: true }),
          supabase.from("reports").select("id", { count: "exact", head: true }).in("status", ["open", "under_review"]),
          supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
          supabase.from("reports").select("id", { count: "exact", head: true }).in("status", ["resolved", "closed"]),
          supabase.from("reports").select("id", { count: "exact", head: true })
            .in("status", ["open", "under_review", "in_progress"])
            .is("assigned_to", null)
            .is("assigned_to_group_id", null),
        ]);

      if (cancelled) return;

      if (profileResult.error) {
        setErrorMessage(`Couldn't load your profile: ${profileResult.error.message}`);
        setLoading(false);
        return;
      }

      if (!profileResult.data) {
        setErrorMessage("Your manager profile could not be found. Contact an administrator for assistance.");
        setLoading(false);
        return;
      }

      if (!isManagerRole(profileResult.data.role)) {
        setErrorMessage("This profile is not assigned the manager role.");
        setLoading(false);
        return;
      }

      const failedStats = [
        totalResult,
        reviewResult,
        progressResult,
        resolvedResult,
        unassignedResult,
      ].find((result) => result.error);

      if (failedStats) {
        setErrorMessage(`Couldn't load report statistics: ${failedStats.error.message}`);
        setLoading(false);
        return;
      }

      const loadedProfile = {
        ...EMPTY_PROFILE,
        ...profileResult.data,
        email: profileResult.data.email || user.email || "",
      };

      setProfile(loadedProfile);
      setDraft(loadedProfile);
      setStats({
        total: totalResult.count ?? 0,
        awaitingReview: reviewResult.count ?? 0,
        inProgress: progressResult.count ?? 0,
        resolved: resolvedResult.count ?? 0,
        unassigned: unassignedResult.count ?? 0,
      });
      setLoading(false);
    }

    loadProfileAndStats();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateDraft(event) {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const updates = {
      full_name: draft.full_name.trim(),
      phone: draft.phone.trim(),
      location: draft.location.trim(),
      about: draft.about.trim(),
    };
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setErrorMessage(authError?.message || "Your session has expired. Sign in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      setErrorMessage(`Couldn't save your profile: ${error.message}`);
      setSaving(false);
      return;
    }

    setProfile((current) => ({ ...current, ...updates }));
    setDraft((current) => ({ ...current, ...updates }));
    setEditing(false);
    setSuccessMessage("Profile updated.");
    setSaving(false);
  }

  if (loading) {
    return <main aria-live="polite" style={{ padding: 32, color: "#6b7280" }}>Loading manager profile...</main>;
  }

  if (errorMessage && !profile.id) {
    return (
      <main role="alert" style={{ maxWidth: 760, margin: "32px auto", padding: 24, background: "#fff", borderRadius: 12, color: "#991b1b" }}>
        {errorMessage}
      </main>
    );
  }

  const displayName = profile.full_name || profile.username || profile.email || "Manager";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <main className="manager-profile-page">
      <div className="manager-profile-content">
        <header className="manager-profile-heading">
          <div>
            <p className="manager-profile-eyebrow">Manager workspace</p>
            <h1>My profile</h1>
            <p className="manager-profile-subtitle">Your account details and service-report overview.</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(profile);
                setEditing(true);
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="manager-profile-button manager-profile-button-primary"
            >
              <Pencil size={16} /> Edit profile
            </button>
          )}
        </header>

        {errorMessage && (
          <div className="manager-profile-notice is-error" role="alert">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="manager-profile-notice is-success" role="status">{successMessage}</div>
        )}

        <section className="manager-profile-hero" aria-label="Profile summary">
          <div className="manager-profile-avatar">
            {profile.profile_picture
              ? <img src={profile.profile_picture} alt={`${displayName} profile`} />
              : initials || <UserRound size={34} />}
          </div>
          <div className="manager-profile-identity">
            <span className="manager-profile-role">{roleLabel(profile.role)}</span>
            <h2>{displayName}</h2>
            <p>{profile.about || "Add a short introduction to your manager profile."}</p>
          </div>
          <div className="manager-profile-hero-meta">
            <span><Mail size={16} />{profile.email || "Email not set"}</span>
            <span><CalendarDays size={16} />Member since {formatMemberSince(profile.created_at)}</span>
          </div>
        </section>

        <section className="manager-profile-stats-section" aria-labelledby="manager-stats-title">
          <div className="manager-profile-section-heading">
            <div>
              <h2 id="manager-stats-title">Service report statistics</h2>
              <p>Live counts across reports visible to the Manager Portal.</p>
            </div>
          </div>
          <div className="manager-profile-stats">
            {STAT_DEFINITIONS.map(({ key, label, Icon, color, background }) => (
              <article className="manager-profile-stat" key={key}>
                <span className="manager-profile-stat-icon" style={{ color, background }}>
                  <Icon size={18} />
                </span>
                <div>
                  <p>{stats?.[key] ?? 0}</p>
                  <span>{label}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="manager-profile-details-grid">
          <section className="manager-profile-card">
            <div className="manager-profile-card-heading">
              <div>
                <h2>Contact details</h2>
                <p>Keep your manager profile information up to date.</p>
              </div>
              {editing && (
                <button
                  type="button"
                  className="manager-profile-button manager-profile-button-muted"
                  onClick={() => {
                    setDraft(profile);
                    setEditing(false);
                    setErrorMessage("");
                  }}
                  disabled={saving}
                >
                  <X size={16} /> Cancel
                </button>
              )}
            </div>

            {editing ? (
              <form className="manager-profile-form" onSubmit={saveProfile}>
                <label>
                  Full name
                  <input name="full_name" value={draft.full_name || ""} onChange={updateDraft} required maxLength={120} />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" value={draft.phone || ""} onChange={updateDraft} maxLength={40} />
                </label>
                <label className="manager-profile-form-wide">
                  Office / service area
                  <input name="location" value={draft.location || ""} onChange={updateDraft} maxLength={160} />
                </label>
                <label className="manager-profile-form-wide">
                  About
                  <textarea name="about" value={draft.about || ""} onChange={updateDraft} rows={4} maxLength={500} />
                </label>
                <div className="manager-profile-form-actions manager-profile-form-wide">
                  <button type="submit" disabled={saving} className="manager-profile-button manager-profile-button-primary">
                    <Save size={16} />{saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="manager-profile-contact-list">
                <div><Phone size={17} /><span><small>Phone</small>{profile.phone || "Not provided"}</span></div>
                <div><MapPin size={17} /><span><small>Office / service area</small>{profile.location || "Not provided"}</span></div>
                <div className="manager-profile-about">
                  <UserRound size={17} />
                  <span><small>About</small>{profile.about || "No introduction added yet."}</span>
                </div>
              </div>
            )}
          </section>

          <aside className="manager-profile-card manager-profile-account-card">
            <div className="manager-profile-card-heading">
              <div>
                <h2>Account overview</h2>
                <p>Your account information.</p>
              </div>
            </div>
            <dl>
              <div><dt>Account name</dt><dd>{profile.full_name || "Name not set"}</dd></div>
              <div><dt>Email address</dt><dd>{profile.email || "Email not set"}</dd></div>
              <div><dt>Username</dt><dd>{profile.username || "Not set"}</dd></div>
              <div><dt>Account type</dt><dd>{roleLabel(profile.role)}</dd></div>
              <div><dt>Member since</dt><dd>{formatMemberSince(profile.created_at)}</dd></div>
            </dl>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Profile;
