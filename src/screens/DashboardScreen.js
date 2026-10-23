import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAttendance } from '../context/AttendanceContext';
import { COLORS } from '../constants/colors';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';

export default function DashboardScreen({ navigation }) {
  const {
    students,
    records,
    batches,
    selectedBatch,
    setSelectedBatch,
    getOverallStats,
    getStudentStats,
    resetDemoData,
    clearAllData,
  } = useAttendance();

  const stats = getOverallStats(selectedBatch === 'All' ? null : selectedBatch);

  // Recent 5 attendance sessions for selected batch
  const recentSessions = Object.values(records)
    .filter((r) => (selectedBatch === 'All' ? true : r.batch === selectedBatch))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  // Identify defaulters consistently using centralized calculation
  const defaultersList = students
    .filter((s) => (selectedBatch === 'All' ? true : s.batch?.trim() === selectedBatch?.trim()))
    .map((s) => {
      const studentStats = getStudentStats(s.id, s.batch);
      return {
        ...s,
        totalClasses: studentStats.totalClasses,
        percentage: studentStats.percentage,
        isDefaulter: studentStats.isDefaulter,
        classesNeeded: studentStats.classesNeededFor75,
      };
    })
    .filter((s) => s.isDefaulter);

  const handleResetDemo = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reload 10 MCA students and 8 days of realistic attendance records. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset Data', style: 'destructive', onPress: () => resetDemoData() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Attendance Management</Text>
          <Text style={styles.appTitle}>Dashboard & Analytics</Text>
        </View>
        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleResetDemo}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
          <Text style={styles.demoButtonText}>Demo Data</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Batch Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.batchSelectorContainer}
        >
          {['All', ...batches].map((batch) => {
            const isSelected = selectedBatch === batch;
            return (
              <TouchableOpacity
                key={batch}
                style={[
                  styles.batchChip,
                  isSelected && styles.batchChipSelected,
                ]}
                onPress={() => setSelectedBatch(batch)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.batchChipText,
                    isSelected && styles.batchChipTextSelected,
                  ]}
                >
                  {batch}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Defaulter Alert Banner */}
        {defaultersList.length > 0 && (
          <TouchableOpacity
            style={styles.defaulterBanner}
            onPress={() => navigation.navigate('Reports', { initialTab: 'defaulters', timestamp: Date.now() })}
            activeOpacity={0.8}
          >
            <View style={styles.defaulterIcon}>
              <Ionicons name="warning" size={22} color={COLORS.danger} />
            </View>
            <View style={styles.defaulterTextContainer}>
              <Text style={styles.defaulterTitle}>
                {defaultersList.length} Student{defaultersList.length > 1 ? 's' : ''} Below 75% Threshold
              </Text>
              <Text style={styles.defaulterSubtitle}>
                Attendance shortage in {selectedBatch}. Tap to view defaulter report & recovery.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        )}

        {/* 2x2 Stat Cards Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title="Students"
              value={stats.totalStudents}
              subtitle={selectedBatch === 'All' ? 'All batches' : selectedBatch}
              icon="people"
              color={COLORS.primary}
              bgColor={COLORS.primaryLight}
              style={{ marginRight: 8 }}
            />
            <StatCard
              title="Sessions"
              value={stats.totalSessions}
              subtitle="Lectures marked"
              icon="calendar"
              color={COLORS.secondary}
              bgColor="#ECFEFF"
              style={{ marginLeft: 8 }}
            />
          </View>

          <View style={[styles.statsRow, { marginTop: 12 }]}>
            <StatCard
              title="Overall Avg"
              value={`${stats.overallPercentage}%`}
              subtitle={stats.overallPercentage >= 75 ? 'Healthy Average' : 'Needs attention'}
              icon="analytics"
              color={stats.overallPercentage >= 75 ? COLORS.present : COLORS.late}
              bgColor={stats.overallPercentage >= 75 ? COLORS.presentLight : COLORS.lateLight}
              style={{ marginRight: 8 }}
            />
            <StatCard
              title="Defaulters"
              value={stats.defaultersCount}
              subtitle="Below 75% (Tap to view)"
              icon="alert-circle"
              color={stats.defaultersCount > 0 ? COLORS.absent : COLORS.present}
              bgColor={stats.defaultersCount > 0 ? COLORS.absentLight : COLORS.presentLight}
              style={{ marginLeft: 8 }}
              onPress={() => navigation.navigate('Reports', { initialTab: 'defaulters', timestamp: Date.now() })}
            />
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate('Mark Attendance')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconWrapper}>
              <Ionicons name="checkmark-done-circle" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.actionCardTitle}>Mark Attendance</Text>
            <Text style={styles.actionCardSub}>Take today's class roll call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#0EA5E9' }]}
            onPress={() => navigation.navigate('AddEditStudent')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconWrapper}>
              <Ionicons name="person-add" size={22} color="#0EA5E9" />
            </View>
            <Text style={styles.actionCardTitle}>Register Student</Text>
            <Text style={styles.actionCardSub}>Add to batch register</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Attendance Sessions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Class Sessions</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Reports')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All Reports</Text>
          </TouchableOpacity>
        </View>

        {recentSessions.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Ionicons name="calendar-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyRecentText}>No sessions recorded yet for {selectedBatch}</Text>
          </View>
        ) : (
          recentSessions.map((session, index) => {
            const total = Object.keys(session.records || {}).length;
            const present = Object.values(session.records || {}).filter(
              (s) => s === 'present'
            ).length;
            const late = Object.values(session.records || {}).filter(
              (s) => s === 'late'
            ).length;
            const effective = present + late * 0.5;
            const pct = total > 0 ? Math.round((effective / total) * 100) : 0;

            return (
              <View key={`${session.date}_${session.batch}_${index}`} style={styles.sessionCard}>
                <View style={styles.sessionHeaderRow}>
                  <View style={styles.sessionDateBadge}>
                    <Ionicons name="calendar" size={14} color={COLORS.primary} />
                    <Text style={styles.sessionDateText}>{session.date}</Text>
                  </View>
                  <Text style={styles.sessionBatchBadge}>{session.batch}</Text>
                </View>

                <View style={styles.sessionBody}>
                  <View style={styles.sessionMetricRow}>
                    <Text style={styles.sessionSubject}>{session.subject || 'Lecture'}</Text>
                    <Text style={[styles.sessionPct, { color: pct >= 75 ? COLORS.present : COLORS.danger }]}>
                      {pct}% Present
                    </Text>
                  </View>
                  <ProgressBar percentage={pct} height={6} />
                  <View style={styles.sessionDetailCounts}>
                    <Text style={styles.countItem}>
                      <Text style={{ color: COLORS.presentDark, fontWeight: '700' }}>{present}</Text> Present
                    </Text>
                    <Text style={styles.countItem}>
                      <Text style={{ color: COLORS.absentDark, fontWeight: '700' }}>
                        {total - present - late}
                      </Text>{' '}
                      Absent
                    </Text>
                    <Text style={styles.countItem}>
                      <Text style={{ color: COLORS.lateDark, fontWeight: '700' }}>{late}</Text> Late
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  batchSelectorContainer: {
    paddingBottom: 14,
  },
  batchChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  batchChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  batchChipTextSelected: {
    color: COLORS.textInverse,
  },
  defaulterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  defaulterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.absentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  defaulterTextContainer: {
    flex: 1,
  },
  defaulterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  defaulterSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    marginRight: 8,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionCardSub: {
    fontSize: 11,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  sessionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sessionDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  sessionBatchBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sessionBody: {
    marginTop: 4,
  },
  sessionMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sessionSubject: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sessionPct: {
    fontSize: 13,
    fontWeight: '700',
  },
  sessionDetailCounts: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  countItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 16,
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyRecentText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
});
