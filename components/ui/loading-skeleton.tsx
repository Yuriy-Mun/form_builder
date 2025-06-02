"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "default" | "card" | "list" | "table" | "form";
  className?: string;
  lines?: number;
  showPulse?: boolean;
}

export function LoadingSkeleton({ 
  variant = "default", 
  className,
  lines = 3,
  showPulse = true 
}: LoadingSkeletonProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const shimmerVariants = {
    initial: { x: "-100%" },
    animate: {
      x: "100%",
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear"
      }
    }
  };

  if (variant === "card") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("p-6 border rounded-lg bg-card space-y-4", className)}
      >
        <motion.div variants={itemVariants}>
          <Skeleton className="h-6 w-3/4 relative overflow-hidden">
            {showPulse && (
              <motion.div
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            )}
          </Skeleton>
        </motion.div>
        <motion.div variants={itemVariants}>
          <Skeleton className="h-4 w-1/2" />
        </motion.div>
        <motion.div variants={itemVariants} className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (variant === "list") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-3", className)}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            className="flex items-center space-x-3"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (variant === "table") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-3", className)}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex space-x-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 flex-1" />
          ))}
        </motion.div>
        
        {/* Rows */}
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div key={i} variants={itemVariants} className="flex space-x-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-8 flex-1" />
            ))}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (variant === "form") {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("space-y-6", className)}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <motion.div key={i} variants={itemVariants} className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full relative overflow-hidden">
              {showPulse && (
                <motion.div
                  variants={shimmerVariants}
                  initial="initial"
                  animate="animate"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
              )}
            </Skeleton>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("space-y-3", className)}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div key={i} variants={itemVariants}>
          <Skeleton 
            className={cn(
              "h-4",
              i === 0 && "w-3/4",
              i === 1 && "w-1/2", 
              i >= 2 && "w-full"
            )}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Specialized loading states
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          {/* Content */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="card" lines={3} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function InlineLoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );
} 