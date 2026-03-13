"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { authAPI } from "@/services/auth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import toast from "react-hot-toast";

type GoogleCredentialResponse = {
  credential: string;
};

type ApiErrorShape = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      id?: {
        initialize: (config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: "outline" | "filled_blue" | "filled_black";
            size?: "large" | "medium" | "small";
            width?: number;
            text?: "signin_with" | "signup_with" | "continue_with";
            shape?: "rectangular" | "pill";
          }
        ) => void;
      };
    };
  };
};

export default function AuthPage() {
  const { login, register, googleLogin } = useAuth();
  const router = useRouter();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(
    "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerUserType, setRegisterUserType] = useState("professional");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown, fallback: string) => {
    const detail = (err as ApiErrorShape)?.response?.data?.detail;
    return detail || fallback;
  };

  useEffect(() => {
    if (!googleClientId || googleInitializedRef.current || !googleButtonRef.current) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      const win = window as GoogleWindow;
      const googleAccounts = win.google?.accounts?.id;

      if (!googleAccounts || !googleButtonRef.current) {
        return;
      }

      googleAccounts.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          if (!response?.credential) {
            setError("Google sign-in did not return a credential");
            return;
          }

          try {
            setLoading(true);
            setError(null);
            await googleLogin(response.credential);
            toast.success("Logged in with Google");
            router.push("/dashboard");
          } catch (err: unknown) {
            setError(getErrorMessage(err, "Google sign-in failed"));
          } finally {
            setLoading(false);
          }
        },
      });

      googleButtonRef.current.innerHTML = "";
      googleAccounts.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: Math.min(320, googleButtonRef.current.clientWidth || 320),
        text: "continue_with",
        shape: "pill",
      });

      googleInitializedRef.current = true;
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [googleClientId, googleLogin, router]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mode === "login") {
        await login(email, password);
        router.push("/dashboard");
        return;
      }

      if (mode === "register") {
        await register(email, password, registerUserType);
        toast.success("Account created. Please log in.");
        setMode("login");
        setPassword("");
        return;
      }

      if (mode === "forgot") {
        await authAPI.forgotPassword({ email });
        toast.success("Reset token sent. Check your email.");
        setMode("reset");
        return;
      }

      if (mode === "reset") {
        await authAPI.resetPassword({
          token: resetToken,
          new_password: newPassword,
        });
        toast.success("Password updated. Please log in.");
        setMode("login");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.28em] text-(--muted) sm:tracking-[0.4em]">
              Secure onboarding
            </p>
            <h1 className="text-3xl font-semibold text-(--ink-1) sm:text-4xl">
              Access the FinPilot control room.
            </h1>
            <p className="text-base text-(--muted)">
              Authenticate with your email and keep control of every
              autonomous decision. You can reset your password anytime.
            </p>
            <div className="rounded-2xl bg-(--surface-2) p-6 text-sm text-(--muted)">
              <p className="font-semibold text-(--ink-1)">What you get</p>
              <ul className="mt-3 space-y-2">
                <li>Live dashboard with autonomy status</li>
                <li>Replayable decisions with full audit logs</li>
                <li>Portfolio intelligence built into every run</li>
              </ul>
            </div>
          </div>

          <Card className="rounded-3xl">
            <div className="grid grid-cols-3 gap-2 text-sm font-medium">
              {["login", "register"].map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 rounded-full px-4 py-2 ${
                    mode === tab
                      ? "bg-(--brand-1) text-black"
                      : "bg-(--surface-2) text-(--ink-2)"
                  }`}
                  onClick={() => setMode(tab as "login" | "register")}
                >
                  {tab === "login" ? "Login" : "Register"}
                </button>
              ))}
              <button
                className={`rounded-full px-4 py-2 ${
                  mode === "forgot" || mode === "reset"
                    ? "bg-(--brand-2) text-black"
                    : "bg-(--surface-2) text-(--ink-2)"
                }`}
                onClick={() => setMode("forgot")}
              >
                Reset
              </button>
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-(--ink-1)">
              {mode === "login" && "Welcome back"}
              {mode === "register" && "Create an account"}
              {mode === "forgot" && "Request a reset"}
              {mode === "reset" && "Set new password"}
            </h2>

            {error && (
              <div className="mt-4 rounded-xl bg-rose-100 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="mt-6 space-y-4">
              {(mode === "login" || mode === "register" || mode === "forgot") && (
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}

              {(mode === "login" || mode === "register") && (
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}

              {mode === "register" && (
                <select
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900"
                  value={registerUserType}
                  onChange={(event) => setRegisterUserType(event.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="professional">Professional</option>
                  <option value="organisation">Organisation - Very Soon </option>
                </select>
              )}

              {mode === "reset" && (
                <>
                  <input
                    type="text"
                    placeholder="Reset token"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </>
              )}

              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading
                  ? "Processing..."
                  : mode === "login"
                  ? "Login"
                  : mode === "register"
                  ? "Create account"
                  : mode === "forgot"
                  ? "Send reset"
                  : "Update password"}
              </Button>

              {(mode === "login" || mode === "register") && (
                <>
                  <div className="text-center text-xs text-(--muted)">or</div>
                  {googleClientId ? (
                    <div className="flex justify-center">
                      <div ref={googleButtonRef} className="w-full max-w-[320px]" />
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-100 p-3 text-xs text-amber-800">
                      Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend env to enable Google sign-in.
                    </div>
                  )}
                </>
              )}

              {mode === "login" && (
                <button
                  className="text-xs text-(--muted)"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
