"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopNav from "@/components/TopNav";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { authAPI } from "@/services/auth";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, updateUserType } = useAuth();
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userType, setUserType] = useState(user?.user_type || "professional");
  const [updatingUserType, setUpdatingUserType] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.user_type) {
      setUserType(user.user_type);
    }
  }, [user?.user_type]);

  const hasUserTypeChanged = (user?.user_type || "professional") !== userType;

  const handleUserTypeUpdate = async () => {
    try {
      setUpdatingUserType(true);
      await updateUserType(userType);
      toast.success("User type updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Unable to update user type");
    } finally {
      setUpdatingUserType(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      await authAPI.resetPassword({ token: resetToken, new_password: newPassword });
      toast.success("Password updated");
      setResetToken("");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Unable to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                Account
              </p>
              <h1 className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
                Settings
              </h1>
            </div>

            <Card>
              <h2 className="text-lg font-semibold text-(--ink-1)">Profile</h2>
              <div className="mt-4 grid gap-4 text-sm text-(--muted)">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>Email</span>
                  <span className="font-semibold text-(--ink-1)">
                    {user?.email || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>Provider</span>
                  <span className="font-semibold text-(--ink-1)">
                    {user?.provider || "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span>User type</span>
                  <span className="font-semibold text-(--ink-1)">
                    {user?.user_type || "-"}
                  </span>
                </div>
                <div className="grid gap-2">
                  <span>User type preference</span>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <select
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-gray-900 md:max-w-sm"
                      value={userType}
                      onChange={(event) => setUserType(event.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="freelancer">Freelancer</option>
                      <option value="professional">Professional</option>
                      <option value="organisation">Organisation - Very Soon </option>
                    </select>
                    <Button
                      onClick={handleUserTypeUpdate}
                      disabled={updatingUserType || !hasUserTypeChanged}
                    >
                      {updatingUserType ? "Saving..." : "Save user type"}
                    </Button>
                  </div>
                  <p className="text-xs text-(--muted)">
                    Run cycle will use this saved user type automatically.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-(--ink-1)">
                Reset password
              </h2>
              <p className="mt-2 text-sm text-(--muted)">
                Use the reset token from the Forgot Password flow.
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <input
                  placeholder="Reset token"
                  className="rounded-2xl border border-black/10 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                  value={resetToken}
                  onChange={(event) => setResetToken(event.target.value)}
                />
                <input
                  type="password"
                  placeholder="New password"
                  className="rounded-2xl border border-black/10 px-4 py-3 text-gray-900 placeholder:text-gray-400"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="mt-4">
                <Button onClick={handleReset} disabled={loading}>
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
