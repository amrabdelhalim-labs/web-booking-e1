/**
 * Sign Up Page
 *
 * Provides a registration form for new users.
 * On successful registration, stores token and redirects.
 *
 * TODO: Implement full signup functionality (Phase 4.2)
 */

import { useState, useContext, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_USER } from "../graphql/queries";
import AuthContext from "../context/auth-context";
import Error from "../components/Error";
import Spinner from "../components/Spinner";

export default function SignUpPage() {
  const { login } = useContext(AuthContext);
  const [alert, setAlert] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [signup, { loading, data }] = useMutation(CREATE_USER, {
    onError: (error) => setAlert(error.message),
    onCompleted: () => setAlert("تم إنشاء الحساب بنجاح"),
  });

  useEffect(() => {
    if (!loading && data) {
      const { token, userId, username: uname } = data.createUser;
      login(token, userId, uname);
    }
  }, [data, loading, login]);

  if (loading) return <Spinner />;

  return (
    <form
      className="auth-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (username.trim().length < 3 || password.trim().length < 6) {
          setAlert("يجب ملئ جميع الحقول بالشكل الصحيح!");
          return;
        }
        signup({
          variables: {
            username: username.trim(),
            email: email.trim(),
            password: password.trim(),
          },
        });
      }}
    >
      <Error error={alert} />
      <div className="mb-3 mt-2">
        <label className="form-label" htmlFor="username">
          اسم المستخدم
        </label>
        <input
          className="form-control"
          id="username"
          value={username}
          onChange={({ target }) => setUsername(target.value)}
          required
        />
      </div>
      <div className="mb-3">
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
        <button type="submit" className="btn">
          إرسال
        </button>
      </div>
    </form>
  );
}
