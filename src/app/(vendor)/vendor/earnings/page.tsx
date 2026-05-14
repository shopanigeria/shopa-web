"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Settings, X, Wallet, Banknote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { formatNaira } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface VendorBalance {
  availableBalance: number;
  withdrawableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
}

interface Withdrawal {
  id: string;
  reference?: string;
  amount: number;
  status: string;
  createdAt: string;
  type?: "CREDIT" | "DEBIT";
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_BALANCE: VendorBalance = { availableBalance: 100000, withdrawableBalance: 75000, totalEarned: 300000, totalWithdrawn: 50000, pendingWithdrawals: 0 };

const MOCK_WITHDRAWALS: Withdrawal[] = [
  { id: "w1", reference: "00000001", amount: 50000, status: "SUCCESSFUL", type: "CREDIT", createdAt: new Date("2026-03-22T14:30:00Z").toISOString() },
  { id: "w2", reference: "00000001", amount: 50000, status: "SUCCESSFUL", type: "DEBIT",  createdAt: new Date("2026-03-22T14:30:00Z").toISOString() },
  { id: "w3", reference: "00000001", amount: 50000, status: "PENDING",    type: "DEBIT",  createdAt: new Date("2026-03-22T14:30:00Z").toISOString() },
  { id: "w4", reference: "00000001", amount: 50000, status: "FAILED",     type: "DEBIT",  createdAt: new Date("2026-03-22T14:30:00Z").toISOString() },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const time = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
  return `${dd}-${mm}-${yyyy}, ${time}`;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === "SUCCESSFUL" || s === "COMPLETED" || s === "APPROVED") {
    return <span className="bg-[#2E7D32] text-white font-jakarta text-[11px] font-semibold px-[10px] py-[3px] rounded-full">Completed</span>;
  }
  if (s === "PENDING") {
    return <span className="bg-[#FDC500] text-white font-jakarta text-[11px] font-semibold px-[10px] py-[3px] rounded-full">Pending</span>;
  }
  return <span className="bg-[#E53935] text-white font-jakarta text-[11px] font-semibold px-[10px] py-[3px] rounded-full">Failed</span>;
}

// ── Backdrop ───────────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />;
}

// ── Withdrawal modal ───────────────────────────────────────────────────────

interface BankAccount { accountNumber: string; bankName: string; accountName: string; }

