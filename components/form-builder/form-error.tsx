"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface FormErrorProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function FormError({ title, message, action }: FormErrorProps) {
  return (
    <div className="max-w-3xl mx-auto p-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border bg-card shadow-sm overflow-hidden">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center">
              <div className="bg-destructive/10 rounded-full p-3 mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-destructive mb-2">{title}</h2>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              {action && (
                <Button 
                  onClick={action.onClick}
                  variant="destructive"
                >
                  {action.label}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 