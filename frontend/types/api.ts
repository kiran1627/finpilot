export type User = {
  id: string;
  email: string;
  provider: string;
  user_type: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user?: User;
};

export type IncomeInput = {
  name: string;
  amount: number;
  timing: string;
  nature: string;
};

export type ExpenseInput = {
  name: string;
  amount: number;
  timing: string;
  nature: string;
  mandatory: boolean;
};

export type EventInput = {
  name: string;
  day: number;
  amount: number;
};

export type InvestmentPolicy = {
  max_investment_pct: number;
};

export type AutonomyRequest = {
  current_balance: number;
  min_balance: number;
  incomes: IncomeInput[];
  expenses: ExpenseInput[];
  upcoming_events: EventInput[];
  autonomy_enabled: boolean;
  user_type: string;
  investment_policy: InvestmentPolicy;
};

export type AutonomyResponse = {
  run_id: string;
  final_balance: number;
  risk_level: string;
  strategy: string;
  ledger: Array<Record<string, unknown>>;
  agent_outputs: Record<string, unknown>;
};

export type RunSummary = {
  run_id: string;
  strategy?: string | null;
  risk_level?: string | null;
  final_balance?: number | null;
  started_at?: string;
  ended_at?: string;
};

export type ReplayStep = {
  type:
    | "recurring_expense"
    | "event"
    | "investment_execution"
    | "state_snapshot"
    | "final_snapshot"
    | string;
  day?: number;
  expense_name?: string;
  event_name?: string;
  amount?: number;
  invested_amount?: number;
  allocation?: Record<string, number>;
  balance?: number;
  balance_before?: number;
  balance_after?: number;
  risk_level?: string;
  strategy?: string;
  final_balance?: number;
};

export type ReplayData = {
  run_id: string;
  initial_balance?: number | null;
  final_balance?: number | null;
  risk_level?: string | null;
  strategy?: string | null;
  total_steps: number;
  steps: ReplayStep[];
};

export type DashboardSummary = {
  net_worth: number;
  last_run_risk: string;
  total_invested: number;
  current_portfolio_value: number;
  total_unrealized_pnl: number;
  total_return_pct: number;
  runs_count: number;
  nav_trend: { investment_index: number; portfolio_value: number }[];
};

export type Holding = {
  asset_class?: string;
  instrument?: string;
  name?: string;
  invested_amount: number;
  current_value: number;
  unrealized_pnl: number;
  return_pct: number;
};

export type InvestmentData = {
  total_portfolio_value: number;
  total_invested: number;
  total_unrealized_pnl: number;
  total_return_pct: number;
  holdings: Holding[];
  nav_history: { investment_index: number; portfolio_value: number }[];
  cumulative_allocation: Record<string, number>;
  investment_history: Array<Record<string, unknown>>;
};

export type LedgerEntry = {
  entry_type: string;
  run_id?: string;
  created_at: string;
  payload: Record<string, unknown>;
};

export type SandboxBankBalance = {
  current_balance: number;
  currency: string;
  as_of: string;
  source: string;
  bank_name: string;
  account_mask: string;
};

export type SandboxBankProfile = SandboxBankBalance & {
  min_balance: number;
  incomes: IncomeInput[];
  expenses: ExpenseInput[];
  upcoming_events: EventInput[];
  autonomy_enabled: boolean;
};

export type SandboxVerifyRequest = {
  bank_name: string;
  account_number_or_last4: string;
  phone_number: string;
  mpin: string;
};

export type SandboxVerifyResponse = {
  verified: boolean;
  session_token: string;
  expires_in_seconds: number;
};
