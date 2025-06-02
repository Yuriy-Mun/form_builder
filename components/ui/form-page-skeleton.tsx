"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FormPageSkeleton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setIsVisible(true);
  }, []);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const shimmerVariants = {
    initial: { x: "-100%" },
    animate: {
      x: "100%",
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "linear"
      }
    }
  };

  const pulseVariants = {
    initial: { opacity: 0.6 },
    animate: {
      opacity: 1,
      transition: {
        repeat: Infinity,
        repeatType: "reverse" as const,
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div> */}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8"
      >
        {/* Main Form Card - matching ThemedFormRenderer structure */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-sm relative overflow-hidden">
            {/* CardHeader - matching the actual form header */}
            <CardHeader className="pb-6 pt-6 px-6">
              <motion.div
                variants={itemVariants}
                className="text-center space-y-3"
              >
                {/* Decorative element */}
                <div className="flex justify-center mb-4">
                  <Skeleton className="w-16 h-1 rounded-full relative overflow-hidden">
                    <motion.div
                      variants={shimmerVariants}
                      initial="initial"
                      animate="animate"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                    />
                  </Skeleton>
                </div>
                
                {/* Form title */}
                <motion.div variants={pulseVariants} initial="initial" animate="animate">
                  <Skeleton className="h-8 w-3/4 mx-auto relative overflow-hidden">
                    <motion.div
                      variants={shimmerVariants}
                      initial="initial"
                      animate="animate"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                  </Skeleton>
                </motion.div>
                
                {/* Form description */}
                <Skeleton className="h-5 w-2/3 mx-auto" />
                
                {/* Progress bar */}
                <div className="flex justify-center mt-4">
                  <Skeleton className="w-24 h-1 rounded-full relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary to-primary/30"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear"
                      }}
                    />
                  </Skeleton>
                </div>
              </motion.div>
            </CardHeader>

            <CardContent className="pb-6 px-6">
              <div className="space-y-5">
                {/* Form Fields */}
                {[1, 2, 3, 4, 5].map((index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-32" />
                      {index === 2 && (
                        <div className="w-2 h-2 bg-destructive/60 rounded-full animate-pulse" />
                      )}
                    </div>
                    
                    {/* Different field types */}
                    {index % 4 === 0 ? (
                      // Text area
                      <Skeleton className="h-24 w-full relative overflow-hidden">
                        <motion.div
                          variants={shimmerVariants}
                          initial="initial"
                          animate="animate"
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        />
                      </Skeleton>
                    ) : index % 3 === 0 ? (
                      // Select/dropdown
                      <div className="space-y-2">
                        <Skeleton className="h-11 w-full relative overflow-hidden">
                          <motion.div
                            variants={shimmerVariants}
                            initial="initial"
                            animate="animate"
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          />
                        </Skeleton>
                      </div>
                    ) : index % 2 === 0 ? (
                      // Radio buttons
                      <div className="space-y-3">
                        {[1, 2, 3].map((option) => (
                          <div key={option} className="flex items-center space-x-3">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Regular input
                      <Skeleton className="h-11 w-full relative overflow-hidden">
                        <motion.div
                          variants={shimmerVariants}
                          initial="initial"
                          animate="animate"
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        />
                      </Skeleton>
                    )}
                  </motion.div>
                ))}

                {/* Separator */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <Skeleton className="w-full h-px" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-card">
                      <Skeleton className="h-4 w-20" />
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="pt-2">
                  <Skeleton className="h-12 w-full relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.5,
                        ease: "linear"
                      }}
                    />
                  </Skeleton>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="fixed bottom-8 right-8 flex items-center space-x-2 bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
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
                duration: 1.5,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground font-medium">Loading form...</span>
      </motion.div>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="relative overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 animate-pulse" />
        
        <CardHeader className="space-y-3">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    </div>
  );
} 