"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";
import { useAuth } from "@/components/providers/Providers";
import { Beneficiary, BeneficiaryRecord, BeneficiaryService, BeneficiaryPriority } from "../../../../lib/firebase/services/beneficiaryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowRight, Plus, Calendar as CalendarIcon, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<BeneficiaryPriority, string> = {
    high: "أولوية عالية",
    medium: "أولوية متوسطة",
    low: "يمكن تأجيله"
};

const PRIORITY_BG: Record<BeneficiaryPriority, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    low: "bg-slate-50 text-slate-700 border-slate-200"
};

export default function BeneficiaryDetailsPage() {
    const { id } = useParams() as { id: string };
    const { user } = useAuth();
    const router = useRouter();

    const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null);
    const [records, setRecords] = useState<BeneficiaryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

    // Add Record State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPriority, setEditPriority] = useState<BeneficiaryPriority>("medium");
    const [updating, setUpdating] = useState(false);

    // Edit Record State
    const [isEditRecordOpen, setIsEditRecordOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<{ id: string; amount: string; date: Date; notes: string } | null>(null);
    const [updatingRecord, setUpdatingRecord] = useState(false);

    const handleUpdateRecord = async () => {
        if (!user || !editingRecord || !beneficiary) return;
        setUpdatingRecord(true);
        try {
            const amountMinor = Math.round(parseFloat(editingRecord.amount) * 100);
            await BeneficiaryService.updateRecord(user.uid, beneficiary.id, editingRecord.id, {
                amount: amountMinor,
                date: editingRecord.date,
                notes: editingRecord.notes
            });
            setIsEditRecordOpen(false);
            setEditingRecord(null);
            fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingRecord(false);
        }
    };

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [b, r] = await Promise.all([
                BeneficiaryService.getBeneficiary(user.uid, id),
                BeneficiaryService.getRecords(user.uid, id)
            ]);
            setBeneficiary(b);
            if (b) {
                setEditName(b.name);
                setEditPriority(b.priority || "medium");
            }
            setRecords(r);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, id]);

    const handleUpdateBeneficiary = async () => {
        if (!user || !editName.trim() || !beneficiary) return;
        setUpdating(true);
        try {
            await BeneficiaryService.updateBeneficiary(user.uid, beneficiary.id, {
                name: editName,
                priority: editPriority
            });
            setIsEditOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    const handleAddRecord = async () => {
        if (!user || !amount || !beneficiary) return;
        setSubmitting(true);
        try {
            const amountMinor = Math.round(parseFloat(amount) * 100);
            await BeneficiaryService.addRecord(user.uid, beneficiary.id, amountMinor, date, notes);
            setAmount("");
            setNotes("");
            setIsAddOpen(false);
            fetchData(); // Refresh to update total and list
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredRecords = dateFilter
        ? records.filter((r: BeneficiaryRecord) => {
            // Ensure r.date is treated as a Timestamp
            const rDate = r.date.toDate();
            return rDate.getDate() === dateFilter.getDate() &&
                rDate.getMonth() === dateFilter.getMonth() &&
                rDate.getFullYear() === dateFilter.getFullYear();
        })
        : records;

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!beneficiary) return <div className="text-center p-10">المستفيد غير موجود.</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-bold tracking-tight">{beneficiary.name}</h2>
                            <Badge variant="outline" className={`${PRIORITY_BG[beneficiary.priority || 'medium']} border-0`}>
                                {PRIORITY_LABELS[beneficiary.priority || 'medium']}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            إجمالي المعطيات: <span className="text-primary font-bold text-lg">{(beneficiary.totalAmount / 100).toLocaleString('ar-EG')}</span>
                        </p>
                    </div>
                </div>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Pencil className="h-4 w-4" />
                            تعديل
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>تعديل بيانات المستفيد</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>الاسم</Label>
                                <Input
                                    value={editName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                                    className="text-right"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>الأولوية</Label>
                                <Select value={editPriority} onValueChange={(v: string) => setEditPriority(v as BeneficiaryPriority)}>
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
                            <Button onClick={handleUpdateBeneficiary} disabled={updating || !editName.trim()} className="w-full mt-4">
                                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                حفظ التغييرات
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("justify-start text-right font-normal gap-2", !dateFilter && "text-muted-foreground")}>
                                <CalendarIcon className="h-4 w-4" />
                                {dateFilter ? format(dateFilter, "PPP", { locale: arEG }) : "فلتر بالتاريخ"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} initialFocus locale={arEG} />
                        </PopoverContent>
                    </Popover>
                    {dateFilter && (
                        <Button variant="ghost" size="sm" onClick={() => setDateFilter(undefined)} className="text-red-500">
                            إلغاء الفلتر
                        </Button>
                    )}
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="ml-2 h-4 w-4" /> إضافة مبلغ جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إضافة مبلغ لـ {beneficiary.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid gap-2">
                                <Label>المبلغ</Label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                                    className="text-left font-mono"
                                    dir="ltr"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>التاريخ</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("justify-start text-right font-normal", !date && "text-muted-foreground")}>
                                            <CalendarIcon className="ml-2 h-4 w-4" />
                                            {date ? format(date, "PPP", { locale: arEG }) : <span>اختر التاريخ</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={date} onSelect={(d: Date | undefined) => d && setDate(d)} initialFocus locale={arEG} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label>ملاحظات</Label>
                                <Textarea value={notes} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} placeholder="مثال: زكاة، صدقة ..." className="text-right" />
                            </div>
                            <Button onClick={handleAddRecord} disabled={submitting} className="w-full">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                حفظ
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>سجل المعاملات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredRecords.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                لا توجد سجلات لعرضها {dateFilter ? "في هذا التاريخ" : ""}.
                            </div>
                        )}
                        {filteredRecords.map((rec: BeneficiaryRecord) => (
                            <div key={rec.id} className="flex flex-col p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-lg text-primary">{(rec.amount / 100).toLocaleString('ar-EG')}</span>
                                        <span className="text-sm text-muted-foreground">{format(rec.date.toDate(), "PPP", { locale: arEG })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {rec.notes && (
                                            <div className="bg-secondary/50 px-3 py-1.5 rounded text-sm">
                                                {rec.notes}
                                            </div>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setEditingRecord({
                                                    id: rec.id,
                                                    amount: (rec.amount / 100).toString(),
                                                    date: rec.date.toDate(),
                                                    notes: rec.notes || ""
                                                });
                                                setIsEditRecordOpen(true);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditRecordOpen} onOpenChange={setIsEditRecordOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل المعاملة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>المبلغ</Label>
                            <Input
                                type="number"
                                value={editingRecord?.amount || ""}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingRecord(prev => prev ? { ...prev, amount: e.target.value } : null)}
                                className="text-left font-mono"
                                dir="ltr"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>التاريخ</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn("justify-start text-right font-normal", !editingRecord?.date && "text-muted-foreground")}>
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {editingRecord?.date ? format(editingRecord.date, "PPP", { locale: arEG }) : <span>اختر التاريخ</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={editingRecord?.date}
                                        onSelect={(d: Date | undefined) => d && setEditingRecord(prev => prev ? { ...prev, date: d } : null)}
                                        initialFocus
                                        locale={arEG}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label>ملاحظات</Label>
                            <Textarea
                                value={editingRecord?.notes || ""}
                                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingRecord(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                className="text-right"
                            />
                        </div>
                        <Button onClick={handleUpdateRecord} disabled={updatingRecord} className="w-full">
                            {updatingRecord && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            حفظ التعديلات
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
