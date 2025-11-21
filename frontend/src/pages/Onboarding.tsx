import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Youtube, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, APIProject } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Onboarding = () => {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [accountName, setAccountName] = useState("");

  // Fetch API projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ projects: APIProject[] }>({
    queryKey: ['api-projects'],
    queryFn: () => api.listAPIProjects(),
  });

  // Start OAuth mutation
  const oauthMutation = useMutation({
    mutationFn: (data: { project_id: string; account_name: string; theme_slug: string }) =>
      api.startOAuth(data),
    onSuccess: (data) => {
      // Redirect to OAuth URL
      window.location.href = data.authorization_url;
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleConnectChannel = () => {
    if (!projectId) {
      toast.error("Please select an API project");
      return;
    }
    if (!accountName.trim()) {
      toast.error("Please enter a channel name");
      return;
    }

    oauthMutation.mutate({
      project_id: projectId,
      account_name: accountName.trim(),
      theme_slug: 'roblox', // Fixed theme
    });
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
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
            Connect Channel
          </motion.h1>
          <motion.p 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mt-3 text-lg"
          >
            Connect your YouTube channel to start automating Roblox videos
          </motion.p>
        </div>

        <Card 
          className="glass-panel border-2 border-primary/40 p-8" 
          style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
        >
          {/* Step 1: Select API Project */}
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-bold mb-4 block">1. Select API Project</Label>
              {projectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : projectsData?.projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No API projects found.</p>
                  <p className="text-sm">Please create an API project first in the backend.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectsData?.projects.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => setProjectId(project.id)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          projectId === project.id
                            ? 'border-primary bg-primary/10'
                            : 'border-primary/20 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold">{project.project_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Quota: {project.quota_used_today.toLocaleString()}/{project.daily_quota.toLocaleString()}
                            </p>
                          </div>
                          {projectId === project.id && (
                            <div className="w-4 h-4 rounded-full bg-primary" />
                          )}
                        </div>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Enter Channel Name */}
            <div>
              <Label htmlFor="accountName" className="text-lg font-bold mb-4 block">
                2. Channel Display Name
              </Label>
              <Input
                id="accountName"
                placeholder="My Roblox Channel"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="h-12 text-lg border-2 border-primary/40 focus:border-primary rounded-xl"
                style={{ boxShadow: '0 0 8px rgba(255, 0, 0, 0.2)' }}
              />
              <p className="text-sm text-muted-foreground mt-2">
                This name will be used to identify your channel in the dashboard
              </p>
            </div>

            {/* Info */}
            <div className="bg-card/50 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <Youtube className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>You'll be redirected to Google to authorize YouTube access</li>
                    <li>Your channel will be connected automatically</li>
                    <li>Videos will be scheduled at 6 PM daily (Spain time)</li>
                    <li>Only Roblox theme videos will be published</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/channels')}
                className="flex-1 border-2 border-primary/40 hover:border-primary/60 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConnectChannel}
                disabled={!projectId || !accountName.trim() || oauthMutation.isPending}
                className="flex-1 gradient-primary glow-red-hover h-12 rounded-xl text-white font-bold"
              >
                {oauthMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Channel
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default Onboarding;
