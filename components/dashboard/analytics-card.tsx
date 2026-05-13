"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalyticsCardProps = {
  title: string;
  value: string;
  hint: string;
  delay?: number;
};

function AnalyticsCard({ title, value, hint, delay = 0 }: AnalyticsCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <Card className="glass rounded-2xl border-white/20 shadow-lg dark:border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AnalyticsCard;
