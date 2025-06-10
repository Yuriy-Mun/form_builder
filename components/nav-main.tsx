"use client"

import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useState } from "react"
import Link from "next/link"
import { QuickCreateDialog } from "@/components/quick-create-dialog"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    actionUrl?: string
    actionIcon?: any // Using any temporarily to avoid type conflicts
  }[]
}) {
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                onClick={() => setShowQuickCreate(true)}
              >
                <IconCirclePlusFilled />
                <span>Quick Create</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <Link href={item.url} prefetch={false}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.actionUrl && (
                  <SidebarMenuAction asChild>
                    <Link href={item.actionUrl} prefetch={false}>
                      {item.actionIcon && <item.actionIcon aria-hidden="true" />}
                      <span className="sr-only">Add {item.title}</span>
                    </Link>
                  </SidebarMenuAction>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <QuickCreateDialog
        open={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
      />
    </>
  )
}
