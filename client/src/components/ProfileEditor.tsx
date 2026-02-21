/**
 * Profile Editor Component
 *
 * A modal dialog for editing the authenticated user's profile.
 * Allows updating username and/or password.
 * Also provides a "delete account" action with confirmation.
 *
 * Uses the reusable SimpleModal component.
 * Server mutations: UPDATE_USER, DELETE_USER
 *
 * Features:
 * - Edit username (pre-filled with current value)
 * - Edit password (optional, only sent if provided)
 * - Delete account with confirmation step
 * - Error/success feedback via Alert component
 */

import { useState, useContext } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_USER, DELETE_USER } from "../graphql/queries";
import AuthContext from "../context/auth-context";
import SimpleModal from "./SimpleModal";
import Alert from "./Alert";
import Spinner from "./Spinner";
import Button from "react-bootstrap/Button";

interface ProfileEditorProps {
  /** Callback to close the modal */
  onClose: () => void;
}

export default function ProfileEditor({ onClose }: ProfileEditorProps) {
  const { username: currentUsername, login, logout } = useContext(AuthContext);

  const [newUsername, setNewUsername] = useState(currentUsername ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [alert, setAlert] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ─── Update User Mutation ───────────────────────────────────────────────

  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER, {
    onError: (error) => setAlert(error.message),
    onCompleted: (data) => {
      const { username: updatedName } = data.updateUser;
      // Re-sync the context and localStorage with the new username
      const token = localStorage.getItem("token") ?? "";
      const userId = localStorage.getItem("userId") ?? "";
      login(token, userId, updatedName);
      setAlert("تم تحديث البيانات بنجاح");
    },
  });

  // ─── Delete User Mutation ───────────────────────────────────────────────

  const [deleteUser, { loading: deleting }] = useMutation(DELETE_USER, {
    onError: (error) => setAlert(error.message),
    onCompleted: () => {
      logout();
      onClose();
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleSave = () => {
    const trimmedName = newUsername.trim();
    const trimmedPass = newPassword.trim();

    if (trimmedName.length < 3) {
      setAlert("اسم المستخدم يجب أن يكون 3 أحرف على الأقل");
      return;
    }

    if (trimmedPass && trimmedPass.length < 6) {
      setAlert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    const variables: { username?: string; password?: string } = {};
    if (trimmedName !== currentUsername) variables.username = trimmedName;
    if (trimmedPass) variables.password = trimmedPass;

    if (Object.keys(variables).length === 0) {
      setAlert("لم يتم إجراء أي تغيير");
      return;
    }

    updateUser({ variables });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setAlert("اضغط على زر حذف الحساب مرة أخرى للتأكيد");
      return;
    }
    deleteUser();
  };

  if (updating || deleting) {
    return (
      <SimpleModal
        title="تعديل البيانات"
        onConfirm={() => {}}
        onCancel={onClose}
        confirmText="حفظ"
        isDisabled
      >
        <Spinner />
      </SimpleModal>
    );
  }

  return (
    <SimpleModal
      title="تعديل البيانات"
      onConfirm={handleSave}
      onCancel={() => {
        setConfirmDelete(false);
        onClose();
      }}
      confirmText="حفظ التعديلات"
      footerExtra={
        <Button
          variant="danger"
          onClick={handleDelete}
          className="me-auto"
        >
          {confirmDelete ? "تأكيد حذف الحساب" : "حذف الحساب"}
        </Button>
      }
    >
      <Alert message={alert} />

      <div className="mb-3">
        <label className="form-label" htmlFor="profile-username">
          اسم المستخدم
        </label>
        <input
          className="form-control"
          id="profile-username"
          type="text"
          value={newUsername}
          onChange={({ target }) => setNewUsername(target.value)}
          required
          minLength={3}
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="profile-password">
          كلمة المرور الجديدة
        </label>
        <input
          className="form-control"
          id="profile-password"
          type="password"
          value={newPassword}
          onChange={({ target }) => setNewPassword(target.value)}
          placeholder="اتركه فارغاً إذا لم ترد التغيير"
          minLength={6}
        />
      </div>
    </SimpleModal>
  );
}
