"use client"

import * as React from "react"
import {
  IconHelp,
  IconInnerShadowTop,
  IconLock,
  IconPlus, IconUserShield,
  IconClipboardList,
  IconChartBar,
  IconUsers,
  IconHome
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/admin",
      icon: IconHome,
    },
    {
      title: "Forms",
      url: "/admin/forms",
      icon: IconClipboardList,
      actionUrl: "/admin/forms/add",
      actionIcon: IconPlus,
    },
    {
      title: "Dashboards",
      url: "/admin/dashboards",
      icon: IconChartBar,
      actionUrl: "/admin/dashboards/add",
      actionIcon: IconPlus,
    },

  ],
  navSecondary: [
    {
      title: "Roles",
      url: "/admin/roles",
      icon: IconUserShield,
      actionUrl: "/admin/roles/add",
      actionIcon: IconPlus,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Permissions",
      url: "/admin/permissions",
      icon: IconLock,
      actionUrl: "/admin/permissions/add",
      actionIcon: IconPlus,
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/admin">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">FormBuilder</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto pb-0" />
        <SidebarGroup className="pt-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="#">
                    <IconHelp />
                    <span>Get Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
