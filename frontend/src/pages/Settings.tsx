import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Bell, Mail, Shield, Zap, Globe, Palette, Save } from "lucide-react";

const settingsSections = [
  {
    title: "General",
    icon: Globe,
    settings: [
      { type: "input", label: "Channel Name", id: "channel-name", placeholder: "Enter channel name" },
      { type: "input", label: "Email Notifications", id: "email", inputType: "email", placeholder: "your@email.com" },
      { type: "toggle", label: "Auto-publish", description: "Automatically publish scheduled videos" },
      { type: "toggle", label: "Email alerts", description: "Get notified about uploads" },
    ]
  },
  {
    title: "Notifications",
    icon: Bell,
    settings: [
      { type: "toggle", label: "Push Notifications", description: "Receive push notifications on mobile" },
      { type: "toggle", label: "Comment Alerts", description: "Get notified of new comments" },
      { type: "toggle", label: "Subscriber Milestones", description: "Celebrate subscriber milestones" },
      { type: "toggle", label: "Weekly Reports", description: "Receive weekly performance reports" },
    ]
  }
];

const scheduleSettings = {
  title: "Upload Schedule",
  icon: Zap,
  content: [
    { type: "time", label: "Default Upload Time" },
    { type: "slider", label: "Videos per week", min: 1, max: 7, defaultValue: 3 },
    { type: "select", label: "Timezone", options: ["UTC-5 (Eastern)", "UTC-8 (Pacific)", "UTC+0 (London)", "UTC+1 (Paris)"] },
    { type: "toggle", label: "Smart scheduling", description: "Optimize upload times based on analytics" },
  ]
};

const Settings = () => {
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
            Settings
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* General & Notifications */}
          {settingsSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: sectionIndex === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + sectionIndex * 0.1 }}
            >
              <Card 
                className="glass-panel border-2 border-primary/40 p-6" 
                style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    className="p-3 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <section.icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                </div>

                <div className="space-y-6">
                  {section.settings.map((setting, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + sectionIndex * 0.1 + index * 0.05 }}
                    >
                      {setting.type === 'input' && (
                        <div>
                          <Label htmlFor={setting.id} className="text-foreground mb-2 block font-medium">
                            {setting.label}
                          </Label>
                          <Input
                            id={setting.id}
                            type={setting.inputType || 'text'}
                            placeholder={setting.placeholder}
                            className="glass-panel border-2 border-primary/40 focus:border-primary rounded-xl h-12"
                            style={{ boxShadow: '0 0 8px rgba(255, 0, 0, 0.2)' }}
                          />
                        </div>
                      )}
                      
                      {setting.type === 'toggle' && (
                        <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all">
                          <div>
                            <p className="font-medium">{setting.label}</p>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                          <Switch />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Schedule Settings - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-6"
        >
          <Card 
            className="glass-panel border-2 border-primary/40 p-6" 
            style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="p-3 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <scheduleSettings.icon className="w-6 h-6 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold">{scheduleSettings.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scheduleSettings.content.map((setting, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  {setting.type === 'time' && (
                    <div>
                      <Label className="text-foreground mb-4 block font-medium">{setting.label}</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="time"
                          className="glass-panel border-2 border-primary/40 focus:border-primary rounded-xl h-12"
                          style={{ boxShadow: '0 0 8px rgba(255, 0, 0, 0.2)' }}
                        />
                        <select className="glass-panel border-2 border-primary/40 focus:border-primary rounded-xl h-12 px-4 bg-background text-foreground">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {setting.type === 'slider' && (
                    <div>
                      <Label className="text-foreground mb-4 block font-medium">
                        {setting.label}: <span className="text-primary">{setting.defaultValue}</span>
                      </Label>
                      <Slider
                        defaultValue={[setting.defaultValue]}
                        max={setting.max}
                        min={setting.min}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}

                  {setting.type === 'select' && (
                    <div>
                      <Label className="text-foreground mb-4 block font-medium">{setting.label}</Label>
                      <select className="w-full glass-panel border-2 border-primary/40 focus:border-primary rounded-xl h-12 px-4 bg-background text-foreground">
                        {setting.options.map((option, i) => (
                          <option key={i}>{option}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {setting.type === 'toggle' && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border-2 border-primary/20 hover:border-primary/40 transition-all">
                      <div>
                        <p className="font-medium">{setting.label}</p>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Switch />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Appearance & Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card 
              className="glass-panel border-2 border-primary/40 p-6" 
              style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div 
                  className="p-3 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Palette className="w-6 h-6 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold">Appearance</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border-2 border-primary/20">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">Currently enabled</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border-2 border-primary/20">
                  <div>
                    <p className="font-medium">Compact View</p>
                    <p className="text-sm text-muted-foreground">Show more content</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card 
              className="glass-panel border-2 border-primary/40 p-6" 
              style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.2)' }}
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div 
                  className="p-3 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Shield className="w-6 h-6 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold">Security</h2>
              </div>

              <div className="space-y-4">
                <Button className="w-full justify-start border-2 border-primary/40 hover:border-primary/60 bg-card/50 rounded-xl h-14">
                  <Shield className="w-5 h-5 mr-2" />
                  Change Password
                </Button>
                <Button className="w-full justify-start border-2 border-primary/40 hover:border-primary/60 bg-card/50 rounded-xl h-14">
                  <Mail className="w-5 h-5 mr-2" />
                  Two-Factor Authentication
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex justify-end gap-4"
          whileHover={{ scale: 1.02 }}
        >
          <Button 
            variant="ghost" 
            className="h-14 px-8 rounded-xl text-base border-2 border-primary/40 hover:border-primary/60"
          >
            Reset to Default
          </Button>
          <Button className="gradient-primary glow-red-hover h-14 px-8 rounded-xl text-base font-bold">
            <Save className="w-5 h-5 mr-2" />
            Save Changes
          </Button>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default Settings;
