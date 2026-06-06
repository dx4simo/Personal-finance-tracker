"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/Providers";
import { Beneficiary, BeneficiaryService, BeneficiaryPriority } from "../../../lib/firebase/services/beneficiaryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, HeartHandshake, Loader2, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const PRIORITY_LABELS: Record<BeneficiaryPriority, string> = {
    high: "أولوية عالية",
    medium: "أولوية متوسطة",
    low: "يمكن تأجيله"
};

const PRIORITY_COLORS: Record<BeneficiaryPriority, string> = {
    high: "text-red-500 border-red-200",
    medium: "text-blue-500 border-blue-200",
    low: "text-slate-500 border-slate-200"
};

const PRIORITY_BG: Record<BeneficiaryPriority, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    low: "bg-slate-50 text-slate-700 border-slate-200"
};

export default function BabAllahPage() {
    const { user } = useAuth();
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newPriority, setNewPriority] = useState<BeneficiaryPriority>("medium");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filter, setFilter] = useState<BeneficiaryPriority | "all">("all");

    // New state for month filter
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());
    const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
    const [loadingTotal, setLoadingTotal] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await BeneficiaryService.getBeneficiaries(user.uid);
            setBeneficiaries(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyTotal = async () => {
        if (!user) return;
        setLoadingTotal(true);
        try {
            const total = await BeneficiaryService.getMonthlyTotal(user.uid, parseInt(selectedYear), parseInt(selectedMonth));
            setMonthlyTotal(total);
        } catch (error) {
            console.error("Error fetching monthly total:", error);
        } finally {
            setLoadingTotal(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Fetch total whenever date filter changes
    useEffect(() => {
        fetchMonthlyTotal();
    }, [user, selectedYear, selectedMonth, beneficiaries]); // Re-fetch if beneficiaries change (e.g. added new one)

    useEffect(() => {
        if (filter === "all") {
            setFilteredBeneficiaries(beneficiaries);
        } else {
            setFilteredBeneficiaries(beneficiaries.filter((b: Beneficiary) => b.priority === filter));
        }
    }, [beneficiaries, filter]);

    const handleAdd = async () => {
        if (!user || !newName.trim()) return;
        setLoading(true);
        try {
            await BeneficiaryService.addBeneficiary(user.uid, newName, newPriority);
            setNewName("");
            setNewPriority("medium");
            setIsDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && beneficiaries.length === 0) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;

    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

    return (
        <div className="space-y-6">
            {/* Top Bar with Total & Filter */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-full bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium text-primary">
                            إجمالي {months[parseInt(selectedMonth)]} {selectedYear}
                        </CardTitle>
                        <div className="flex gap-2">
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[120px] bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map((m, i) => (
                                        <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[100px] bg-background">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loadingTotal ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                            <div className="text-4xl font-bold font-mono text-primary">
                                {(monthlyTotal / 100).toLocaleString('ar-EG', { style: 'currency', currency: 'EGP' })}
                            </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                            مجموع المبالغ المصروفة في هذا الشهر
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-primary">bab allah</h2>
                    <p className="text-muted-foreground mt-1">سجل الخير والصدقات ({beneficiaries.length} مستفيد)</p>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="gap-2">
                                <Plus className="h-5 w-5" /> إضافة اسم جديد
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>إضافة مستفيد جديد</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">الاسم</label>
                                    <Input
                                        placeholder="اسم الشخص أو الجهة"
                                        value={newName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                                        className="text-right"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">الأولوية</label>
                                    <Select value={newPriority} onValueChange={(v: string) => setNewPriority(v as BeneficiaryPriority)}>
                                        <SelectTrigger dir="rtl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="high">عالية (مستعجل)</SelectItem>
                                            <SelectItem value="medium">متوسطة</SelectItem>
                                            <SelectItem value="low">منخفضة (يمكن تأجيله)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAdd} className="w-full mt-4" disabled={!newName.trim()}>
                                    حفظ
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/30 p-2 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-sm px-2">
                    <Filter className="w-4 h-4" />
                    <span>تصفية حسب الأولوية:</span>
                </div>
                <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as BeneficiaryPriority | "all")} dir="rtl" className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                        <TabsTrigger value="all">الكل</TabsTrigger>
                        <TabsTrigger value="high">عالية</TabsTrigger>
                        <TabsTrigger value="medium">متوسطة</TabsTrigger>
                        <TabsTrigger value="low">مؤجلة</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBeneficiaries.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border-dashed border-2">
                        {beneficiaries.length === 0
                            ? "لا يوجد مستفيدين مسجلين. ابدأ بإضافة اسم."
                            : "لا يوجد نتائج لهذا الفلتر."}
                    </div>
                )}
                {filteredBeneficiaries.map((ben: Beneficiary) => (
                    <Link key={ben.id} href={`/bab-allah/${ben.id}`}>
                        <Card className={`hover:bg-muted/50 transition-all cursor-pointer group border-t-4 shadow-sm hover:shadow-md ${PRIORITY_COLORS[ben.priority] || PRIORITY_COLORS.medium}`}>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex justify-between items-start">
                                    <span className="text-xl text-foreground font-semibold group-hover:text-primary transition-colors">{ben.name}</span>
                                    <Badge variant="outline" className={`${PRIORITY_BG[ben.priority] || PRIORITY_BG.medium} border-0`}>
                                        {PRIORITY_LABELS[ben.priority] || PRIORITY_LABELS.medium}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-end mt-4">
                                    <span className="text-sm text-muted-foreground">إجمالي ما تم تقديمه</span>
                                    <span className="text-2xl font-bold font-mono">{(ben.totalAmount / 100).toLocaleString('ar-EG')}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
