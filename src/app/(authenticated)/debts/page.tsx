"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { useAuth } from "@/components/providers/Providers";
import { Debt, DebtService } from "@/lib/firebase/services/debtService";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, User, Calendar, Loader2 } from "lucide-react";

export default function DebtsPage() {
    const { user } = useAuth();
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'active' | 'paid'>('active');

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await DebtService.getDebts(user.uid);
            setDebts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const activeDebts = debts.filter(d => d.status === 'active');
    const paidDebts = debts.filter(d => d.status === 'paid');

    const totalActiveDebt = activeDebts.reduce((sum, d) => sum + (d.remainingAmount), 0);
    const displayedDebts = filter === 'active' ? activeDebts : paidDebts;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">الديون</h2>
                    <p className="text-muted-foreground mt-1">
                        إجمالي الديون المستحقة: <span className="font-bold text-red-600">{(totalActiveDebt / 100).toLocaleString('ar-EG')} جنية</span>
                    </p>
                </div>
                <Button asChild size="lg">
                    <Link href="/debts/new">
                        <Plus className="ml-2 h-5 w-5" /> إضافة دين جديد
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="active" className="space-y-4" onValueChange={(v) => setFilter(v as any)}>
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="active" className="flex-1 sm:flex-none">الديون النشطة ({activeDebts.length})</TabsTrigger>
                    <TabsTrigger value="paid" className="flex-1 sm:flex-none">المسددة ({paidDebts.length})</TabsTrigger>
                </TabsList>

                <TabsContent value={filter} className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : displayedDebts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border-2 border-dashed">
                            {filter === 'active' ? "عظيم! لا توجد ديون نشطة." : "لا يوجد سجل للديون المسددة."}
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {displayedDebts.map(debt => (
                                <Link key={debt.id} href={`/debts/${debt.id}`}>
                                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer group border-t-4 border-t-primary">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex justify-between items-start">
                                                <span className="text-lg group-hover:text-primary transition-colors">{debt.creditorName}</span>
                                                <span className="text-2xl font-bold">{(debt.remainingAmount / 100).toLocaleString('ar-EG')}</span>
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {debt.principalAmount !== debt.remainingAmount ? "مبلغ جزئي" : "المبلغ الأصلي"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm text-muted-foreground">
                                                    <span>تاريخ البدء</span>
                                                    <span>{format(new Date(debt.startDate.seconds * 1000), "dd MMM yyyy", { locale: arEG })}</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span>المدفوع</span>
                                                        <span>{Math.round(((debt.principalAmount - debt.remainingAmount) / debt.principalAmount) * 100)}%</span>
                                                    </div>
                                                    <Progress value={((debt.principalAmount - debt.remainingAmount) / debt.principalAmount) * 100} className="h-2" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
