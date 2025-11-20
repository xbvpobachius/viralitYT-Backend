import { motion } from "framer-motion";
import { NavLink } from "@/components/NavLink";
import { 
  LayoutDashboard, 
  Calendar, 
  Youtube, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
// Removed Supabase auth - no user authentication needed

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Calendar", icon: Calendar, path: "/calendar" },
  { title: "Channels", icon: Youtube, path: "/channels" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  // No logout needed - no user authentication

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0, width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed left-0 top-0 h-screen glass-panel border-r border-border z-50 flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-center border-b border-primary/30">
        {!collapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center"
          >
            <span 
              className="text-2xl font-black tracking-wider"
              style={{
                color: '#ff3333',
                textShadow: `
                  0 0 10px rgba(255, 51, 51, 0.8),
                  0 0 20px rgba(255, 51, 51, 0.6),
                  0 0 30px rgba(255, 0, 0, 0.4)
                `,
                fontFamily: '"Poppins", sans-serif'
              }}
            >
              VIRALITYT
            </span>
          </motion.div>
        ) : (
          <span 
            className="text-xl font-bold"
            style={{
              color: '#ff0000',
              filter: 'drop-shadow(0 0 5px rgba(255, 0, 0, 0.6))'
            }}
          >
            V
          </span>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NavLink
              to={item.path}
              className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-card text-muted-foreground hover:text-foreground group"
              activeClassName="bg-card text-foreground border border-primary/20 glow-red"
            >
              <item.icon className="w-5 h-5 group-hover:text-primary transition-colors" />
              {!collapsed && (
                <span className="font-medium">{item.title}</span>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Add Channel Button */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/onboarding"
          className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 hover:bg-card text-muted-foreground hover:text-foreground group bg-primary/10 border border-primary/20"
          activeClassName="bg-primary/20 text-foreground"
        >
          <Youtube className="w-5 h-5 group-hover:text-primary transition-colors" />
          {!collapsed && <span className="font-medium">Add Channel</span>}
        </NavLink>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-4 border-t border-border hover:bg-card transition-colors flex items-center justify-center"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5 text-primary" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-primary" />
        )}
      </button>
    </motion.aside>
  );
};
