"use client";

import { DebtForm } from "@/components/debts/DebtForm";

export default function NewDebtPage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">تسجيل دين جديد</h2>
            <DebtForm />
        </div>
    );
}
