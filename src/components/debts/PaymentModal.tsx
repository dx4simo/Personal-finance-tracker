"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/components/providers/Providers";
import { DebtService } from "@/lib/firebase/services/debtService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    debtId: string;
    currentRemaining: number;
    onSuccess: () => void;
}

export function PaymentModal({ isOpen, onClose, debtId, currentRemaining, onSuccess }: PaymentModalProps) {
    const { user } = useAuth();
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            const amountMinor = Math.round(parseFloat(amount) * 100);
            if (amountMinor <= 0) throw new Error("المبلغ غير صحيح");
            if (amountMinor > currentRemaining) throw new Error("المبلغ أكبر من الدين المتبقي");

            await DebtService.addPayment(user.uid, debtId, {
                amount: amountMinor,
                date: Timestamp.now(),
                notes: notes
            });
            setAmount("");
            setNotes("");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("فشل تسجيل عملية الدفع");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">تسجيل سداد</DialogTitle>
                    <DialogDescription className="text-right">
                        أدخل المبلغ الذي تم سداده لهذا الدين.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount" className="text-right">المبلغ</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="text-left font-mono"
                            placeholder="0.00"
                            dir="ltr"
                            autoFocus
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes" className="text-right">ملاحظات (اختياري)</Label>
                        <Input
                            id="notes"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="text-right"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            تأكيد السداد
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
