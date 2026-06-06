"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/Providers";
import { DebtService } from "@/lib/firebase/services/debtService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

export function DebtForm() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [creditor, setCreditor] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError(null);
        setLoading(true);

        try {
            if (!amount || isNaN(parseFloat(amount))) throw new Error("يرجى إدخال مبلغ صحيح");
            if (!creditor) throw new Error("يرجى إدخال اسم الدائن");

            const amountMinor = Math.round(parseFloat(amount) * 100);

            await DebtService.addDebt(user.uid, {
                creditorName: creditor,
                principalAmount: amountMinor,
                remainingAmount: amountMinor,
                startDate: date as any,
                status: 'active',
                notes: notes,
            } as any);

            router.push("/debts");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 md:p-8 rounded-xl border shadow-sm">
            {error && <div className="text-red-700 bg-red-50 p-3 rounded-lg text-sm border border-red-200">{error}</div>}

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label className="text-base">الدائن (الشخص أو الجهة)</Label>
                    <Input value={creditor} onChange={e => setCreditor(e.target.value)} placeholder="مثال: البنك الأهلي، محمد أحمد" required className="text-right" />
                </div>
                <div className="space-y-2">
                    <Label className="text-base">قيمة الدين</Label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        className="text-lg font-mono text-left"
                        dir="ltr"
                    />
                </div>
            </div>

            <div className="space-y-2 flex flex-col">
                <Label className="mb-2 text-base">تاريخ البدء</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full sm:w-[240px] justify-start text-right font-normal text-lg", !date && "text-muted-foreground")}>
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: arEG }) : <span>اختر التاريخ</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus locale={arEG} />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label className="text-base">ملاحظات</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="تفاصيل الأقساط، فوائد، إلخ..." className="text-right" />
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="text-base">إلغاء</Button>
                <Button type="submit" disabled={loading} size="lg" className="px-8 text-base">
                    {loading && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
                    حفظ الدين
                </Button>
            </div>
        </form>
    );
}
