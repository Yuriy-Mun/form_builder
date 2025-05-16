"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FormSkeleton() {
  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="max-w-3xl mx-auto p-5">
      <Card className="border bg-card shadow-sm overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
        </div>
        
        <CardHeader className="pb-4 relative z-10 space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map((_, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fieldVariants}
              className="space-y-2"
            >
              <Skeleton className="h-5 w-1/4 mb-2" />
              <Skeleton className="h-10 w-full" />
            </motion.div>
          ))}
          
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
    </div>
  );
} 