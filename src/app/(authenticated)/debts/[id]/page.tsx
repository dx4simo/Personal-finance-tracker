"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { useAuth } from "@/components/providers/Providers";
import { Debt, DebtService, DebtPayment } from "@/lib/firebase/services/debtService";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, CheckCircle2, History, Trash2 } from "lucide-react";
import { PaymentModal } from "@/components/debts/PaymentModal";

export default function DebtDetailsPage() {
    const { id } = useParams() as { id: string };
    const { user } = useAuth();
    const router = useRouter();
    const [debt, setDebt] = useState<Debt | null>(null);
    const [payments, setPayments] = useState<DebtPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [d, p] = await Promise.all([
                DebtService.getDebt(user.uid, id),
                DebtService.getPayments(user.uid, id)
            ]);
            setDebt(d);
            setPayments(p);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, id]);

    if (loading) return <div className="flex h-full items-center justify-center p-10"><Loader2 className="animate-spin" /></div>;
    if (!debt) return <div className="text-center p-10">الدين غير موجود.</div>;

    const percentage = Math.round(((debt.principalAmount - debt.remainingAmount) / debt.principalAmount) * 100);

    const handleDelete = async () => {
        if (!confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟")) return;
        setLoading(true);
        try {
            await DebtService.deleteDebt(user!.uid, debt.id);
            router.push("/debts");
        } catch (e) {
            console.error(e);
            alert("فشل الحذف");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">تفاصيل الدين</h2>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="ml-2 h-4 w-4" /> حذف الدين
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2 bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>{debt.creditorName}</span>
                            {debt.status === 'paid' && <span className="flex items-center gap-2 text-green-600 bg-green-100 px-3 py-1 rounded-full text-base"><CheckCircle2 className="h-5 w-5" /> تم السداد</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-lg font-medium">
                                <span>المبلغ المتبقي</span>
                                <span>{(debt.remainingAmount / 100).toLocaleString('ar-EG')} / {(debt.principalAmount / 100).toLocaleString('ar-EG')}</span>
                            </div>
                            <Progress value={percentage} className="h-4" />
                            <p className="text-sm text-muted-foreground text-left px-1">تم سداد {percentage}%</p>
                        </div>

                        {debt.status === 'active' && (
                            <Button size="lg" className="w-full text-lg" onClick={() => setIsPaymentModalOpen(true)}>
                                تسجيل عملية سداد
                            </Button>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">معلومات إضافية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">تاريخ البدء</span>
                            <span className="font-medium">{format(new Date(debt.startDate.seconds * 1000), "PPP", { locale: arEG })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">الحالة</span>
                            <span className="font-medium">{debt.status === 'active' ? 'نشط' : 'مدفوع'}</span>
                        </div>
                        <div>
                            <span className="block text-muted-foreground mb-1">ملاحظات</span>
                            <p className="text-sm leading-relaxed">{debt.notes || "لا توجد ملاحظات"}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <History className="h-5 w-5" /> سجل المدفوعات
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {payments.length === 0 && <p className="text-muted-foreground text-center py-4">لا توجد مدفوعات مسجلة.</p>}
                            {payments.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-muted/40 rounded-lg border">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg">{(p.amount / 100).toLocaleString('ar-EG')}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(p.date.seconds * 1000), "PPP", { locale: arEG })}</span>
                                    </div>
                                    {p.notes && <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border">{p.notes}</span>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                debtId={debt.id}
                currentRemaining={debt.remainingAmount}
                onSuccess={fetchData}
            />
        </div>
    );
}
