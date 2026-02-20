/**
 * Login Page
 *
 * Provides a login form for user authentication via GraphQL mutation.
 * On successful login, stores auth data in context and localStorage,
 * then navigates to the events page.
 *
 * Features:
 * - Email and password validation
 * - Loading spinner during mutation
 * - Error alert on failure
 * - Navigation link to sign up page
 */

import { useState, useContext, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { LOGIN } from "../graphql/queries";
import AuthContext from "../context/auth-context";
import Error from "../components/Error";
import Spinner from "../components/Spinner";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [alert, setAlert] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginMutation, { loading, data }] = useMutation(LOGIN, {
    onError: (error) => setAlert(error.message),
  });

  useEffect(() => {
    if (!loading && data) {
      const { token, userId, username } = data.login;
      login(token, userId, username);
      navigate("/events", { replace: true });
    }
  }, [data, loading, login, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAlert("");
    loginMutation({
      variables: { email: email.trim(), password: password.trim() },
    });
  };

  if (loading) return <Spinner />;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Error error={alert} />

      <div className="mb-3 mt-2">
        <label className="form-label" htmlFor="login-email">
          البريد الالكتروني
        </label>
        <input
          className="form-control"
          id="login-email"
          type="email"
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="login-password">
          كلمة المرور
        </label>
        <input
          className="form-control"
          id="login-password"
          type="password"
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          required
          minLength={6}
          autoComplete="current-password"
        />
      </div>

      <div className="form-actions">
        <button className="btn m-2" type="submit">
          تسجيل الدخول
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => navigate("/signup")}
        >
          انتقل إلى إنشاء حساب
        </button>
      </div>
    </form>
  );
}
