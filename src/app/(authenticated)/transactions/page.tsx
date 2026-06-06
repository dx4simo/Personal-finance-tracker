"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { useAuth } from "@/components/providers/Providers";
import { Transaction, TransactionService } from "@/lib/firebase/services/transactionService";
import { Category, CategoryService } from "@/lib/firebase/services/categoryService";
import { Account, AccountService } from "@/lib/firebase/services/accountService";
import { convertToCSV, downloadCSV } from "@/lib/utils/export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Record<string, Category>>({});
    const [accounts, setAccounts] = useState<Record<string, Account>>({});
    const [loading, setLoading] = useState(true);

    const searchParams = useSearchParams();
    const [month, setMonth] = useState(searchParams.get('view') === 'all' ? "" : format(new Date(), "yyyy-MM"));
    const [typeFilter, setTypeFilter] = useState<string>("all");

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [cats, accs] = await Promise.all([
                CategoryService.getCategories(user.uid),
                AccountService.getAccounts(user.uid)
            ]);

            const catMap = cats.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, Category>);
            const accMap = accs.reduce((acc, a) => ({ ...acc, [a.id]: a }), {} as Record<string, Account>);
            setCategories(catMap);
            setAccounts(accMap);

            const txs = await TransactionService.getTransactions(user.uid, {
                month: month || undefined, // Send undefined if empty string
                type: typeFilter === "all" ? undefined : typeFilter,
            });
            setTransactions(txs);

        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, month, typeFilter]);

    const handleDelete = async (id: string) => {
        if (!user || !confirm("هل أنت متأكد من حذف هذه المعاملة؟")) return;
        await TransactionService.deleteTransaction(user.uid, id);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">سجل المعاملات</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => {
                        const csv = convertToCSV(transactions.map(t => ({
                            التاريخ: t.date?.seconds ? new Date(t.date.seconds * 1000).toISOString() : "",
                            النوع: t.type === 'expense' ? 'مصروف' : t.type === 'income' ? 'دخل' : 'تحويل',
                            المبلغ: (t.amount / 100).toFixed(2),
                            العملة: t.currency,
                            التصنيف: transactions.find(x => x.id === t.id)?.categoryId ? categories[t.categoryId!]?.name : "",
                            الحساب: accounts[t.accountId]?.name || "",
                            الجهة: t.merchant || "",
                            ملاحظات: t.notes || ""
                        })));
                        downloadCSV(csv, `transactions-${month}.csv`);
                    }}>
                        <Download className="ml-2 h-4 w-4" />
                        تصدير
                    </Button>
                    <Button asChild className="flex-1 sm:flex-none">
                        <Link href="/transactions/new">
                            <Plus className="ml-2 h-4 w-4" /> إضافة معاملة
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-xl border shadow-sm">
                <div className="grid gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium">الشهر</span>
                    <Input
                        type="month"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-full sm:w-[180px]"
                    />
                </div>
                <div className="grid gap-2 w-full sm:w-auto">
                    <span className="text-sm font-medium">النوع</span>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] text-right">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">الكل</SelectItem>
                            <SelectItem value="expense">مصروفات</SelectItem>
                            <SelectItem value="income">إيرادات</SelectItem>
                            <SelectItem value="transfer">تحويلات</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">التفاصيل</TableHead>
                            <TableHead className="text-right">التصنيف</TableHead>
                            <TableHead className="text-right">الحساب</TableHead>
                            <TableHead className="text-left">المبلغ</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-lg">
                                    لا توجد معاملات في هذا الشهر.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">
                                        {tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), "dd MMM, HH:mm", { locale: arEG }) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold">{tx.merchant || "---"}</div>
                                        {tx.notes && <div className="text-xs text-muted-foreground">{tx.notes}</div>}
                                    </TableCell>
                                    <TableCell>
                                        {tx.categoryId ? (
                                            <Badge variant="outline" className="font-normal bg-secondary">
                                                {categories[tx.categoryId]?.name || "غير معروف"}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{accounts[tx.accountId]?.name || "غير معروف"}</span>
                                            {tx.toAccountId && (
                                                <span className="text-xs text-muted-foreground">إلى: {accounts[tx.toAccountId]?.name}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className={`text-left font-bold text-lg ${tx.type === 'income' ? 'text-green-600' : tx.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`} dir="ltr">
                                        {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                                        {(tx.amount / 100).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)} className="text-muted-foreground hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
