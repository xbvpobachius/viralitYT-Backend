import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Eye, ThumbsUp, MessageSquare, Share2, BarChart2, Download, Edit, Trash2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const VideoDetail = () => {
  const logs = [
    { time: "14:32:01", status: "success", message: "Video published successfully", type: "publish" },
    { time: "14:31:45", status: "info", message: "Processing thumbnail...", type: "process" },
    { time: "14:31:30", status: "info", message: "Uploading video content...", type: "upload" },
    { time: "14:31:15", status: "info", message: "Video upload started", type: "start" },
    { time: "14:31:00", status: "success", message: "Validation completed", type: "validate" },
  ];

  const videoStats = [
    { label: "Views", value: "12.4K", icon: Eye, percentage: 78, change: "+12%" },
    { label: "Likes", value: "892", icon: ThumbsUp, percentage: 62, change: "+8%" },
    { label: "Comments", value: "156", icon: MessageSquare, percentage: 45, change: "+15%" },
    { label: "Shares", value: "234", icon: Share2, percentage: 55, change: "+5%" },
  ];

  const engagementData = [
    { hour: "00:00", value: 120 },
    { hour: "04:00", value: 89 },
    { hour: "08:00", value: 456 },
    { hour: "12:00", value: 789 },
    { hour: "16:00", value: 1234 },
    { hour: "20:00", value: 892 },
  ];

  const topComments = [
    { author: "TechFan2024", comment: "Great review! Very detailed", likes: 45, time: "2 hours ago" },
    { author: "GamingPro", comment: "This helped me decide", likes: 32, time: "5 hours ago" },
    { author: "RandomUser", comment: "More videos like this please!", likes: 28, time: "1 day ago" },
  ];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
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
            Video Details
          </motion.h1>
          <motion.p 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mt-3 text-lg"
          >
            &nbsp;
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Preview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card 
                className="glass-panel border-2 border-primary/40 p-6" 
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <motion.div 
                  className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40 glow-red mb-4 flex items-center justify-center overflow-hidden relative group cursor-pointer" 
                  style={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)' }}
                  whileHover={{ scale: 1.02 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      className="w-20 h-20 rounded-full bg-primary/80 flex items-center justify-center"
                    >
                      <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-2" />
                    </motion.div>
                  </motion.div>
                  <div className="text-center">
                    <div className="text-6xl mb-2">🎬</div>
                    <p className="text-muted-foreground">Video Thumbnail</p>
                  </div>
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">How to Build a Tech Channel</h2>
                <p className="text-muted-foreground mb-4">
                  Complete guide for content creators looking to start their tech review channel.
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Published Mar 5, 2024
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    12:34
                  </span>
                </div>
              </Card>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {videoStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card 
                    className="glass-panel border-2 border-primary/40 p-4 hover:border-primary/60 transition-all"
                    style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
                  >
                    <motion.div 
                      className="p-2 rounded-lg bg-primary/20 w-fit mb-3"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <stat.icon className="w-5 h-5 text-primary" />
                    </motion.div>
                    <p className="text-2xl font-bold mb-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
                    <div className="space-y-1">
                      <Progress value={stat.percentage} className="h-1" />
                      <p className="text-xs text-green-500">{stat.change}</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Engagement Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card 
                className="glass-panel border-2 border-primary/40 p-6"
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  Engagement Timeline
                </h3>
                
                <div className="relative h-48 flex items-end justify-between gap-2">
                  {engagementData.map((data, index) => (
                    <motion.div
                      key={data.hour}
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.value / 1500) * 100}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 0, 0, 0.3)' }}
                      className="flex-1 bg-primary/20 rounded-t-lg cursor-pointer relative group"
                      style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }}
                    >
                      <motion.div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-card border-2 border-primary/40 rounded-lg px-2 py-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                      >
                        {data.value} views
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {engagementData.map((data) => (
                    <span key={data.hour}>{data.hour}</span>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Terminal Logs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Card 
                className="glass-panel border-2 border-primary/40 p-6"
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-glow-pulse" />
                  Activity Logs
                </h3>
                <div className="space-y-2 font-mono text-sm max-h-64 overflow-y-auto">
                  {logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className={`
                        p-3 rounded-lg border-2
                        ${log.status === "success" 
                          ? "border-primary/30 bg-primary/5 text-primary" 
                          : "border-border bg-card/50 text-muted-foreground"
                        }
                      `}
                    >
                      <span className="opacity-60">[{log.time}]</span>{" "}
                      <span className="font-semibold">{log.status.toUpperCase()}</span>:{" "}
                      {log.message}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Top Comments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
            >
              <Card 
                className="glass-panel border-2 border-primary/40 p-6"
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Top Comments
                </h3>
                
                <div className="space-y-3">
                  {topComments.map((comment, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="p-4 rounded-xl bg-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-sm">{comment.author}</p>
                        <span className="text-xs text-muted-foreground">{comment.time}</span>
                      </div>
                      <p className="text-sm mb-2">{comment.comment}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{comment.likes}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card 
                className="glass-panel border-2 border-primary/40 p-6"
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <h3 className="text-xl font-bold mb-4">Actions</h3>
                <div className="space-y-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="w-full gradient-primary glow-red-hover rounded-xl h-12">
                      <Calendar className="w-4 h-4 mr-2" />
                      Reschedule
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-primary/40 hover:bg-card rounded-xl h-12"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-primary/40 hover:bg-card rounded-xl h-12"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="ghost"
                      className="w-full hover:bg-card text-destructive rounded-xl h-12 border-2 border-destructive/40"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Video
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>

            {/* Performance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card 
                className="glass-panel border-2 border-primary/40 p-6"
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Watch Time</span>
                      <span className="font-bold">8.2K hrs</span>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Avg. Duration</span>
                      <span className="font-bold">8:45</span>
                    </div>
                    <Progress value={70} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Click Rate</span>
                      <span className="font-bold">11.2%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Retention</span>
                      <span className="font-bold">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default VideoDetail;
