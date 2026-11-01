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
    <main style={{ height: "100%", overflowY: "auto", padding: "28px clamp(16px, 3vw, 36px)", background: "#f3f4f6" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 20 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 5px", color: "#047857", fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>
              Manager workspace
            </p>
            <h1 style={{ margin: 0, color: "#111827", fontSize: 28 }}>My profile</h1>
            <p style={{ margin: "7px 0 0", color: "#6b7280" }}>Your account details and live service-report overview.</p>
          </div>
          {!editing ? (
            <button type="button" onClick={() => { setDraft(profile); setEditing(true); setErrorMessage(""); setSuccessMessage(""); }}
              style={buttonStyle("#047857")}>
              <Pencil size={16} /> Edit profile
            </button>
          ) : null}
        </header>

        {errorMessage ? (
          <div role="alert" style={{ padding: "12px 16px", borderRadius: 10, background: "#fef2f2", color: "#991b1b" }}>
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div role="status" style={{ padding: "12px 16px", borderRadius: 10, background: "#ecfdf5", color: "#047857" }}>
            {successMessage}
          </div>
        ) : null}

        <section style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", background: "#d1fae5", color: "#047857", fontSize: 24, fontWeight: 700 }}>
              {profile.profile_picture
                ? <img src={profile.profile_picture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials || <UserRound size={32} />}
            </div>
            <div style={{ flex: "1 1 260px" }}>
              <h2 style={{ margin: "0 0 5px", color: "#111827", fontSize: 22 }}>{displayName}</h2>
              <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 999, background: "#ecfdf5", color: "#047857", fontSize: 12, fontWeight: 700 }}>
                {roleLabel(profile.role)}
              </span>
            </div>
            <div style={{ display: "grid", gap: 9, color: "#4b5563", fontSize: 14 }}>
              <span style={detailStyle}><Mail size={16} />{profile.email || "Email not set"}</span>
              <span style={detailStyle}><CalendarDays size={16} />Member since {formatMemberSince(profile.created_at)}</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="manager-stats-title">
          <div style={{ marginBottom: 12 }}>
            <h2 id="manager-stats-title" style={{ margin: 0, color: "#111827", fontSize: 18 }}>Service report statistics</h2>
            <p style={{ margin: "5px 0 0", color: "#6b7280", fontSize: 13 }}>Live counts across reports visible to the Manager Portal.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {STAT_DEFINITIONS.map(({ key, label, Icon, color, background }) => (
              <article key={key} style={{ ...cardStyle, padding: 16 }}>
                <span style={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: 9, color, background }}>
                  <Icon size={18} />
                </span>
                <p style={{ margin: "14px 0 2px", color: "#111827", fontSize: 25, fontWeight: 750 }}>
                  {stats?.[key] ?? 0}
                </p>
                <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>{label}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, color: "#111827", fontSize: 18 }}>Contact details</h2>
              <p style={{ margin: "5px 0 0", color: "#6b7280", fontSize: 13 }}>Keep your manager profile information up to date.</p>
            </div>
            {editing ? (
              <button type="button" onClick={() => { setDraft(profile); setEditing(false); setErrorMessage(""); }} style={buttonStyle("#4b5563")}>
                <X size={16} /> Cancel
              </button>
            ) : null}
          </div>

          {editing ? (
            <form onSubmit={saveProfile} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <label style={fieldLabel}>Full name
                <input name="full_name" value={draft.full_name || ""} onChange={updateDraft} required maxLength={120} style={inputStyle} />
              </label>
              <label style={fieldLabel}>Phone
                <input name="phone" type="tel" value={draft.phone || ""} onChange={updateDraft} style={inputStyle} />
              </label>
              <label style={fieldLabel}>Office / service area
                <input name="location" value={draft.location || ""} onChange={updateDraft} style={inputStyle} />
              </label>
              <label style={{ ...fieldLabel, gridColumn: "1 / -1" }}>About
                <textarea name="about" value={draft.about || ""} onChange={updateDraft} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
              <button type="submit" disabled={saving} style={{ ...buttonStyle("#047857"), gridColumn: "1 / -1", justifySelf: "start", opacity: saving ? 0.65 : 1 }}>
                <Save size={16} />{saving ? "Saving..." : "Save profile"}
              </button>
            </form>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
              <span style={detailStyle}><UserRound size={17} />{profile.full_name || "Name not set"}</span>
              <span style={detailStyle}><Phone size={17} />{profile.phone || "Phone not set"}</span>
              <span style={detailStyle}><MapPin size={17} />{profile.location || "Service area not set"}</span>
              {profile.about ? <p style={{ gridColumn: "1 / -1", margin: 0, color: "#4b5563", lineHeight: 1.6 }}>{profile.about}</p> : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 20,
  boxShadow: "0 1px 3px rgba(17, 24, 39, .05)",
};

const buttonStyle = (background) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  border: 0,
  borderRadius: 9,
  padding: "10px 15px",
  background,
  color: "#fff",
  fontSize: 14,
  fontWeight: 650,
  cursor: "pointer",
});

const detailStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 9,
  color: "#4b5563",
  fontSize: 14,
};

const fieldLabel = {
  display: "grid",
  gap: 7,
  color: "#374151",
  fontSize: 13,
  fontWeight: 650,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "10px 12px",
  color: "#111827",
  font: "inherit",
  fontWeight: 400,
};

export default Profile;
