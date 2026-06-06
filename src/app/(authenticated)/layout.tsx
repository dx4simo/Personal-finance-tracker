"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Desktop Sidebar - Right Side for RTL */}
            <aside className="hidden w-64 border-l md:block shrink-0">
                <div className="h-full fixed w-64 right-0 top-0">
                    <Sidebar className="h-full border-l" />
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden sticky top-0 z-50 justify-between">
                <div className="font-bold text-lg">محفظتي</div>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">قائمة التنقل</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-72">
                        <Sidebar className="border-none" onNavigate={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </header>

            {/* Main Content */}
            <main className="flex-1 space-y-4 p-4 md:p-8 pt-6 md:mr-64 overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
