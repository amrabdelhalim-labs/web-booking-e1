/**
 * Login Page
 *
 * Provides a login form for user authentication.
 * On successful login, stores token and redirects to events page.
 *
 * TODO: Implement full login functionality (Phase 4.2)
 */

import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { LOGIN } from "../graphql/queries";
import AuthContext from "../context/auth-context";
import Error from "../components/Error";
import Spinner from "../components/Spinner";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [alert, setAlert] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [loginMutation, { loading, data }] = useMutation(LOGIN, {
    onError: (error) => setAlert(error.message),
  });

  useEffect(() => {
    if (!loading && data) {
      const { token, userId, username } = data.login;
      login(token, userId, username);
    }
  }, [data, loading, login]);

  if (loading) return <Spinner />;

  return (
    <form
      className="auth-form"
      onSubmit={(event) => {
        event.preventDefault();
        loginMutation({
          variables: { email: email.trim(), password: password.trim() },
        });
      }}
    >
      <Error error={alert} />
      <div className="mb-3 mt-2">
        <label className="form-label" htmlFor="email">
          البريد الالكتروني
        </label>
        <input
          className="form-control"
          id="email"
          type="email"
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          required
        />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="password">
          كلمة المرور
        </label>
        <input
          className="form-control"
          id="password"
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          type="password"
          required
          minLength={6}
        />
      </div>
      <div className="form-actions">
        <button className="btn m-2" type="submit">
          إرسال
        </button>
        <button className="btn" onClick={() => navigate("/signup")}>
          انتقل إلى إنشاء حساب
        </button>
      </div>
    </form>
  );
}
