"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/Providers";
import { Category, CategoryService } from "@/lib/firebase/services/categoryService";
import { Account, AccountService } from "@/lib/firebase/services/accountService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SettingsPage() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    // New Item States
    const [newCatName, setNewCatName] = useState("");
    const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
    const [newCatColor, setNewCatColor] = useState("#000000");

    const [newAccName, setNewAccName] = useState("");
    const [newAccType, setNewAccType] = useState<"cash" | "bank" | "credit">("cash");
    const [newAccBalance, setNewAccBalance] = useState("0");

    const fetchData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [cats, accs] = await Promise.all([
                CategoryService.getCategories(user.uid),
                AccountService.getAccounts(user.uid)
            ]);
            setCategories(cats);
            setAccounts(accs);
        } catch (error) {
            console.error("Failed to fetch settings data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleAddCategory = async () => {
        if (!user || !newCatName) return;
        await CategoryService.addCategory(user.uid, {
            name: newCatName,
            type: newCatType,
            color: newCatColor,
            icon: "circle", // Default
        });
        setNewCatName("");
        fetchData();
    };

    const handleDeleteCategory = async (id: string) => {
        if (!user) return;
        await CategoryService.deleteCategory(user.uid, id);
        fetchData();
    };

    const handleAddAccount = async () => {
        if (!user || !newAccName) return;
        await AccountService.addAccount(user.uid, {
            name: newAccName,
            type: newAccType,
            balance: Math.round(parseFloat(newAccBalance) * 100), // To minor units
        });
        setNewAccName("");
        setNewAccBalance("0");
        fetchData();
    };

    const handleDeleteAccount = async (id: string) => {
        if (!user) return;
        await AccountService.deleteAccount(user.uid, id);
        fetchData();
    };

    const handleUpdateAccount = async () => {
        if (!user || !editingAccount) return;
        await AccountService.updateAccount(user.uid, editingAccount.id, {
            name: editingAccount.name,
            balance: editingAccount.balance
        });
        setEditingAccount(null);
        fetchData();
    };

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">الإعدادات</h2>

            <Tabs defaultValue="categories" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="categories">التصنيفات</TabsTrigger>
                    <TabsTrigger value="accounts">الحسابات</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>إدارة التصنيفات</CardTitle>
                            <CardDescription>قم بإنشاء تصنيفات للمصروفات والدخل.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
                                <div className="grid gap-2 flex-1">
                                    <Label>اسم التصنيف</Label>
                                    <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="مثال: طعام، مواصلات" className="text-right" />
                                </div>
                                <div className="grid gap-2 w-full sm:w-[140px]">
                                    <Label>النوع</Label>
                                    <Select value={newCatType} onValueChange={(v: any) => setNewCatType(v)}>
                                        <SelectTrigger className="text-right">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="expense">مصروف</SelectItem>
                                            <SelectItem value="income">دخل</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAddCategory}><Plus className="h-4 w-4 mr-2" /> إضافة</Button>
                            </div>

                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${cat.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <span className="font-medium">{cat.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${cat.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {cat.type === 'income' ? 'دخل' : 'مصروف'}
                                            </span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                {categories.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground">لا توجد تصنيفات، قم بإضافة واحدة.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="accounts" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>إدارة الحسابات</CardTitle>
                            <CardDescription>إعداد المحافظ النقدية، الحسابات البنكية، والبطاقات.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
                                <div className="grid gap-2 flex-1">
                                    <Label>اسم الحساب</Label>
                                    <Input value={newAccName} onChange={(e) => setNewAccName(e.target.value)} placeholder="مثال: محفظتي، البنك الأهلي" className="text-right" />
                                </div>
                                <div className="grid gap-2 w-full sm:w-[140px]">
                                    <Label>النوع</Label>
                                    <Select value={newAccType} onValueChange={(v: any) => setNewAccType(v)}>
                                        <SelectTrigger className="text-right">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">كاش</SelectItem>
                                            <SelectItem value="bank">بنك</SelectItem>
                                            <SelectItem value="credit">بطاقة ائتمان</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2 w-full sm:w-[140px]">
                                    <Label>الرصيد الافتتاحي</Label>
                                    <Input
                                        type="number"
                                        value={newAccBalance}
                                        onChange={(e) => setNewAccBalance(e.target.value)}
                                        className="text-left font-mono"
                                        dir="ltr"
                                    />
                                </div>
                                <Button onClick={handleAddAccount}><Plus className="h-4 w-4 mr-2" /> إضافة</Button>
                            </div>

                            <div className="space-y-2">
                                {accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">{acc.name}</span>
                                            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded border">
                                                {acc.type === 'cash' ? 'كاش' : acc.type === 'bank' ? 'بنكي' : 'ائتمان'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold" dir="ltr">{(acc.balance / 100).toFixed(2)}</span>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingAccount(acc)}>
                                                <Pencil className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAccount(acc.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {accounts.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground">لا توجد حسابات مسجلة.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل الحساب</DialogTitle>
                    </DialogHeader>
                    {editingAccount && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>الاسم</Label>
                                <Input value={editingAccount.name} onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })} className="text-right" />
                            </div>
                            <div className="grid gap-2">
                                <Label>الرصيد</Label>
                                <Input
                                    type="number"
                                    value={(editingAccount.balance / 100).toString()}
                                    onChange={e => setEditingAccount({ ...editingAccount, balance: Math.round(parseFloat(e.target.value || "0") * 100) })}
                                    className="text-left font-mono"
                                    dir="ltr"
                                />
                            </div>
                            <Button onClick={handleUpdateAccount}>حفظ التعديلات</Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
