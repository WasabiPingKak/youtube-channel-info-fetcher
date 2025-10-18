import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardWrapperProps {
  children: React.ReactNode;
  delay?: number;
}

export default function StatCardWrapper({
  children,
  delay = 0,
}: StatCardWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="shadow-md">
        <CardContent className="p-4">{children}</CardContent>
      </Card>
    </motion.div>
  );
}
