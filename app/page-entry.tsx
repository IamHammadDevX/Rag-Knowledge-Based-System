"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Database,
  FileSearch,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/branding/logo";
import ThemeToggle from "@/components/theme-toggle";

const features = [
  {
    title: "Context-rich Retrieval",
    description: "Chunked ingestion + embeddings + Pinecone retrieval engineered for enterprise knowledge recall.",
    icon: FileSearch,
  },
  {
    title: "Live AI Responses",
    description: "Groq-powered assistant grounded on your internal documents with persisted conversation memory.",
    icon: MessageSquareText,
  },
  {
    title: "Secure Enterprise Stack",
    description: "Appwrite auth, storage, and database foundation with protected routes and session persistence.",
    icon: ShieldCheck,
  },
];

const pipeline = [
  { label: "Upload", icon: Database },
  { label: "Extract + Chunk", icon: Workflow },
  { label: "Embed + Index", icon: BrainCircuit },
  { label: "Answer with Context", icon: Sparkles },
];

function App() {
  return (
    <main className="relative overflow-hidden pb-14">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_18%,hsl(var(--primary)/0.28),transparent_32%),radial-gradient(circle_at_85%_5%,hsl(var(--chart-2)/0.22),transparent_30%),radial-gradient(circle_at_70%_75%,hsl(var(--chart-4)/0.16),transparent_35%)]" suppressHydrationWarning />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-[-120px] -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 18, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 10, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[-120px] top-[180px] -z-10 h-80 w-80 rounded-full bg-chart-2/20 blur-3xl"
        animate={{ x: [0, -35, 0], y: [0, -14, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 11, ease: "easeInOut" }}
      />

      <section className="container py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass rounded-2xl px-4 py-4 md:px-6"
        >
          <div className="flex items-center justify-between gap-3">
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

      <section className="container py-8 md:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            <Badge className="mb-4 bg-primary/15 text-primary hover:bg-primary/20">
              AI Knowledge Intelligence for modern teams
            </Badge>
            <h1 className="text-balance text-4xl font-bold leading-tight md:text-6xl">
              Turn enterprise documents into <span className="gradient-text">instant, trusted answers</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
              Upload contracts, audits, playbooks, and manuals. Our live RAG pipeline extracts, indexes, and grounds every answer so your teams get context-aware intelligence in seconds.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-chart-2 text-primary-foreground">
                <Link href="/dashboard">
                  Launch Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/upload">Test Upload Pipeline</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-4"
          >
            <Card className="glass rounded-2xl border-white/20 shadow-xl shadow-primary/10 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Live RAG Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {pipeline.map(({ label, icon: Icon }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.25 + index * 0.1 }}
                    className="flex items-center justify-between rounded-xl border bg-background/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="h-4 w-4 text-primary" />
                      {label}
                    </div>
                    <span className="text-xs text-muted-foreground">Active</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { k: "4", v: "Live Integrations" },
                { k: "1MB", v: "Chunk Upload Blocks" },
                { k: "<3s", v: "Typical AI Turnaround" },
              ].map((item) => (
                <Card key={item.v} className="glass rounded-xl border-white/20 dark:border-white/10">
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-semibold">{item.k}</p>
                    <p className="text-xs text-muted-foreground">{item.v}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container pt-4">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ title, description, icon: Icon }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 + index * 0.1 }}
            >
              <Card className="glass h-full rounded-2xl border-white/20 shadow-lg dark:border-white/10">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/85 to-chart-2/85 text-primary-foreground">
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
