import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-8">
      
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        <div className="space-y-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>System Operational</span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground text-balance">
            Project Initialized
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            The foundation has been laid. Your full-stack environment is ready for development.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl shadow-black/5">
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-2 p-4 rounded-lg bg-secondary/50">
                  <h3 className="font-semibold font-display">Frontend</h3>
                  <p className="text-sm text-muted-foreground">React + Tailwind + Framer Motion</p>
                </div>
                <div className="space-y-2 p-4 rounded-lg bg-secondary/50">
                  <h3 className="font-semibold font-display">Backend</h3>
                  <p className="text-sm text-muted-foreground">Express + Drizzle ORM + PostgreSQL</p>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="group text-base px-8">
                  Start Building
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8">
                  View Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pt-12 text-sm text-muted-foreground"
        >
          <p>Designed with a clean, minimal aesthetic.</p>
        </motion.footer>
      </motion.div>
    </div>
  );
}
