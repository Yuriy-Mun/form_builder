"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, FileText } from "lucide-react";
import Link from "next/link";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <div className="flex items-center space-x-2 mb-8">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">FormBuilder</span>
        </div>
        
        <nav className="flex flex-col space-y-4">
          <a 
            href="#features" 
            className="text-lg font-medium hover:text-primary transition-colors"
            onClick={() => setOpen(false)}
          >
            Функции
          </a>
          <a 
            href="#about" 
            className="text-lg font-medium hover:text-primary transition-colors"
            onClick={() => setOpen(false)}
          >
            О нас
          </a>
          
          <div className="pt-6 space-y-3">
            <Link href="/admin/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Войти
              </Button>
            </Link>
            <Link href="/admin/login" onClick={() => setOpen(false)}>
              <Button className="w-full">
                Попробовать
              </Button>
            </Link>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
} 