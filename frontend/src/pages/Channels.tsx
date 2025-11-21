import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Plus, Crown, Pause, Play } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Account } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Channels = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch accounts
  const { data: accountsData, isLoading } = useQuery<{ accounts: Account[] }>({
    queryKey: ['accounts'],
    queryFn: () => api.listAccounts(),
    refetchInterval: 30000,
  });

  // Filter only Roblox accounts
  const robloxAccounts = accountsData?.accounts.filter(a => a.theme_slug === 'roblox') || [];

  // Toggle account status
  const toggleStatusMutation = useMutation({
    mutationFn: ({ accountId, active }: { accountId: string; active: boolean }) =>
      api.updateAccountStatus(accountId, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      toast.success('Account status updated');
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleToggleStatus = (account: Account) => {
    toggleStatusMutation.mutate({
      accountId: account.id,
      active: !account.active,
    });
  };

  const formatTime = (timeStr: string) => {
    try {
      const time = new Date(`2000-01-01T${timeStr}`);
      return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
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
              Channels
            </motion.h1>
            <motion.p 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mt-3 text-lg"
            >
              Manage your Roblox YouTube channels
            </motion.p>
          </div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              className="gradient-primary glow-red-hover h-14 px-8 rounded-xl text-lg font-bold"
              onClick={() => navigate('/onboarding')}
            >
              <Plus className="w-6 h-6 mr-2" />
              Add Channel
            </Button>
          </motion.div>
        </div>

        {/* Channels Grid */}
        {robloxAccounts.length === 0 ? (
          <Card className="glass-panel border-2 border-primary/40 p-12 text-center">
            <Youtube className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-bold mb-2">No channels connected</h3>
            <p className="text-muted-foreground mb-6">
              Connect your first YouTube channel to start automating Roblox videos
            </p>
            <Button 
              className="gradient-primary glow-red-hover"
              onClick={() => navigate('/onboarding')}
            >
              <Plus className="w-5 h-5 mr-2" />
              Connect Channel
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {robloxAccounts.map((channel, index) => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card 
                  className="glass-panel border-2 border-primary/40 p-6 group hover:border-primary/60 transition-all duration-300 h-full" 
                  style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <motion.div 
                      className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/50"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Youtube className="w-6 h-6 text-white" />
                    </motion.div>
                    {channel.active && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Crown className="w-5 h-5 text-yellow-500" />
                      </motion.div>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {channel.display_name}
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-primary/20">
                      <span className="text-sm text-muted-foreground">Channel ID</span>
                      <span className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                        {channel.channel_id || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-primary/20">
                      <span className="text-sm text-muted-foreground">Upload Time</span>
                      <span className="text-sm font-bold">{formatTime(channel.upload_time_1)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-primary/20">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          channel.active
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {channel.active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-primary/40 hover:border-primary/60"
                      onClick={() => handleToggleStatus(channel)}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {channel.active ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
};

export default Channels;
