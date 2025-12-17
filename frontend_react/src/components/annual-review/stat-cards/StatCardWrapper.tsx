import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardWrapperProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export default function StatCardWrapper({
  children,
  delay = 0,
  className = "",
}: StatCardWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card className={`shadow-md h-full ${className}`}>
        <CardContent className="p-4 h-full">{children}</CardContent>
      </Card>
    </motion.div>
  );
}
