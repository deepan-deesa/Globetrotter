import { Suspense, lazy } from "react";
import { motion } from "framer-motion";

const Spline = lazy(() => import("@splinetool/react-spline"));

export default function AuthLayout({ children, title, subtitle }: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side: Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-20 xl:px-32 z-10 bg-background/80 backdrop-blur-sm"
      >
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <img src="/favicon.png" alt="GlobeTrotter Logo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold tracking-tight">GlobeTrotter</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {children}
        </div>
      </motion.div>

      {/* Right side: 3D Scene */}
      <div className="hidden lg:block flex-1 relative bg-muted/30 overflow-hidden">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-muted/10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <div className="absolute inset-0 w-full h-full scale-110">
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-primary/5" />
          </div>
        </Suspense>

        {/* Dark wash for readability of overlaid text if any */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />

        <div className="absolute bottom-12 left-12 right-12 z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="p-6 rounded-xl bg-background/20 backdrop-blur-md border border-white/10"
          >
            <p className="text-lg font-medium text-foreground italic">
              "The world is a book and those who do not travel read only one page."
            </p>
            <p className="mt-2 text-sm text-muted-foreground">— Saint Augustine</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
