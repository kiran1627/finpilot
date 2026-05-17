"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import TopNav from "@/components/TopNav";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AgentExecutionDisplay from "../../components/agent-execution-display";
import { autonomyAPI } from "@/services/autonomy";
import { bankAPI } from "@/services/bank";
import {
  AutonomyRequest,
  SandboxBankProfile,
  SandboxVerifyRequest,
  SandboxVerifyResponse,
} from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

const getLastExecutionKey = (userId?: string) =>
  userId ? `lastAutonomyExecution:${userId}` : "lastAutonomyExecution";

const defaultValues: AutonomyRequest = {
  current_balance: 50000,
  min_balance: 10000,
  incomes: [
    {
      name: "Salary",
      amount: 8000,
      timing: "monthly",
      nature: "fixed",
    },
  ],
  expenses: [
    {
      name: "Rent",
      amount: 2000,
      timing: "monthly",
      nature: "fixed",
      mandatory: true,
    },
  ],
  upcoming_events: [
    {
      name: "Medical bill",
      day: 15,
      amount: 1200,
    },
  ],
  autonomy_enabled: true,
  user_type: "professional",
  investment_policy: {
    max_investment_pct: 50,
  },
};

export default function SetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showAgentExecution, setShowAgentExecution] = useState(false);
  const [isArmingRun, setIsArmingRun] = useState(false);
  const [armSecondsLeft, setArmSecondsLeft] = useState(10);
  const [isRunArmed, setIsRunArmed] = useState(false);
  const [hasReviewedPreview, setHasReviewedPreview] = useState(false);
  const [balanceInputMode, setBalanceInputMode] = useState<"manual" | "sandbox">("manual");
  const [isLinkingBank, setIsLinkingBank] = useState(false);
  const [isVerifyingBank, setIsVerifyingBank] = useState(false);
  const [sandboxBalance, setSandboxBalance] = useState<SandboxBankProfile | null>(null);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [isSandboxVerified, setIsSandboxVerified] = useState(false);
  const [sandboxSessionToken, setSandboxSessionToken] = useState<string | null>(null);
  const [verificationInput, setVerificationInput] = useState<SandboxVerifyRequest>({
    bank_name: "KOTAK MAHINDRA BANK",
    account_number_or_last4: "",
    phone_number: "",
    mpin: "",
  });
  
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<AutonomyRequest>({
    defaultValues,
  });

  const incomes = useFieldArray({ control, name: "incomes" });
  const expenses = useFieldArray({ control, name: "expenses" });
  const events = useFieldArray({ control, name: "upcoming_events" });
  const formValues = watch();
  const autonomyEnabled = String(watch("autonomy_enabled")) === "true";

  const totalIncome = (formValues.incomes || []).reduce(
    (sum, item) => sum + Number(item?.amount || 0),
    0
  );
  const totalExpenses = (formValues.expenses || []).reduce(
    (sum, item) => sum + Number(item?.amount || 0),
    0
  );
  const totalUpcomingEvents = (formValues.upcoming_events || []).reduce(
    (sum, item) => sum + Number(item?.amount || 0),
    0
  );
  const maxEvent = (formValues.upcoming_events || []).reduce(
    (currentMax, item) => {
      const amount = Number(item?.amount || 0);
      if (!currentMax || amount > Number(currentMax.amount || 0)) return item;
      return currentMax;
    },
    null as AutonomyRequest["upcoming_events"][number] | null
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));

  const formatAsOfDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  useEffect(() => {
    if (user?.user_type) {
      setValue("user_type", user.user_type);
    }
  }, [user, setValue]);

  useEffect(() => {
    if (!isArmingRun) return;

    const timer = setInterval(() => {
      setArmSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsArmingRun(false);
          setIsRunArmed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isArmingRun]);

  useEffect(() => {
    if (step !== 5) {
      setIsArmingRun(false);
      setArmSecondsLeft(10);
      setIsRunArmed(false);
      setHasReviewedPreview(false);
    }
  }, [step]);

  const startRunArming = () => {
    setIsRunArmed(false);
    setArmSecondsLeft(10);
    setIsArmingRun(true);
  };

  const handleRunClick = () => {
    if (isSubmitting) return;

    if (!isRunArmed) {
      if (!isArmingRun) {
        startRunArming();
      }
      return;
    }

    handleSubmit(onSubmit)();
  };

  const onSubmit = async (data: AutonomyRequest) => {
    try {
      const payload = {
        ...data,
        autonomy_enabled: String(data.autonomy_enabled) === "true",
        user_type: user?.user_type || data.user_type || "professional",
      } as AutonomyRequest;

      const res = await autonomyAPI.runCycle(payload);
      
      // Store the execution result
      setExecutionResult(res.data);
      setShowAgentExecution(true);
      localStorage.setItem(getLastExecutionKey(user?.id), JSON.stringify(res.data));
      
      // Invalidate queries to refresh dashboard and investments
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      
      toast.success("Autonomy cycle completed successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Submission failed");
    }
  };

  const handleVerifySandboxBank = async () => {
    try {
      setIsVerifyingBank(true);
      const res = await bankAPI.verifySandboxLink(verificationInput);
      const verify = res.data as SandboxVerifyResponse;

      setIsSandboxVerified(Boolean(verify.verified));
      setSandboxSessionToken(verify.session_token || null);
      toast.success("Verification successful. You can now fetch sandbox data.");
    } catch (err: any) {
      setIsSandboxVerified(false);
      setSandboxSessionToken(null);
      toast.error(err?.response?.data?.detail || "Verification failed");
    } finally {
      setIsVerifyingBank(false);
    }
  };

  const handleSandboxLink = async () => {
    if (!sandboxSessionToken || !isSandboxVerified) {
      toast.error("Verify bank details before linking.");
      return;
    }

    try {
      setIsLinkingBank(true);
      const res = await bankAPI.getSandboxProfile(sandboxSessionToken);
      const profile = res.data as SandboxBankProfile;
      const currentSliderValue = Number(
        watch("investment_policy.max_investment_pct") ?? 50
      );

      setSandboxBalance(profile);
      setValue("current_balance", Number(profile.current_balance || 0), {
        shouldDirty: true,
      });
      setValue("min_balance", Number(profile.min_balance || 0), {
        shouldDirty: true,
      });
      setValue("autonomy_enabled", Boolean(profile.autonomy_enabled), {
        shouldDirty: true,
      });

      incomes.replace(profile.incomes || []);
      expenses.replace(profile.expenses || []);
      events.replace(profile.upcoming_events || []);

      setValue("investment_policy.max_investment_pct", currentSliderValue, {
        shouldDirty: true,
      });
      setIsManualOverride(false);

      toast.success(
        `Sandbox profile loaded (${formatCurrency(profile.current_balance)} as of ${formatAsOfDate(profile.as_of)})`
      );
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setIsSandboxVerified(false);
        setSandboxSessionToken(null);
      }
      toast.error(err?.response?.data?.detail || "Failed to fetch sandbox balance");
    } finally {
      setIsLinkingBank(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="setup-page min-h-screen">
        <TopNav />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          {showAgentExecution && executionResult ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                    Execution Complete
                  </p>
                  <h1 className="text-2xl font-semibold text-(--ink-1) sm:text-3xl">
                    Agent Pipeline Results
                  </h1>
                </div>
                <div className="flex w-full flex-wrap gap-3 sm:w-auto">
                  <Button variant="secondary" onClick={() => {
                    setShowAgentExecution(false);
                    setExecutionResult(null);
                    setStep(1);
                  }}>
                    Run Another Cycle
                  </Button>
                  <Button variant="secondary" onClick={() => router.push("/dashboard")}>
                    Open Dashboard
                  </Button>
                  <Button onClick={() => router.push(`/replay/${executionResult.run_id}`)}>
                    View Full Replay
                  </Button>
                </div>
              </div>

              <AgentExecutionDisplay
                agentOutputs={executionResult.agent_outputs || {}}
                ledger={executionResult.ledger || []}
                runId={executionResult.run_id}
                finalBalance={executionResult.final_balance}
                riskLevel={executionResult.risk_level}
                strategy={executionResult.strategy}
              />
            </div>
          ) : (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-(--muted)">
                Setup
              </p>
              <h1 className="text-3xl font-semibold text-(--ink-1)">
                Financial Profile Wizard
              </h1>
              <p className="text-sm text-(--ink-2)">
                Provide inputs for FinPilot to simulate, decide, and execute.
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="flex min-w-max items-center gap-3 text-xs text-(--muted)">
              {[1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`h-2 w-14 rounded-full ${
                    step >= index ? "bg-(--brand-1)" : "bg-(--surface-3)"
                  }`}
                />
              ))}
              </div>
            </div>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="space-y-6"
            >
              {step === 1 && (
                <Card>
                  <h2 className="text-xl font-semibold text-(--ink-1)">
                    Balance configuration
                  </h2>
                  <p className="mt-2 text-sm text-(--ink-2)">
                    Choose balance source: Link your Bank Account or manual entry.
                  </p>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-(--surface-3) bg-(--surface-2) p-1">
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            balanceInputMode === "manual"
                              ? "bg-(--brand-1) text-white"
                              : "text-(--ink-1)"
                          }`}
                          onClick={() => {
                            setBalanceInputMode("manual");
                          }}
                        >
                          Manual balance
                        </button>
                        <button
                          type="button"
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            balanceInputMode === "sandbox"
                              ? "bg-(--brand-1) text-white"
                              : "text-(--ink-1)"
                          }`}
                          onClick={() => {
                            setBalanceInputMode("sandbox");
                          }}
                        >
                          Link your bank
                        </button>
                      </div>
                    </div>

                    {balanceInputMode === "sandbox" && (
                      <div className="rounded-2xl border border-(--surface-3) bg-(--surface-2) p-4">
                        <div>
                          <div>
                            <p className="text-sm font-medium text-(--ink-1)">
                              Sandbox bank connection
                            </p>
                            <p className="text-xs text-(--ink-2)">
                              Verify account details first, then fetch sandbox profile data.
                            </p>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <label className="text-sm text-(--ink-1)">
                              Bank name
                              <select
                                value={verificationInput.bank_name}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setVerificationInput((prev) => ({
                                    ...prev,
                                    bank_name: value,
                                  }));
                                  setIsSandboxVerified(false);
                                  setSandboxSessionToken(null);
                                }}
                                className="mt-2 w-full rounded-2xl border border-(--surface-3) bg-(--surface-1) px-4 py-3 text-(--ink-1)"
                              >
                                <option value="KOTAK MAHINDRA BANK">KOTAK MAHINDRA BANK</option>
                                <option value="BANK OF BARODA">BANK OF BARODA</option>
                                <option value="HDFC BANK">HDFC BANK</option>
                                <option value="STATE BANK OF INDIA">STATE BANK OF INDIA</option>
                              </select>
                            </label>
                            <label className="text-sm text-(--ink-1)">
                              Account number or last 4 digits
                              <input
                                type="text"
                                value={verificationInput.account_number_or_last4}
                                onChange={(event) => {
                                  const value = event.target.value.replace(/\D/g, "");
                                  setVerificationInput((prev) => ({
                                    ...prev,
                                    account_number_or_last4: value,
                                  }));
                                  setIsSandboxVerified(false);
                                  setSandboxSessionToken(null);
                                }}
                                className="mt-2 w-full rounded-2xl border border-(--surface-3) bg-(--surface-1) px-4 py-3 text-(--ink-1) placeholder:text-(--muted)"
                                placeholder="e.g., 3401 or full account"
                              />
                            </label>
                            <label className="text-sm text-(--ink-1)">
                              Phone number
                              <input
                                type="text"
                                value={verificationInput.phone_number}
                                onChange={(event) => {
                                  const value = event.target.value.replace(/\D/g, "");
                                  setVerificationInput((prev) => ({
                                    ...prev,
                                    phone_number: value,
                                  }));
                                  setIsSandboxVerified(false);
                                  setSandboxSessionToken(null);
                                }}
                                className="mt-2 w-full rounded-2xl border border-(--surface-3) bg-(--surface-1) px-4 py-3 text-(--ink-1) placeholder:text-(--muted)"
                                placeholder="Enter mobile number"
                              />
                            </label>
                            <label className="text-sm text-(--ink-1)">
                              mPIN
                              <input
                                type="password"
                                value={verificationInput.mpin}
                                onChange={(event) => {
                                  const value = event.target.value.replace(/\D/g, "").slice(0, 4);
                                  setVerificationInput((prev) => ({
                                    ...prev,
                                    mpin: value,
                                  }));
                                  setIsSandboxVerified(false);
                                  setSandboxSessionToken(null);
                                }}
                                className="mt-2 w-full rounded-2xl border border-(--surface-3) bg-(--surface-1) px-4 py-3 text-(--ink-1) placeholder:text-(--muted)"
                                placeholder="Enter mPIN (4 digits)"
                              />
                            </label>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={handleVerifySandboxBank}
                              disabled={
                                isVerifyingBank ||
                                verificationInput.bank_name.trim().length < 3 ||
                                verificationInput.account_number_or_last4.trim().length < 4 ||
                                verificationInput.phone_number.trim().length === 0 ||
                                verificationInput.mpin.trim().length !== 4
                              }
                            >
                              {isVerifyingBank ? "Verifying..." : "Verify details"}
                            </Button>

                            <Button
                              type="button"
                              variant="secondary"
                              onClick={handleSandboxLink}
                              disabled={isLinkingBank || !isSandboxVerified || !sandboxSessionToken}
                            >
                              {isLinkingBank ? "Linking..." : "Link to Bank"}
                            </Button>

                            <p className="text-xs text-(--ink-2)">
                              Status: {isSandboxVerified ? "Verified" : "Not verified"}
                            </p>
                          </div>
                        </div>

                        {sandboxBalance && (
                          <div className="mt-4 rounded-xl border border-(--surface-3) bg-(--surface-3) p-3 text-sm text-(--ink-1)">
                            <p>
                              {sandboxBalance.bank_name} ({sandboxBalance.account_mask})
                            </p>
                            <p>
                              Fetched: {formatCurrency(sandboxBalance.current_balance)} as of {formatAsOfDate(sandboxBalance.as_of)}
                            </p>
                            <p className="text-xs text-(--ink-2)">
                              Source: {sandboxBalance.source}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-(--ink-1)">
                      Current balance
                      <input
                        type="number"
                        className="mt-2 w-full rounded-2xl border border-black/10 bg-(--surface-1) px-4 py-3 text-(--ink-1) placeholder:text-(--ink-2)"
                        {...register("current_balance", {
                          valueAsNumber: true,
                          onChange: () => {
                            if (balanceInputMode === "sandbox") {
                              setIsManualOverride(true);
                            }
                          },
                        })}
                      />
                      {balanceInputMode === "sandbox" && (
                        <p className="mt-2 text-xs text-(--ink-2)">
                          Editable for manual override after linking.
                          {isManualOverride ? " Manual override is active." : ""}
                        </p>
                      )}
                    </label>
                    <label className="text-sm text-(--ink-1)">
                      Minimum balance
                      <input
                        type="number"
                        className="mt-2 w-full rounded-2xl border border-black/10 bg-(--surface-1) px-4 py-3 text-(--ink-1) placeholder:text-(--ink-2)"
                        {...register("min_balance", { valueAsNumber: true })}
                      />
                    </label>
                  </div>
                  </div>
                </Card>
              )}

              {step === 2 && (
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-(--ink-1)">
                      Income streams
                    </h2>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        incomes.append({
                          name: "",
                          amount: 0,
                          timing: "monthly",
                          nature: "variable",
                        })
                      }
                    >
                      Add income
                    </Button>
                  </div>
                  <div className="mt-6 space-y-4">
                    {incomes.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid gap-4 rounded-2xl border border-(--surface-3) bg-(--surface-2) p-4 lg:grid-cols-4"
                      >
                        <input
                          placeholder="Name"
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1) placeholder:text-(--muted)"
                          {...register(`incomes.${index}.name` as const)}
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1) placeholder:text-(--muted)"
                          {...register(`incomes.${index}.amount` as const, {
                            valueAsNumber: true,
                          })}
                        />
                        <select
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1)"
                          {...register(`incomes.${index}.timing` as const)}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Biweekly</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <select
                            className="w-full rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1)"
                            {...register(`incomes.${index}.nature` as const)}
                          >
                            <option value="fixed">Fixed</option>
                            <option value="variable">Variable</option>
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-(--ink-2) hover:bg-(--surface-2)"
                            onClick={() => incomes.remove(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {step === 3 && (
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-(--ink-1)">
                      Recurring expenses
                    </h2>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        expenses.append({
                          name: "",
                          amount: 0,
                          timing: "monthly",
                          nature: "fixed",
                          mandatory: false,
                        })
                      }
                    >
                      Add expense
                    </Button>
                  </div>
                  <div className="mt-6 space-y-4">
                    {expenses.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid gap-4 rounded-2xl border border-(--surface-3) bg-(--surface-2) p-4 lg:grid-cols-5"
                      >
                        <input
                          placeholder="Name"
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1) placeholder:text-(--muted)"
                          {...register(`expenses.${index}.name` as const)}
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1) placeholder:text-(--muted)"
                          {...register(`expenses.${index}.amount` as const, {
                            valueAsNumber: true,
                          })}
                        />
                        <select
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1)"
                          {...register(`expenses.${index}.timing` as const)}
                        >
                          <option value="monthly">Monthly</option>
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Biweekly</option>
                        </select>
                        <select
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1)"
                          {...register(`expenses.${index}.nature` as const)}
                        >
                          <option value="fixed">Fixed</option>
                          <option value="variable">Variable</option>
                        </select>
                        <div className="flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-xs text-(--ink-2)">
                            <input
                              type="checkbox"
                              className="accent-(--brand-1)"
                              {...register(`expenses.${index}.mandatory` as const)}
                            />
                            Mandatory
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-(--ink-2) hover:bg-(--surface-2)"
                            onClick={() => expenses.remove(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {step === 4 && (
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-(--ink-1)">
                      Upcoming events
                    </h2>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        events.append({
                          name: "",
                          day: 0,
                          amount: 0,
                        })
                      }
                    >
                      Add event
                    </Button>
                  </div>
                  <div className="mt-6 space-y-4">
                    {events.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid gap-4 rounded-2xl border border-(--surface-3) bg-(--surface-2) p-4 lg:grid-cols-4"
                      >
                        <input
                          placeholder="Name"
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1) placeholder:text-(--muted)"
                          {...register(`upcoming_events.${index}.name` as const)}
                        />
                        <input
                          type="number"
                          placeholder="Day"
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1) placeholder:text-(--muted)"
                          {...register(`upcoming_events.${index}.day` as const, {
                            valueAsNumber: true,
                          })}
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          className="rounded-xl border border-(--surface-3) bg-(--surface-1) px-3 py-2 text-(--ink-1) placeholder:text-(--muted)"
                          {...register(`upcoming_events.${index}.amount` as const, {
                            valueAsNumber: true,
                          })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-(--ink-2) hover:bg-(--surface-2)"
                          onClick={() => events.remove(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {step === 5 && (
                <Card>
                  <h2 className="text-xl font-semibold text-(--ink-1)">
                    Autonomy settings
                  </h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="text-sm text-(--ink-1)">
                      Autonomy enabled
                      <div className="mt-2 rounded-2xl border border-(--surface-3) bg-(--surface-2) p-1">
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                              autonomyEnabled
                                ? "bg-(--brand-1) text-white"
                                : "text-(--ink-1)"
                            }`}
                            onClick={() =>
                              setValue("autonomy_enabled", true, { shouldDirty: true })
                            }
                          >
                            ON
                          </button>
                          <button
                            type="button"
                            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                              !autonomyEnabled
                                ? "bg-(--brand-1) text-white"
                                : "text-(--ink-1)"
                            }`}
                            onClick={() =>
                              setValue("autonomy_enabled", false, { shouldDirty: true })
                            }
                          >
                            OFF
                          </button>
                        </div>
                      </div>
                    </label>
                    <div className="text-sm text-(--ink-1)">
                      User type
                      <div className="mt-2 rounded-2xl border border-(--surface-3) bg-(--surface-2) px-4 py-3 text-sm font-semibold capitalize text-(--ink-1)">
                        {user?.user_type || "professional"}
                      </div>
                      <p className="mt-2 text-xs text-(--ink-2)">
                        To change this, go to Settings → User type preference.
                      </p>
                    </div>
                    <label className="text-sm text-(--ink-1) md:col-span-2">
                      Max investment percentage
                      <input
                        type="range"
                        min={0}
                        max={100}
                        className="mt-3 w-full"
                        {...register("investment_policy.max_investment_pct", {
                          valueAsNumber: true,
                        })}
                      />
                      <div className="mt-2 text-xs text-(--ink-2)">
                        {watch("investment_policy.max_investment_pct")}%
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 rounded-2xl border border-(--surface-3) bg-(--surface-2) p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-(--muted)">Run preview</p>
                    <div className="mt-3 grid gap-3 text-xs lg:grid-cols-2">
                      <div className="rounded-xl border border-(--surface-3) bg-(--surface-3) p-3">
                        <p className="text-(--muted)">Balance snapshot</p>
                        <p className="mt-1 text-(--ink-1)">
                          Current: {formatCurrency(Number(formValues.current_balance || 0))}
                        </p>
                        <p className="text-(--ink-1)">
                          Minimum: {formatCurrency(Number(formValues.min_balance || 0))}
                        </p>
                      </div>

                      <div className="rounded-xl border border-(--surface-3) bg-(--surface-3) p-3">
                        <p className="text-(--muted)">Cashflow totals</p>
                        <p className="mt-1 text-(--ink-1)">Income: {formatCurrency(totalIncome)}</p>
                        <p className="text-(--ink-1)">Expenses: {formatCurrency(totalExpenses)}</p>
                      </div>

                      <div className="rounded-xl border border-(--surface-3) bg-(--surface-3) p-3">
                        <p className="text-(--muted)">Events overview</p>
                        <p className="mt-1 text-(--ink-1)">Events: {(formValues.upcoming_events || []).length}</p>
                        <p className="text-(--ink-1)">Total impact: {formatCurrency(totalUpcomingEvents)}</p>
                        <p className="text-(--ink-1)">
                          Largest: {maxEvent?.name || "-"}
                          {maxEvent ? ` (${formatCurrency(Number(maxEvent.amount || 0))})` : ""}
                        </p>
                      </div>

                      <div className="rounded-xl border border-(--surface-3) bg-(--surface-3) p-3">
                        <p className="text-(--muted)">Policy & profile</p>
                        <p className="mt-1 capitalize text-(--ink-1)">User type: {user?.user_type || "professional"}</p>
                        <p className="text-(--ink-1)">
                          Autonomy: {String(formValues.autonomy_enabled) === "true" ? "ON" : "OFF"}
                        </p>
                        <p className="text-(--ink-1)">
                          Max investment: {Number(formValues.investment_policy?.max_investment_pct || 0)}%
                        </p>
                      </div>
                    </div>

                    <label className="mt-4 flex items-center gap-2 text-xs text-(--ink-2)">
                      <input
                        type="checkbox"
                        className="accent-(--brand-1)"
                        checked={hasReviewedPreview}
                        onChange={(event) => setHasReviewedPreview(event.target.checked)}
                      />
                      I reviewed this preview and want to proceed to arming the run.
                    </label>
                  </div>
                </Card>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (step === 1) {
                      router.push("/dashboard");
                      return;
                    }
                    setStep((prev) => Math.max(prev - 1, 1));
                  }}
                >
                  {step === 1 ? "Back to Dashboard" : "Back"}
                </Button>
                {step < 5 ? (
                  <Button type="button" onClick={() => setStep((prev) => prev + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isSubmitting || isArmingRun || (step === 5 && !hasReviewedPreview)}
                    onClick={handleRunClick}
                    className="relative w-full overflow-hidden sm:min-w-60 sm:w-auto"
                  >
                    <span
                      className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-1000"
                      style={{
                        width: `${isRunArmed ? 100 : ((10 - armSecondsLeft) / 10) * 100}%`,
                      }}
                    />
                    <span className="relative z-10">
                      {isSubmitting
                        ? "Running..."
                        : !hasReviewedPreview
                        ? "Review preview to continue"
                        : isArmingRun
                        ? `Preparing in ${armSecondsLeft}s...`
                        : isRunArmed
                        ? "Confirm & Run autonomy cycle"
                        : "Arm run (10s)"}
                    </span>
                  </Button>
                )}
              </div>
            </form>
          </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
