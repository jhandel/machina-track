"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItem } from "@/lib/constants";
import { AppLogo } from "@/components/common/AppLogo";
import { signOut, useSession } from "next-auth/react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, LogOut, User } from "lucide-react";
import React from "react";

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openSubmenus, setOpenSubmenus] = React.useState<
    Record<string, boolean>
  >({});

  const toggleSubmenu = (title: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const renderNavItem = (item: NavItem, isSubItem: boolean = false) => {
    const isActive = item.children
      ? pathname.startsWith(item.href)
      : pathname === item.href;
    const isSubmenuOpen = openSubmenus[item.title] ?? false;

    if (item.children) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            onClick={() => toggleSubmenu(item.title)}
            isActive={isActive}
            className="justify-between w-full"
            aria-expanded={isSubmenuOpen}
            aria-controls={`submenu-${item.title
              .toLowerCase()
              .replace(" ", "-")}`}
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </div>
            {isSubmenuOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </SidebarMenuButton>
          {isSubmenuOpen && (
            <SidebarMenuSub
              id={`submenu-${item.title.toLowerCase().replace(" ", "-")}`}
            >
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.title}>
                  <Link href={child.href}>
                    <SidebarMenuSubButton isActive={pathname === child.href}>
                      {child.icon && <child.icon className="h-4 w-4 mr-1" />}
                      {child.title}
                    </SidebarMenuSubButton>
                  </Link>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      );
    }

    const MenuButtonComponent = isSubItem
      ? SidebarMenuSubButton
      : SidebarMenuButton;

    return (
      <SidebarMenuItem key={item.title}>
        <Link href={item.href}>
          <MenuButtonComponent
            isActive={isActive}
            disabled={item.disabled}
            tooltip={item.title}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </MenuButtonComponent>
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <AppLogo showText={true} textSize="text-2xl" iconSize={30} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {NAV_ITEMS.map((item) => renderNavItem(item))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-2">
          {session?.user && (
            <div className="flex items-center gap-2 text-sm  px-2 py-1">
              <User className="h-4 w-4" />
              <span className="truncate">
                {session.user.name || session.user.email}
              </span>
            </div>
          )}
          <Button variant="default" onClick={handleSignOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
