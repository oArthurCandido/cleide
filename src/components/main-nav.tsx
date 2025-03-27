"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calculator,
  ClipboardList,
  BarChart3,
  Home,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: <Home size={18} />,
  },
  {
    name: "Calculadora",
    href: "/calculator",
    icon: <Calculator size={18} />,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    name: "Pedidos",
    href: "/dashboard/orders",
    icon: <ClipboardList size={18} />,
  },
  {
    name: "Relatórios",
    href: "/dashboard/reports",
    icon: <BarChart3 size={18} />,
  },
  {
    name: "Configurações",
    href: "/settings",
    icon: <Settings size={18} />,
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary",
              isActive ? "text-primary font-semibold" : "text-muted-foreground",
            )}
          >
            {item.icon}
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
