'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
interface ResponsiveWidgetModalProps {
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  trigger?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ResponsiveWidgetModal({
  title,
  isOpen,
  onOpenChange,
  children,
  trigger,
  footer,
}: ResponsiveWidgetModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until we know if we're on mobile or desktop
  if (!isMounted) {
    return null;
  }

  // Use Sheet on desktop, Drawer on mobile
  if (!isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent side="right" className="md:max-w-[500px] h-[90%] md:h-full overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="px-4 flex-1 h-[80%]">
            {children}
          </ScrollArea>
          {footer && (
            <SheetFooter className="pt-4 border-t mt-4">
              {footer}
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="h-[80vh] max-h-[90vh] flex flex-col">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="px-4 flex-1 h-[80%]">
          {children}
        </ScrollArea>
        {footer && (
          <DrawerFooter className="border-t mt-2 px-4 py-4">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
} 