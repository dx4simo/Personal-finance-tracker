"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, WalletCards, Users, Settings, LogOut, HeartHandshake } from "lucide-react";
import { useAuth } from "@/components/providers/Providers";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const { signOut } = useAuth();

    const routes = [
        {
            href: "/dashboard",
            label: "لوحة التحكم",
            icon: LayoutDashboard,
            active: pathname === "/dashboard",
        },
        {
            href: "/transactions",
            label: "المعاملات المالية",
            icon: WalletCards,
            active: pathname.startsWith("/transactions"),
        },
        {
            href: "/debts",
            label: "الديون والأقساط",
            icon: Users,
            active: pathname.startsWith("/debts"),
        },
        {
            href: "/settings",
            label: "الإعدادات",
            icon: Settings,
            active: pathname.startsWith("/settings"),
        },
        {
            href: "/bab-allah",
            label: "باب الله",
            icon: HeartHandshake,
            active: pathname.startsWith("/bab-allah"),
        },
    ];

    return (
        <div className={cn("pb-12 h-screen px-4 py-6 border-l bg-card", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-6 px-4 text-2xl font-bold tracking-tight text-primary">
                        محفظتي
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Button
                                key={route.href}
                                variant={route.active ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-4 text-lg font-medium",
                                    route.active && "bg-primary/10 text-primary"
                                )}
                                asChild
                                onClick={onNavigate}
                            >
                                <Link href={route.href}>
                                    <route.icon className="h-5 w-5" />
                                    {route.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="absolute bottom-4 w-full px-7 right-0">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-4 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => signOut()}
                >
                    <LogOut className="h-5 w-5" />
                    تسجيل الخروج
                </Button>
            </div>
        </div>
    );
}
