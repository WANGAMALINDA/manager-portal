import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Mail, MapPin, ShieldCheck } from "lucide-react";
import { supabase } from "../components/supabaseClient";
import { isManagerRole } from "../utils/managerAccess";
import "./ManagerLogin.css";

const SIGN_IN_ERROR_MESSAGE =
  "We couldn't sign you in. Please check your details or contact your administrator.";

const initialAdminState = {
  identifier: "",
  password: "",
};

const initialAdminErrors = {
  identifier: "",
  password: "",
};

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(initialAdminState);
  const [errors, setErrors] = useState(initialAdminErrors);
  const [authError, setAuthError] = useState(location.state?.authError || "");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!form.identifier.trim()) {
      nextErrors.identifier = "Please enter your email address.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setAuthError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setAuthError("");
    if (!validate()) return;

    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.identifier.trim(),
      password: form.password,
    });

    if (error) {
      setSubmitting(false);
      setAuthError(SIGN_IN_ERROR_MESSAGE);
      return;
    }

    if (!data.user) {
      setSubmitting(false);
      setAuthError(SIGN_IN_ERROR_MESSAGE);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !isManagerRole(profile?.role)) {
      await supabase.auth.signOut();
      setSubmitting(false);
      setAuthError(SIGN_IN_ERROR_MESSAGE);
      return;
    }

    setSubmitting(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="manager-login" aria-labelledby="manager-login-title">
      <div className="manager-login__blob manager-login__blob--one" aria-hidden="true" />
      <div className="manager-login__blob manager-login__blob--two" aria-hidden="true" />

      <section className="manager-login__card">
        <div className="manager-login__brand" aria-label="TrackServ Manager Portal">
          <span className="manager-login__brand-icon"><MapPin size={20} aria-hidden="true" /></span>
          <span className="manager-login__brand-name">Track<span>Serv</span></span>
        </div>

        <div className="manager-login__eyebrow">
          <ShieldCheck size={15} aria-hidden="true" />
          <span>Manager Portal</span>
        </div>

        <h1 id="manager-login-title">Welcome back</h1>
        <p className="manager-login__subtitle">
          Sign in to manage service reports, approvals, and municipal operations.
        </p>

        <form className="manager-login__form" onSubmit={handleSubmit} noValidate>
          {(authError || errors.identifier || errors.password) && (
            <div className="manager-login__alert" role="alert">
              {authError || errors.identifier || errors.password}
            </div>
          )}

          <div className="manager-login__field">
            <label htmlFor="identifier">Manager email</label>
            <div className="manager-login__input-wrap">
              <Mail className="manager-login__input-icon" size={18} aria-hidden="true" />
              <input
                id="identifier"
                name="identifier"
                type="email"
                placeholder="you@example.com"
                value={form.identifier}
                onChange={handleChange}
                aria-invalid={Boolean(errors.identifier)}
                aria-describedby={errors.identifier ? "identifier-error" : undefined}
                autoComplete="email"
              />
            </div>
            {errors.identifier && (
              <span className="manager-login__field-error" id="identifier-error">
                {errors.identifier}
              </span>
            )}
          </div>

          <div className="manager-login__field">
            <label htmlFor="admin-password">Password</label>
            <div className="manager-login__input-wrap">
              <KeyRound className="manager-login__input-icon" size={18} aria-hidden="true" />
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                autoComplete="current-password"
              />
              <button type="button" className="manager-login__password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="manager-login__field-error" id="password-error">
                {errors.password}
              </span>
            )}
          </div>

          <button className="manager-login__submit" type="submit" disabled={submitting}>
            {submitting ? (
              <><span className="manager-login__spinner" aria-hidden="true" /> Signing in…</>
            ) : "Sign in"}
          </button>
        </form>

        <p className="manager-login__footer">Authorized managers only</p>
      </section>
    </main>
  );
}

export default AdminLogin;