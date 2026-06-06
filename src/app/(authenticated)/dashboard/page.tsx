"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import Link from "next/link";
import { useAuth } from "@/components/providers/Providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionService, Transaction } from "@/lib/firebase/services/transactionService";
import { Loader2, ArrowUpCircle, ArrowDownCircle, Wallet, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({ income: 0, expense: 0, net: 0 });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

    const currentMonth = format(new Date(), "yyyy-MM");

    useEffect(() => {
        async function fetchDashboard() {
            if (!user) return;
            setLoading(true);
            try {
                const [monthlyStats, recent] = await Promise.all([
                    TransactionService.getMonthlyStats(user.uid, currentMonth),
                    TransactionService.getTransactions(user.uid, { limit: 5 })
                ]);
                setStats(monthlyStats);
                setRecentTransactions(recent);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, [user, currentMonth]);

    if (loading) return <div className="flex h-full items-center justify-center pt-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">نظرة عامة</h2>
                    <p className="text-muted-foreground text-lg">
                        تقرير شهر {format(new Date(), "MMMM yyyy", { locale: arEG })}
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto text-lg py-6" size="lg">
                    <Link href="/transactions/new">إضافة عملية جديدة</Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium text-green-700 dark:text-green-400">الدخل الشهري</CardTitle>
                        <ArrowUpCircle className="h-6 w-6 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700 dark:text-green-500">{(stats.income / 100).toLocaleString('ar-EG')}</div>
                        <p className="text-sm text-green-600/80">جنيه مصري</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10 border-red-200 dark:border-red-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium text-red-700 dark:text-red-400">المصروفات</CardTitle>
                        <ArrowDownCircle className="h-6 w-6 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-700 dark:text-red-500">{(stats.expense / 100).toLocaleString('ar-EG')}</div>
                        <p className="text-sm text-red-600/80">جنيه مصري</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-900">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium text-blue-700 dark:text-blue-400">صافي التوفير</CardTitle>
                        <Wallet className="h-6 w-6 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${stats.net >= 0 ? 'text-blue-700 dark:text-blue-500' : 'text-red-700'}`}>
                            {(stats.net / 100).toLocaleString('ar-EG')}
                        </div>
                        <p className="text-sm text-blue-600/80">جنيه مصري</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <Card className="col-span-full lg:col-span-4 hidden lg:block">
                    <CardHeader>
                        <CardTitle>تحليل المصروفات</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-muted/20 rounded-xl m-2 border-2 border-dashed">
                        <p className="text-muted-foreground">الرسوم البيانية قريباً</p>
                    </CardContent>
                </Card>
                <Card className="col-span-full lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>أحدث المعاملات</CardTitle>
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                            <Link href="/transactions?view=all" className="flex items-center gap-1">
                                عرض الكل <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentTransactions.length === 0 && <p className="text-sm text-center py-8 text-muted-foreground">لا توجد معاملات حديثة.</p>}
                            {recentTransactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between group">
                                    <div className="flex flex-col gap-1">
                                        <div className="font-semibold text-base group-hover:text-primary transition-colors">{tx.merchant || "غير محدد"}</div>
                                        <div className="text-xs text-muted-foreground">{format(new Date(tx.date.seconds * 1000), "dd MMMM yyyy", { locale: arEG })}</div>
                                    </div>
                                    <div className={`font-bold text-base px-3 py-1 rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                                        {tx.type === 'expense' ? '-' : '+'}{(tx.amount / 100).toLocaleString('ar-EG')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
