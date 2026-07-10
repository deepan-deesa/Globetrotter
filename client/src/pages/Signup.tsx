import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, UserPlus } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export default function Signup() {
  const { register, isRegistering, registerError } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = `${firstName} ${lastName}`.trim();

    try {
      register({ email, name, password });
    } catch (error) {
      toast({
        title: "Registration failed",
        description: registerError?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Join GlobeTrotter to start planning your next journey"
    >
      <motion.form
        className="space-y-5"
        onSubmit={handleSubmit}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="grid grid-cols-2 gap-4" variants={itemVariants}>
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Input
                id="firstName"
                placeholder="Jane"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-muted/50 focus-visible:ring-primary/30 transition-all duration-300 hover:bg-muted/70"
              />
            </motion.div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Input
                id="lastName"
                placeholder="Doe"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-muted/50 focus-visible:ring-primary/30 transition-all duration-300 hover:bg-muted/70"
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="email">Email</Label>
          <motion.div
            whileFocus={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted/50 focus-visible:ring-primary/30 transition-all duration-300 hover:bg-muted/70"
            />
          </motion.div>
        </motion.div>

        <motion.div className="space-y-2" variants={itemVariants}>
          <Label htmlFor="password">Password</Label>
          <motion.div
            whileFocus={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-muted/50 focus-visible:ring-primary/30 transition-all duration-300 hover:bg-muted/70"
            />
          </motion.div>
          <motion.p
            className="text-[11px] text-muted-foreground pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Must be at least 8 characters long with a mix of letters and numbers.
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {registerError && (
            <motion.div
              className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {registerError.message}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="pt-2"
          variants={itemVariants}
        >
          <motion.div
            whileHover={{ scale: 1.03, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Button
              type="submit"
              className="w-full h-11 font-semibold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ gap: "0.75rem" }}
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </motion.div>
              )}
            </Button>
          </motion.div>
        </motion.div>

        <motion.p
          className="text-center text-sm text-muted-foreground mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Already have an account?{" "}
          <Link href="/login">
            <motion.a
              className="font-semibold text-primary hover:underline underline-offset-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign in
            </motion.a>
          </Link>
        </motion.p>

        <motion.p
          className="text-[11px] text-center text-muted-foreground px-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          By clicking continue, you agree to our{" "}
          <a className="underline underline-offset-2 hover:text-primary transition-colors">Terms of Service</a>{" "}
          and{" "}
          <a className="underline underline-offset-2 hover:text-primary transition-colors">Privacy Policy</a>.
        </motion.p>
      </motion.form>
    </AuthLayout>
  );
}
