/**
 * Sign Up Page
 *
 * Provides a registration form for new users via GraphQL mutation.
 * On successful registration, stores auth data in context and localStorage,
 * then navigates to the events page.
 *
 * Features:
 * - Username (min 3 chars), email, and password (min 6 chars) validation
 * - Loading spinner during mutation
 * - Error/success alert feedback
 * - Navigation link to login page
 */

import { useState, useContext, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { CREATE_USER } from "../graphql/queries";
import AuthContext from "../context/auth-context";
import Alert from "../components/Alert";
import Spinner from "../components/Spinner";

export default function SignUpPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [alert, setAlert] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signup, { loading, data }] = useMutation(CREATE_USER, {
    onError: (error) => setAlert(error.message),
  });

  useEffect(() => {
    if (!loading && data) {
      const { token, userId, username: uname } = data.createUser;
      login(token, userId, uname);
      navigate("/events", { replace: true });
    }
  }, [data, loading, login, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAlert("");

    if (username.trim().length < 3) {
      setAlert("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
      return;
    }
    if (password.trim().length < 6) {
      setAlert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    signup({
      variables: {
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
      },
    });
  };

  if (loading) return <Spinner />;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Alert message={alert} />

      <div className="mb-3 mt-2">
        <label className="form-label" htmlFor="signup-username">
          اسم المستخدم
        </label>
        <input
          className="form-control"
          id="signup-username"
          type="text"
          value={username}
          onChange={({ target }) => setUsername(target.value)}
          required
          minLength={3}
          autoComplete="username"
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="signup-email">
          البريد الالكتروني
        </label>
        <input
          className="form-control"
          id="signup-email"
          type="email"
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="signup-password">
          كلمة المرور
        </label>
        <input
          className="form-control"
          id="signup-password"
          type="password"
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <div className="form-actions">
        <button className="btn m-2" type="submit">
          إنشاء حساب
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => navigate("/login")}
        >
          انتقل إلى تسجيل الدخول
        </button>
      </div>
    </form>
  );
}
