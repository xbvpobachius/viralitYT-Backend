import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, TrendingUp, Video, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { api, Upload } from "@/lib/api";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch uploads
  const { data: uploadsData, isLoading } = useQuery<{ uploads: Upload[]; count: number }>({
    queryKey: ['calendar-uploads', selectedAccount],
    queryFn: () => api.listUploads(selectedAccount, undefined, 500),
    refetchInterval: 30000,
  });

  // Fetch accounts for filter
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.listAccounts(),
  });

  const robloxAccounts = accountsData?.accounts.filter(a => a.theme_slug === 'roblox') || [];

  // Filter uploads by search query
  const filteredUploads = useMemo(() => {
    if (!uploadsData?.uploads) return [];
    let filtered = uploadsData.uploads;
    
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.account_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [uploadsData, searchQuery]);

  // Get uploads for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const uploadsByDay = useMemo(() => {
    const map = new Map<number, Upload[]>();
    filteredUploads.forEach(upload => {
      const uploadDate = new Date(upload.scheduled_for);
      if (isSameDay(uploadDate, monthStart) || 
          (uploadDate >= monthStart && uploadDate <= monthEnd)) {
        const day = uploadDate.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)!.push(upload);
      }
    });
    return map;
  }, [filteredUploads, monthStart, monthEnd]);

  // Calculate stats
  const weekStats = useMemo(() => {
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    
    const nextWeekStart = new Date(thisWeekEnd);
    nextWeekStart.setDate(thisWeekEnd.getDate() + 1);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    const thisWeek = filteredUploads.filter(u => {
      const date = new Date(u.scheduled_for);
      return date >= thisWeekStart && date <= thisWeekEnd;
    }).length;

    const nextWeek = filteredUploads.filter(u => {
      const date = new Date(u.scheduled_for);
      return date >= nextWeekStart && date <= nextWeekEnd;
    }).length;

    const totalMonth = filteredUploads.filter(u => {
      const date = new Date(u.scheduled_for);
      return date >= monthStart && date <= monthEnd;
    }).length;

    return [
      { label: "This Week", value: thisWeek.toString(), icon: Video },
      { label: "Next Week", value: nextWeek.toString(), icon: CalendarIcon },
      { label: "Total Month", value: totalMonth.toString(), icon: TrendingUp },
    ];
  }, [filteredUploads, monthStart, monthEnd]);

  // Upcoming videos (next 7 days)
  const upcomingVideos = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    
    return filteredUploads
      .filter(u => {
        const date = new Date(u.scheduled_for);
        return date >= now && date <= nextWeek;
      })
      .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
      .slice(0, 5)
      .map(upload => {
        const date = new Date(upload.scheduled_for);
        return {
          date: format(date, "MMM d"),
          title: upload.title || 'Untitled',
          time: format(date, "HH:mm"),
          thumbnail: "🎮",
          status: upload.status,
          id: upload.id,
        };
      });
  }, [filteredUploads]);

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getDayOfWeek = (date: Date) => {
    return date.getDay();
  };

  const firstDayOfMonth = getDayOfWeek(monthStart);
  const daysBeforeMonth = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

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
            Calendar
          </motion.h1>
          <motion.p 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mt-3 text-lg"
          >
            Scheduled Roblox videos
          </motion.p>
        </div>

        {/* Week Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {weekStats.map((stat, index) => (
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
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-3 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <stat.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <Card 
              className="glass-panel border-2 border-primary/40 p-6" 
              style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-card glow-red-hover border-2 border-primary/40"
                      onClick={goToPreviousMonth}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-card glow-red-hover border-2 border-primary/40"
                      onClick={goToNextMonth}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-bold text-primary p-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-3">
                {/* Empty days before month starts */}
                {daysBeforeMonth.map((_, i) => (
                  <div key={`empty-${i}`} className="p-4 rounded-lg" />
                ))}
                
                {/* Days of month */}
                {monthDays.map((day) => {
                  const dayNumber = day.getDate();
                  const dayUploads = uploadsByDay.get(dayNumber) || [];
                  const hasVideo = dayUploads.length > 0;
                  
                  return (
                    <motion.div
                      key={dayNumber}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + dayNumber * 0.01 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center group overflow-hidden ${
                        hasVideo 
                          ? 'border-primary/60 bg-card/50' 
                          : 'border-primary/20 bg-card/30'
                      }`}
                      style={{ boxShadow: hasVideo ? '0 0 10px rgba(255, 0, 0, 0.2)' : 'none' }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-primary/10"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                      
                      <div className="relative z-10 text-2xl font-black text-primary group-hover:scale-110 transition-transform">
                        {dayNumber}
                      </div>
                      
                      {hasVideo && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"
                          style={{ boxShadow: '0 0 8px rgba(255, 0, 0, 0.8)' }}
                        />
                      )}
                      
                      {dayUploads.length > 1 && (
                        <span className="text-xs text-primary mt-1 font-bold">
                          +{dayUploads.length - 1}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Upcoming Videos Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-6"
          >
            {/* Search */}
            <Card 
              className="glass-panel border-2 border-primary/40 p-4"
              style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2 border-primary/40 focus:border-primary h-12 rounded-xl"
                  style={{ boxShadow: '0 0 8px rgba(255, 0, 0, 0.2)' }}
                />
              </div>
            </Card>

            {/* Account Filter */}
            {robloxAccounts.length > 0 && (
              <Card 
                className="glass-panel border-2 border-primary/40 p-4"
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <select
                  value={selectedAccount || ''}
                  onChange={(e) => setSelectedAccount(e.target.value || undefined)}
                  className="w-full p-2 rounded-lg border-2 border-primary/40 bg-card text-sm"
                >
                  <option value="">All Accounts</option>
                  {robloxAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.display_name}</option>
                  ))}
                </select>
              </Card>
            )}

            {/* Upcoming List */}
            <Card 
              className="glass-panel border-2 border-primary/40 p-6"
              style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Upcoming
              </h2>
              
              {upcomingVideos.length > 0 ? (
                <div className="space-y-3">
                  {upcomingVideos.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      whileHover={{ x: 5, scale: 1.02 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                    >
                      <motion.div 
                        className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        {video.thumbnail}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{video.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{video.date}</span>
                          <span>•</span>
                          <span>{video.time}</span>
                        </div>
                        <p className={`text-xs font-medium ${
                          video.status === 'done' ? 'text-green-500' :
                          video.status === 'failed' ? 'text-red-500' :
                          'text-blue-500'
                        }`}>
                          {video.status}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No upcoming videos
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
};

export default Calendar;
