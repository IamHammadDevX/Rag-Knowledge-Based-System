"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Database, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/branding/logo";
import ThemeToggle from "@/components/theme-toggle";

const features = [
  {
    title: "Modular Integrations",
    description: "Appwrite, Pinecone, Groq, and HuggingFace services scaffolded for fast activation.",
    icon: Layers,
  },
  {
    title: "Enterprise Security Shell",
    description: "Protected dashboard routes, auth state architecture, and ready-for-RBAC patterns.",
    icon: ShieldCheck,
  },
  {
    title: "RAG-Ready Data Plane",
    description: "Document metadata pipeline and chat orchestration layer designed for scalable RAG.",
    icon: Database,
  },
];

function App() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.22),transparent_30%),radial-gradient(circle_at_80%_0%,hsl(var(--chart-2)/0.22),transparent_25%)]" />
      <section className="container py-8 md:py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-4 md:p-6"
        >
          <div className="flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground">
                <Link href="/register">Start Free</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="container pb-16 pt-6 md:pb-20 md:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto max-w-4xl text-center"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Production-ready foundation for enterprise AI knowledge systems
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Build your <span className="gradient-text">RAG Knowledge Intelligence</span> platform faster
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
            Modern SaaS dashboard, protected routes, modular service layer, and RAG-ready architecture — without implementing final retrieval logic yet.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground">
              <Link href="/dashboard">
                Open Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Create Workspace</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="container pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ title, description, icon: Icon }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <Card className="glass h-full rounded-2xl border-white/20 shadow-xl shadow-primary/5 dark:border-white/10">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-chart-2/80 text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
