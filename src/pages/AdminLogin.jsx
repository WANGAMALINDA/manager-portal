import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../components/supabaseClient";
import { isManagerRole } from "../utils/managerAccess";
import "./AdminLogin.css";

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
      nextErrors.identifier = "Manager email is required.";
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
      setAuthError("Invalid credentials. Please check your manager email and password.");
      return;
    }

    if (!data.user) {
      setSubmitting(false);
      setAuthError("Sign-in succeeded without a user session. Please try again.");
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
      setAuthError(profileError
        ? "Unable to verify manager access. Please try again."
        : "Only manager accounts can sign in to this portal.");
      return;
    }

    setSubmitting(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card" role="main" aria-labelledby="admin-login-title">
        <div className="admin-auth-header">

          <div>
            <div className="admin-lozenge">
              <span className="admin-lozenge-dot" aria-hidden="true" />
              <span className="admin-lozenge-text">Manager Portal</span>
            </div>

            <h1 id="admin-login-title" className="admin-auth-title">
              Secure Manager Portal Login
            </h1>
            <p className="admin-auth-copy">
              Sign in with your municipal manager credentials to manage service reports, approvals,
              and internal dashboards.
            </p>
          </div>
        </div>

        <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-field-group">
            <label htmlFor="identifier">Manager email</label>
            <input
              id="identifier"
              name="identifier"
              type="email"
              placeholder="manager@example.gov"
              value={form.identifier}
              onChange={handleChange}
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? "identifier-error" : undefined}
              autoComplete="email"
            />
            {errors.identifier && (
              <span className="field-error" id="identifier-error">
                {errors.identifier}
              </span>
            )}
          </div>

          <div className="admin-field-group">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-password-row">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your secure password"
                value={form.password}
                onChange={handleChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="field-error" id="password-error">
                {errors.password}
              </span>
            )}
          </div>

          <div className="admin-actions">
            <div />
          </div>

          {authError && (
            <span className="field-error" role="alert">
              {authError}
            </span>
          )}

          <button className="admin-auth-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="admin-notice">
          Only accounts assigned the manager role may use this portal. User registration is not available here.
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;