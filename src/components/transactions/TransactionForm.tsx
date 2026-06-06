"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { useAuth } from "@/components/providers/Providers";
import { Category, CategoryService } from "@/lib/firebase/services/categoryService";
import { Account, AccountService } from "@/lib/firebase/services/accountService";
import { TransactionService } from "@/lib/firebase/services/transactionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, ArrowRight } from "lucide-react";

export function TransactionForm() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [categoryId, setCategoryId] = useState("");
    const [accountId, setAccountId] = useState("");
    const [toAccountId, setToAccountId] = useState("");
    const [merchant, setMerchant] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            CategoryService.getCategories(user.uid),
            AccountService.getAccounts(user.uid)
        ]).then(([cats, accs]) => {
            setCategories(cats);
            setAccounts(accs);
            if (accs.length > 0) setAccountId(accs[0].id);
        });
    }, [user]);

    const availableCategories = categories.filter(c => c.type === type);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError(null);
        setLoading(true);

        try {
            if (!amount || isNaN(parseFloat(amount))) throw new Error("يرجى إدخال مبلغ صحيح");
            if (!accountId) throw new Error("يجب اختيار الحساب");
            if (type !== 'transfer' && !categoryId) throw new Error("يجب اختيار التصنيف");
            if (type === 'transfer' && !toAccountId) throw new Error("يجب اختيار الحساب المحول إليه");

            const amountMinor = Math.round(parseFloat(amount) * 100);

            await TransactionService.addTransaction(user.uid, {
                type,
                amount: amountMinor,
                currency: "EGP",
                date: date as any,
                yearMonth: format(date, "yyyy-MM"),
                categoryId: type === 'transfer' ? undefined : categoryId,
                accountId,
                toAccountId: type === 'transfer' ? toAccountId : undefined,
                merchant: merchant,
                notes: notes,
            } as any);

            router.push("/transactions");
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

            <div className="grid grid-cols-3 gap-3 p-1 bg-muted rounded-lg">
                <Button type="button" variant={type === 'expense' ? 'default' : 'ghost'} onClick={() => setType('expense')} className="rounded-md">مصروف</Button>
                <Button type="button" variant={type === 'income' ? 'default' : 'ghost'} onClick={() => setType('income')} className="rounded-md">دخل</Button>
                <Button type="button" variant={type === 'transfer' ? 'default' : 'ghost'} onClick={() => setType('transfer')} className="rounded-md">تحويل</Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label className="text-base">المبلغ</Label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                        className="text-lg font-mono text-left"
                        dir="ltr"
                    />
                </div>
                <div className="space-y-2 flex flex-col pt-2">
                    <Label className="mb-2 text-base">التاريخ</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-right font-normal text-lg", !date && "text-muted-foreground")}>
                                <CalendarIcon className="ml-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: arEG }) : <span>اختر التاريخ</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus locale={arEG} />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label className="text-base">من حساب</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger className="text-right">
                            <SelectValue placeholder="اختر الحساب" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {type === 'transfer' ? (
                    <div className="space-y-2">
                        <Label className="text-base">إلى حساب</Label>
                        <Select value={toAccountId} onValueChange={setToAccountId}>
                            <SelectTrigger className="text-right">
                                <SelectValue placeholder="اختر الحساب المستلم" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.filter(a => a.id !== accountId).map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label className="text-base">التصنيف</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="text-right">
                                <SelectValue placeholder="اختر التصنيف" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCategories.length === 0 && <SelectItem value="none" disabled>لا توجد تصنيفات</SelectItem>}
                                {availableCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-base">الجهة / المتجر</Label>
                <Input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="مثال: سوبر ماركت، شركة الاتصالات" className="text-right" />
            </div>

            <div className="space-y-2">
                <Label className="text-base">ملاحظات</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="أي تفاصيل إضافية..." className="text-right" />
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="text-base">إلغاء</Button>
                <Button type="submit" disabled={loading} size="lg" className="px-8 text-base">
                    {loading && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
                    حفظ المعاملة
                </Button>
            </div>
        </form>
    );
}