function WithdrawalModal({ availableBalance, savedAccount, onClose, onConfirm, isLoading }: {
  availableBalance: number;
  savedAccount?: BankAccount | null;
  onClose: () => void;
  onConfirm: (data: { amount: number; accountNumber: string; bankName: string; accountName: string }) => void;
  isLoading: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [useNewAccount, setUseNewAccount] = useState(!savedAccount);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");

  function handleConfirm() {
    const num = parseFloat(amount);
    if (!num || num < 500) { toast.error("Minimum withdrawal is ₦500."); return; }
    if (num > availableBalance) { toast.error("Amount exceeds withdrawable balance."); return; }

    const acct = useNewAccount
      ? { accountNumber: accountNumber.trim(), bankName: bankName.trim(), accountName: accountName.trim() }
      : { accountNumber: savedAccount!.accountNumber, bankName: savedAccount!.bankName, accountName: savedAccount!.accountName };

    if (!acct.accountNumber || !acct.bankName || !acct.accountName) {
      toast.error("Please fill in all bank details.");
      return;
    }
    onConfirm({ amount: num, ...acct });
  }

  const inputClass = "w-full rounded-[8px] bg-[#EAEAEA] px-[14px] py-[14px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none";

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px] overflow-y-auto py-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[28px] pb-[28px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>

          <p className="font-jakarta font-bold text-[16px] text-[#333333] tracking-[-0.04em] mb-[20px]">Request Withdrawal</p>

          <div className="flex flex-col gap-[16px] mb-[20px]">
            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-[8px]">
                <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em]">Amount</p>
                <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em]">
                  Max: {formatNaira(availableBalance)}
                </p>
              </div>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="Min. ₦500" min="500" max={availableBalance} className={inputClass} />
              {parseFloat(amount) > availableBalance && (
                <p className="font-jakarta text-[11px] text-[#E53935] tracking-[-0.04em] mt-[4px]">
                  Amount exceeds withdrawable balance.
                </p>
              )}
            </div>

            {/* Bank account selection */}
            <div>
              <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[10px]">Bank Account</p>

              {savedAccount && (
                <>
                  {/* Use saved account */}
                  <button type="button" onClick={() => setUseNewAccount(false)}
                    className={`w-full flex items-start gap-[12px] p-[12px] rounded-[8px] border-2 text-left mb-[8px] transition-colors ${!useNewAccount ? "border-[#2E7D32] bg-[#F7FFF8]" : "border-[#EAEAEA]"}`}>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 mt-[1px] shrink-0 flex items-center justify-center ${!useNewAccount ? "border-[#2E7D32] bg-[#2E7D32]" : "border-[#9B9B9B]"}`}>
                      {!useNewAccount && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
                    </div>
                    <div>
                      <p className="font-jakarta font-semibold text-[13px] text-[#151515]">{savedAccount.bankName}</p>
                      <p className="font-jakarta text-[12px] text-[#9B9B9B]">{savedAccount.accountNumber} — {savedAccount.accountName}</p>
                    </div>
                  </button>

                  {/* Use new account */}
                  <button type="button" onClick={() => setUseNewAccount(true)}
                    className={`w-full flex items-center gap-[12px] p-[12px] rounded-[8px] border-2 text-left transition-colors ${useNewAccount ? "border-[#2E7D32] bg-[#F7FFF8]" : "border-[#EAEAEA]"}`}>
                    <div className={`w-[18px] h-[18px] rounded-full border-2 shrink-0 flex items-center justify-center ${useNewAccount ? "border-[#2E7D32] bg-[#2E7D32]" : "border-[#9B9B9B]"}`}>
                      {useNewAccount && <div className="w-[7px] h-[7px] rounded-full bg-white" />}
                    </div>
                    <p className="font-jakarta font-semibold text-[13px] text-[#151515]">Use a different account</p>
                  </button>
                </>
              )}

              {/* New account fields */}
              {useNewAccount && (
                <div className="flex flex-col gap-[12px] mt-[12px]">
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account number" maxLength={10} className={inputClass} />
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank name (e.g GTB, Access)" className={inputClass} />
                  <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Account name" className={inputClass} />
                </div>
              )}
            </div>
          </div>

          <button type="button" onClick={handleConfirm}
            disabled={isLoading || !amount || parseFloat(amount) > availableBalance}
            className="w-full h-[50px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors mb-[12px]">
            {isLoading ? "Submitting..." : "Confirm withdrawal"}
          </button>
          <button type="button" onClick={onClose}
            className="w-full font-jakarta text-[14px] text-[#9B9B9B] underline tracking-[-0.04em]">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function VendorEarningsPage() {
  const { user } = useAuthStore();
  const isMock = user?.id === "mock-vendor-001";
  const queryClient = useQueryClient();

  const [showWithdrawal, setShowWithdrawal] = useState(false);

  const { data: balance } = useQuery<VendorBalance>({
    queryKey: ["vendor-balance"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vendors/me/balance");
      return data?.data ?? data;
    },
    enabled: !isMock,
    staleTime: 0,
    refetchInterval: 30000,
  });

  const { data: profile } = useQuery<{ bankAccount?: BankAccount | null }>({
    queryKey: ["vendor-profile"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vendors/me/profile");
      return data?.data ?? data;
    },
    enabled: !isMock,
  });

  const { data: withdrawals, isLoading: loadingWithdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["vendor-withdrawals"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vendors/me/withdrawals");
      return data?.data ?? data ?? [];
    },
    enabled: !isMock,
    staleTime: 0,
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const withdrawMutation = useMutation({
    mutationFn: async (payload: { amount: number; accountNumber: string; bankName: string; accountName: string }) => {
      await apiClient.post("/vendors/me/withdrawal", payload);
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted!");
      setShowWithdrawal(false);
      queryClient.invalidateQueries({ queryKey: ["vendor-balance"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-withdrawals"] });
    },
    onError: () => toast.error("Failed to request withdrawal. Please try again."),
  });

  const bal = isMock ? MOCK_BALANCE : (balance ?? { availableBalance: 0, withdrawableBalance: 0, totalEarned: 0, totalWithdrawn: 0, pendingWithdrawals: 0 });
  const txns = isMock ? MOCK_WITHDRAWALS : (withdrawals ?? []);

  return (
    <div className="min-h-screen bg-[#F7FFF8]">
      {/* Mobile header */}
      <div className="md:hidden bg-[#2E7D32] rounded-b-[12px] h-[90px] flex items-center justify-between px-[20px]">
        <Image src="/images/logo.svg" alt="Shopa" width={80} height={30} priority />
        <div className="flex items-center gap-[10px]">
          <Link href="/vendor/notifications" aria-label="Notifications">
            <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
              <Bell size={18} className="text-white" />
            </div>
          </Link>
          <Link href="/vendor/settings" aria-label="Settings">
            <div className="w-[36px] h-[36px] rounded-full bg-white/20 flex items-center justify-center">
              <Settings size={18} className="text-white" />
            </div>
          </Link>
        </div>
      </div>
      {/* Desktop top bar */}
      <div className="hidden md:flex items-center justify-between px-[32px] py-[20px] border-b border-[#EAEAEA] bg-white">
        <h1 className="font-satoshi font-bold text-[20px] text-[#151515]">Earnings</h1>
        <div className="flex items-center gap-[10px]">
          <Link href="/vendor/notifications" aria-label="Notifications" className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
            <Bell size={18} className="text-[#2E7D32]" />
          </Link>
          <Link href="/vendor/settings" aria-label="Settings" className="w-[36px] h-[36px] rounded-full bg-[#F7FFF8] border border-[#EAEAEA] flex items-center justify-center hover:bg-[#D8FFDA] transition-colors">
            <Settings size={18} className="text-[#2E7D32]" />
          </Link>
        </div>
      </div>

      <div className="px-[20px] md:px-[32px] lg:px-[40px] pt-[20px] pb-[24px]">
        {/* Balance cards */}
        <div className="grid grid-cols-2 gap-[12px] mb-[8px]">
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[14px] flex items-center gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-full bg-[#2E7D32] flex items-center justify-center shrink-0">
              <Banknote size={20} className="text-white" />
            </div>
            <div>
              <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.3]">Available Balance</p>
              <p className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em]">{formatNaira(bal.availableBalance)}</p>
            </div>
          </div>
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[14px] flex items-center gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-full bg-[#FDC500] flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.3]">Withdrawable</p>
              <p className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em]">{formatNaira(bal.withdrawableBalance)}</p>
            </div>
          </div>
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[14px] flex items-center gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-full bg-[#E53935] flex items-center justify-center shrink-0">
              <Banknote size={20} className="text-white" />
            </div>
            <div>
              <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.3]">Total Withdrawn</p>
              <p className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em]">{formatNaira(bal.totalWithdrawn)}</p>
            </div>
          </div>
          <div className="bg-white rounded-[12px] border border-[#EAEAEA] p-[14px] flex items-center gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-full bg-[#9B9B9B] flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.3]">Pending Withdrawals</p>
              <p className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em]">{formatNaira(bal.pendingWithdrawals)}</p>
            </div>
          </div>
        </div>
        <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.5] mb-[4px]">
          Withdrawable balance excludes orders within the 24hr dispute window and any active disputes.
        </p>

        <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.5] mb-[24px]">
          Available balance is the balance you can withdraw at this time.
        </p>

        {/* Transaction history header */}
        <div className="flex items-center justify-between mb-[16px]">
          <p className="font-jakarta text-[16px] font-bold text-[#151515] tracking-[-0.04em]">
            Transaction History
          </p>
          <button
            type="button"
            onClick={() => setShowWithdrawal(true)}
            className="flex items-center gap-[6px] bg-[#D8FFDA] rounded-[8px] px-[12px] py-[7px] font-jakarta text-[12px] font-semibold text-[#2E7D32] tracking-[-0.04em]"
          >
            <span className="text-[16px] leading-none">+</span>
            Request Withdrawal
          </button>
        </div>

        {/* Transaction list */}
        {loadingWithdrawals ? (
          <div className="flex flex-col gap-[10px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[12px] border border-[#EAEAEA] p-[16px] h-[72px] animate-pulse" />
            ))}
          </div>
        ) : txns.length === 0 ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="font-jakarta text-[14px] text-[#9B9B9B] tracking-[-0.04em]">No transactions yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            {txns.map((txn) => {
              const isCredit = txn.type === "CREDIT";
              const isFailed = txn.status.toUpperCase() === "FAILED";
              const amountColor = isFailed ? "text-[#E53935]" : isCredit ? "text-[#2E7D32]" : "text-[#151515]";
              const prefix = isCredit ? "+" : "–";

              return (
                <div key={txn.id} className="bg-white rounded-[12px] border border-[#EAEAEA] px-[16px] py-[14px] flex items-center justify-between">
                  <div>
                    <p className="font-jakarta font-bold text-[14px] text-[#151515] tracking-[-0.04em]">
                      #{(txn.reference ?? txn.id).padStart(8, "0")}
                    </p>
                    <p className="font-jakarta text-[12px] text-[#9B9B9B] tracking-[-0.04em] mt-[4px]">
                      {formatDateTime(txn.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-[6px]">
                    <p className={cn("font-jakarta font-bold text-[14px] tracking-[-0.04em]", amountColor)}>
                      {prefix} {formatNaira(txn.amount)}
                    </p>
                    <StatusBadge status={txn.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal modal */}
      {showWithdrawal && (
        <WithdrawalModal
          availableBalance={bal.withdrawableBalance}
          savedAccount={profile?.bankAccount ?? null}
          onClose={() => setShowWithdrawal(false)}
          isLoading={withdrawMutation.isPending}
          onConfirm={(data) => {
            if (isMock) { toast.success("Withdrawal requested! (mock)"); setShowWithdrawal(false); return; }
            withdrawMutation.mutate(data);
          }}
        />
      )}
    </div>
  );
}
