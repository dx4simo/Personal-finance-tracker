"use client";

import { TransactionForm } from "@/components/transactions/TransactionForm";

export default function NewTransactionPage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">إضافة معاملة جديدة</h2>
            <TransactionForm />
        </div>
    );
}
