import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Eye, Clock, Youtube, PlayCircle, Calendar, Zap, ThumbsUp, MessageSquare, Share2, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, DashboardMetrics, Upload } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: () => api.getDashboardMetrics(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
    onError: (error) => {
      console.error('Error loading dashboard metrics:', error);
      toast.error('Error loading dashboard data. Check API connection.');
    },
  });

  // Fetch recent uploads
  const { data: uploadsData, isLoading: uploadsLoading, error: uploadsError } = useQuery<{ uploads: Upload[]; count: number }>({
    queryKey: ['recent-uploads'],
    queryFn: () => api.listUploads(undefined, undefined, 10),
    refetchInterval: 30000,
    retry: 2,
    onError: (error) => {
      console.error('Error loading uploads:', error);
    },
  });

  const stats = [
    {
      title: "Uploads Today",
      value: safeMetrics.uploads_today.toString(),
      change: `${safeMetrics.uploads_done} completed`,
      icon: Eye,
      color: "from-primary to-primary/50",
      progress: Math.min((safeMetrics.uploads_done / Math.max(safeMetrics.uploads_today, 1)) * 100, 100),
    },
    {
      title: "Scheduled",
      value: safeMetrics.uploads_scheduled.toString(),
      change: "pending uploads",
      icon: Clock,
      color: "from-primary to-primary/60",
      progress: Math.min((safeMetrics.uploads_scheduled / 50) * 100, 100),
    },
    {
      title: "Active Accounts",
      value: safeMetrics.active_accounts.toString(),
      change: `of ${safeMetrics.total_accounts} total`,
      icon: Users,
      color: "from-primary to-primary/70",
      progress: safeMetrics.total_accounts > 0 
        ? (safeMetrics.active_accounts / safeMetrics.total_accounts) * 100 
        : 0,
    },
    {
      title: "Quota Remaining",
      value: safeMetrics.quota.uploads_remaining.toString(),
      change: `${safeMetrics.quota.projects_available} projects`,
      icon: TrendingUp,
      color: "from-primary to-primary/40",
      progress: safeMetrics.quota.total_quota > 0
        ? (safeMetrics.quota.total_remaining / safeMetrics.quota.total_quota) * 100
        : 0,
    },
  ];

  const recentActivity = (uploadsData?.uploads || []).slice(0, 4).map((upload) => {
    const scheduledDate = new Date(upload.scheduled_for);
    const now = new Date();
    const diffHours = Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    let timeAgo = "";
    if (diffHours < 0) {
      timeAgo = `${Math.abs(diffHours)} hours ago`;
    } else if (diffHours < 24) {
      timeAgo = `In ${diffHours} hours`;
    } else {
      timeAgo = scheduledDate.toLocaleDateString();
    }

    return {
      time: timeAgo,
      action: upload.status === 'done' ? 'Video published' : upload.status === 'scheduled' ? 'Video scheduled' : `Status: ${upload.status}`,
      title: upload.title || 'Untitled',
      icon: upload.status === 'done' ? Youtube : Clock,
      color: upload.status === 'done' ? 'text-green-500' : upload.status === 'failed' ? 'text-red-500' : 'text-blue-500',
      youtubeId: upload.youtube_video_id,
    };
  }) || [];

  if (metricsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  // Use default values if API fails - show dashboard anyway
  const safeMetrics = metrics || {
    uploads_today: 0,
    uploads_done: 0,
    uploads_failed: 0,
    uploads_scheduled: 0,
    active_accounts: 0,
    total_accounts: 0,
    quota: {
      total_quota: 0,
      total_used: 0,
      total_remaining: 0,
      projects_available: 0,
      uploads_remaining: 0,
      projects: [],
    },
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-black mb-2"
              style={{
                color: '#ff3333',
                textShadow: `
                  0 0 10px rgba(255, 51, 51, 0.8),
                  0 0 20px rgba(255, 51, 51, 0.6),
                  0 0 30px rgba(255, 0, 0, 0.4)
                `,
                fontFamily: '"Poppins", sans-serif',
                display: 'inline-block'
              }}
            >
              Dashboard
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mt-3 text-lg"
            >
              Roblox Automation Overview
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="border-2 border-primary/40 hover:border-primary/60 hover:bg-primary/10"
            >
              Login
            </Button>
          </motion.div>
        </div>
        
        {metricsError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="glass-panel border-2 border-yellow-500/40 p-4 bg-yellow-500/10">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⚠️ Warning: Could not connect to backend API. Showing default data. 
                API URL: {import.meta.env.VITE_API_BASE || 'http://localhost:8000'}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <Card 
                className="glass-panel border-2 border-primary/40 p-6 group hover:border-primary/60 transition-all duration-300 glow-red-hover overflow-hidden relative" 
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <motion.div 
                      className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} glow-red`}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <stat.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <span className="text-sm text-green-500 font-medium">
                      {stat.change}
                    </span>
                  </div>
                  <motion.h3 
                    className="text-4xl font-bold mb-1"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                  >
                    {stat.value}
                  </motion.h3>
                  <p className="text-muted-foreground text-sm mb-3">{stat.title}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(stat.progress)}%</span>
                    </div>
                    <Progress 
                      value={stat.progress} 
                      className="h-2 bg-card"
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Próximos Videos */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <Card 
            className="glass-panel border-2 border-primary/40 p-6" 
            style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Próximos Videos
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:bg-primary/10"
                onClick={() => navigate('/calendar')}
              >
                View All
              </Button>
            </div>
            
            {uploadsLoading && !uploadsData ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((video, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    whileHover={{ x: 10, scale: 1.02 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
                    style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.1)' }}
                    onClick={() => video.youtubeId && window.open(`https://youtube.com/watch?v=${video.youtubeId}`, '_blank')}
                  >
                    <motion.div 
                      className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-3xl"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      🎮
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate group-hover:text-primary transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {video.time}
                        </span>
                        <span className={`text-sm font-medium ${video.color}`}>
                          {video.action}
                        </span>
                      </div>
                    </div>
                    {video.youtubeId && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://youtube.com/watch?v=${video.youtubeId}`, '_blank');
                        }}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay videos programados aún
              </div>
            )}
          </Card>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <Card 
            className="glass-panel border-2 border-primary/40 p-6" 
            style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Recent Activity
            </h2>
            
            {recentActivity.length > 0 ? (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-primary/30" />
                
                <div className="space-y-6">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 + index * 0.1 }}
                      whileHover={{ x: 10 }}
                      className="relative flex items-start gap-4 pl-2"
                    >
                      <motion.div 
                        className="relative z-10 p-2 rounded-lg bg-card border-2 border-primary/40"
                        whileHover={{ rotate: 360, scale: 1.2 }}
                        transition={{ duration: 0.4 }}
                        style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.3)' }}
                      >
                        <activity.icon className={`w-5 h-5 ${activity.color}`} />
                      </motion.div>
                      
                      <div className="flex-1 bg-card/50 p-4 rounded-xl border border-primary/20 hover:border-primary/40 transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold">{activity.title}</p>
                          <span className="text-sm text-muted-foreground">{activity.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay actividad reciente
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Dashboard;
