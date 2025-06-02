"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

export function FormResponsesSkeleton() {
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-6 space-y-6"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 relative overflow-hidden">
              <motion.div
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            </Skeleton>
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Filters Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Button variant="outline" size="sm" disabled>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Skeleton className="h-10 w-full pl-10" />
            </div>
            
            {/* Field Selection */}
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((index) => (
                <Skeleton key={index} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="border-b">
              <div className="grid grid-cols-6 gap-4 p-4 bg-muted/50">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-18" />
                <Skeleton className="h-4 w-22" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            
            {/* Table Rows */}
            <div className="divide-y">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="grid grid-cols-6 gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <Skeleton className="h-4 w-full relative overflow-hidden">
                    <motion.div
                      variants={shimmerVariants}
                      initial="initial"
                      animate="animate"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    />
                  </Skeleton>
                  <Skeleton className="h-4 w-full relative overflow-hidden">
                    <motion.div
                      variants={shimmerVariants}
                      initial="initial"
                      animate="animate"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                    />
                  </Skeleton>
                  <Skeleton className="h-4 w-full relative overflow-hidden">
                    <motion.div
                      variants={shimmerVariants}
                      initial="initial"
                      animate="animate"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      style={{ animationDelay: `${index * 0.1 + 0.4}s` }}
                    />
                  </Skeleton>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination Section */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" />
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((page) => (
              <Skeleton key={page} className="h-9 w-9" />
            ))}
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 relative overflow-hidden">
                  <motion.div
                    variants={shimmerVariants}
                    initial="initial"
                    animate="animate"
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                  />
                </Skeleton>
                <Skeleton className="h-3 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </motion.div>
  );
}

export function CompactFormResponsesSkeleton() {
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-6 space-y-4"
    >
      {/* Compact Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-8 w-20" />
      </motion.div>

      {/* Compact Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-0">
            <div className="border-b bg-muted/50 p-3">
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
            
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map((index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="grid grid-cols-4 gap-4 p-3"
                >
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-6" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Compact Pagination */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <div className="flex space-x-1">
          {[1, 2, 3].map((page) => (
            <Skeleton key={page} className="h-8 w-8" />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MobileFormResponsesSkeleton() {
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-4 space-y-4"
    >
      {/* Mobile Header */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48" />
      </motion.div>

      {/* Mobile Search */}
      <motion.div variants={itemVariants}>
        <Skeleton className="h-10 w-full" />
      </motion.div>

      {/* Mobile Response Cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mobile Pagination */}
      <motion.div variants={itemVariants} className="flex justify-center pt-4">
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-16" />
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ResponsiveFormResponsesSkeleton() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (isMobile) {
    return <MobileFormResponsesSkeleton />;
  }

  return <FormResponsesSkeleton />;
}

export function EmptyFormResponsesSkeleton() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-12 text-center space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-center space-x-4">
          <Button variant="ghost" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
      </motion.div>

      {/* Empty State Illustration */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <motion.div
          variants={pulseVariants}
          initial="initial"
          animate="animate"
          className="relative"
        >
          <div className="w-32 h-32 rounded-full bg-muted/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          </div>
          
          {/* Floating elements */}
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary/20"
            animate={{
              y: [0, -10, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-secondary/20"
            animate={{
              y: [0, 10, 0],
              rotate: [0, -180, -360]
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </motion.div>
      </motion.div>

      {/* Empty State Text */}
      <motion.div variants={itemVariants} className="space-y-4 max-w-md mx-auto">
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Skeleton className="h-4 w-56 mx-auto" />
      </motion.div>

      {/* Action Buttons */}
      <motion.div variants={itemVariants} className="flex justify-center space-x-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </motion.div>

      {/* Stats Placeholder */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
        {[1, 2, 3].map((index) => (
          <Card key={index} className="border-dashed">
            <CardContent className="p-6 text-center">
              <Skeleton className="h-8 w-8 mx-auto mb-3 rounded-full" />
              <Skeleton className="h-4 w-16 mx-auto mb-2" />
              <Skeleton className="h-6 w-8 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </motion.div>
  );
} 