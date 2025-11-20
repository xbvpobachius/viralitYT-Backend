import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api, DashboardMetrics, Upload } from '../services/api';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );
}

interface UpcomingVideoProps {
  time: string;
  day: number;
}

function UpcomingVideo({ time, day }: UpcomingVideoProps) {
  return (
    <View style={styles.videoCard}>
      <Text style={styles.videoTime}>{time}</Text>
      <Text style={styles.videoDay}>{day}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [upcomingVideos, setUpcomingVideos] = useState<Upload[]>([]);

  const loadData = async () => {
    try {
      const [metricsData, uploadsData] = await Promise.all([
        api.getDashboardMetrics(),
        api.listUploads(undefined, 'scheduled', 3),
      ]);
      setMetrics(metricsData);
      setUpcomingVideos(uploadsData.uploads.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E50914" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>V</Text>
          </View>
          <Text style={styles.appName}>SPACEVIRALIT</Text>
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsSection}>
          <MetricCard 
            title="UPLOADS TODAY" 
            value={metrics?.uploads_today || 0}
            subtitle={`${metrics?.uploads_done || 0} completed`}
          />
          <MetricCard 
            title="SCHEDULED" 
            value={metrics?.uploads_scheduled || 0}
            subtitle="pending uploads"
          />
          <MetricCard 
            title="ACTIVE ACCOUNTS" 
            value={metrics?.active_accounts || 0}
            subtitle={`of ${metrics?.total_accounts || 0} total`}
          />
          <MetricCard 
            title="QUOTA REMAINING" 
            value={metrics?.quota.uploads_remaining || 0}
            subtitle={`${metrics?.quota.projects_available || 0} projects`}
          />
        </View>

        {/* Upcoming Videos Section */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>PROXIMOS VIDEOS</Text>
          <View style={styles.videosGrid}>
            {upcomingVideos.length > 0 ? (
              upcomingVideos.map((video, index) => {
                const date = new Date(video.scheduled_for);
                const day = date.getDate();
                const hours = date.getHours();
                const minutes = date.getMinutes();
                const timeStr = `${hours}:${minutes.toString().padStart(2, '0')}`;
                return (
                  <UpcomingVideo key={video.id} time={timeStr} day={day} />
                );
              })
            ) : (
              <Text style={styles.noVideosText}>No hay videos programados</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  metricsSection: {
    marginBottom: 40,
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  upcomingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  videosGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  videoCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  videoTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E50914',
    marginBottom: 8,
  },
  videoDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noVideosText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    width: '100%',
    padding: 20,
  },
});

