import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { motion } from "framer-motion";
import { ProtectedRoute } from "./ProtectedRoute";
import heroBg from "@/assets/hero-bg.jpg";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full flex relative overflow-hidden" style={{ backgroundColor: 'hsl(240, 10%, 4%)' }}>
        {/* Animated Background */}
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        </div>

        {/* Floating particles effect */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                opacity: 0.2 
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)],
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

        <Sidebar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 ml-0 md:ml-[280px] transition-all duration-300 relative z-10"
          style={{ backgroundColor: 'transparent' }}
        >
          <div className="p-8 relative z-10">
            {children}
          </div>
        </motion.main>
      </div>
    </ProtectedRoute>
  );
};
