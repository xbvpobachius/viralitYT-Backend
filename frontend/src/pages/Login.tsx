import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chrome } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ACCESS_PASSWORD, hasAccess, persistAccess } from "@/lib/access";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const navigate = useNavigate();
  const isPasswordValid = passwordInput === ACCESS_PASSWORD;

  useEffect(() => {
    if (hasAccess()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleContinue = () => {
    if (!isPasswordValid) {
      toast.error("Contraseña incorrecta");
      return;
    }
    setLoading(true);
    persistAccess();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.2 
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-panel rounded-3xl p-8 deep-shadow">
          {/* Title */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center mb-10"
          >
            <h1 
              className="text-8xl md:text-9xl font-black mb-6 tracking-wider"
              style={{
                color: '#ff3333',
                textShadow: `
                  0 0 10px rgba(255, 51, 51, 0.8),
                  0 0 20px rgba(255, 51, 51, 0.6),
                  0 0 30px rgba(255, 0, 0, 0.5),
                  0 0 40px rgba(255, 0, 0, 0.4),
                  0 0 70px rgba(255, 0, 0, 0.3),
                  0 0 100px rgba(255, 0, 0, 0.2)
                `,
                fontFamily: '"Poppins", sans-serif',
                fontWeight: 900,
                letterSpacing: '0.05em'
              }}
            >
              VIRALITYT
            </h1>
          </motion.div>

          {/* Google Sign In */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2 text-center">
                Acceso restringido
              </p>
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Contraseña"
                className="h-14 text-lg border-2 border-primary/40 focus:border-primary rounded-xl text-center tracking-[0.3em] uppercase"
                autoFocus
              />
              {!isPasswordValid && passwordInput.length > 0 && (
                <p className="text-xs text-center text-red-400 mt-2">
                  La contraseña es incorrecta
                </p>
              )}
            </div>

            <Button 
              onClick={handleContinue}
              disabled={loading || !isPasswordValid}
              className="w-full h-16 text-lg gradient-primary hover:opacity-90 transition-all duration-300 glow-red-hover font-medium rounded-xl group"
            >
              <Chrome className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
              Entrar
            </Button>

            <p className="text-center text-base text-muted-foreground mt-4">
              ViralitYT - Roblox Automation Platform
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
