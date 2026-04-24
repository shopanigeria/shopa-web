"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Settings, X, Wallet, Banknote } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { apiClient } from "@/lib/api/client";
import { formatNaira } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface VendorBalance {
  availableBalance: number;
  totalBalance: number;
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

const MOCK_BALANCE: VendorBalance = { availableBalance: 100000, totalBalance: 300000 };

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
  if (s === "SUCCESSFUL" || s === "COMPLETED") {
    return <span className="bg-[#2E7D32] text-white font-jakarta text-[11px] font-semibold px-[10px] py-[3px] rounded-full">Successful</span>;
  }
  if (s === "PENDING" || s === "APPROVED") {
    return <span className="bg-[#FDC500] text-white font-jakarta text-[11px] font-semibold px-[10px] py-[3px] rounded-full">Pending</span>;
  }
  return <span className="bg-[#E53935] text-white font-jakarta text-[11px] font-semibold px-[10px] py-[3px] rounded-full">Failed</span>;
}

// ── Backdrop ───────────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />;
}

// ── Withdrawal modal ───────────────────────────────────────────────────────

function WithdrawalModal({ availableBalance, onClose, onConfirm, isLoading }: {
  availableBalance: number;
  onClose: () => void;
  onConfirm: (data: { amount: number; accountNumber: string; bankName: string; accountName: string }) => void;
  isLoading: boolean;
}) {
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");

  function handleConfirm() {
    const num = parseFloat(amount);
    if (!num || num < 500) { toast.error("Minimum withdrawal is ₦500."); return; }
    if (num > availableBalance) { toast.error("Amount exceeds available balance."); return; }
    if (!accountNumber.trim() || !bankName.trim() || !accountName.trim()) {
      toast.error("Please fill in all bank details.");
      return;
    }
    onConfirm({ amount: num, accountNumber: accountNumber.trim(), bankName: bankName.trim(), accountName: accountName.trim() });
  }

  const inputClass = "w-full rounded-[8px] bg-[#EAEAEA] px-[14px] py-[14px] font-jakarta text-[14px] text-[#333333] placeholder:text-[#C2C2C2] focus:outline-none";

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-[24px]">
        <div className="bg-white rounded-[16px] px-[24px] pt-[28px] pb-[28px] w-full max-w-[360px] relative">
          <button type="button" aria-label="Close" onClick={onClose} className="absolute top-[16px] right-[16px]">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-[#2E7D32] flex items-center justify-center">
              <X size={14} className="text-[#2E7D32]" />
            </div>
          </button>

          <div className="flex flex-col gap-[16px] mb-[20px]">
            {/* Amount */}
            <div>
              <div className="flex items-center justify-between mb-[8px]">
                <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em]">
                  Amount to be withdrawn
                </p>
                <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em]">
                  Max: {formatNaira(availableBalance)}
                </p>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="500"
                max={availableBalance}
                className={inputClass}
              />
              {parseFloat(amount) > availableBalance && (
                <p className="font-jakarta text-[11px] text-[#E53935] tracking-[-0.04em] mt-[4px]">
                  Amount cannot exceed your available balance.
                </p>
              )}
            </div>

            {/* Account number */}
            <div>
              <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[8px]">
                Account number
              </p>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
                maxLength={10}
                className={inputClass}
              />
              <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] mt-[6px] leading-[1.5]">
                Please note that the account details you provide now is the account ALL your withdrawals will be processed to
              </p>
            </div>

            {/* Bank name */}
            <div>
              <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[8px]">
                Bank name
              </p>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Enter bank name"
                className={inputClass}
              />
            </div>

            {/* Name on account */}
            <div>
              <p className="font-jakarta font-bold text-[14px] text-[#333333] tracking-[-0.04em] mb-[8px]">
                Name on account
              </p>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter account name"
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || parseFloat(amount) > availableBalance}
            className="w-full h-[50px] rounded-[8px] bg-[#2E7D32] font-jakarta text-[14px] font-semibold text-white disabled:opacity-50 hover:bg-[#1D5620] transition-colors mb-[12px]"
          >
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

  const [showWithdrawal, setShowWithdrawal] = useState(false);

  const { data: balance } = useQuery<VendorBalance>({
    queryKey: ["vendor-balance"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vendors/me/balance");
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
  });

  const withdrawMutation = useMutation({
    mutationFn: async (payload: { amount: number; accountNumber: string; bankName: string; accountName: string }) => {
      await apiClient.post("/vendors/me/withdrawal", payload);
    },
    onSuccess: () => {
      toast.success("Withdrawal request submitted!");
      setShowWithdrawal(false);
    },
    onError: () => toast.error("Failed to request withdrawal. Please try again."),
  });

  const bal = isMock ? MOCK_BALANCE : (balance ?? { availableBalance: 0, totalBalance: 0 });
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
        <div className="flex gap-[12px] mb-[8px]">
          {/* Available balance */}
          <div className="flex-1 bg-white rounded-[12px] border border-[#EAEAEA] p-[14px] flex items-center gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-full bg-[#FDC500] flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-white" />
            </div>
            <div>
              <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.3]">Avail. Balance</p>
              <p className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em]">
                {formatNaira(bal.availableBalance)}
              </p>
            </div>
          </div>

          {/* Total balance */}
          <div className="flex-1 bg-white rounded-[12px] border border-[#EAEAEA] p-[14px] flex items-center gap-[12px]">
            <div className="w-[44px] h-[44px] rounded-full bg-[#2E7D32] flex items-center justify-center shrink-0">
              <Banknote size={20} className="text-white" />
            </div>
            <div>
              <p className="font-jakarta text-[11px] text-[#9B9B9B] tracking-[-0.04em] leading-[1.3]">Total Balance</p>
              <p className="font-jakarta text-[14px] font-bold text-[#151515] tracking-[-0.04em]">
                {formatNaira(bal.totalBalance)}
              </p>
            </div>
          </div>
        </div>

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
          availableBalance={bal.availableBalance}
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
