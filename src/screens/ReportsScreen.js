import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Share,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAttendance } from '../context/AttendanceContext';
import { StorageService } from '../services/storageService';
import { COLORS } from '../constants/colors';
import ProgressBar from '../components/ProgressBar';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';
import EmptyState from '../components/EmptyState';

export default function ReportsScreen({ navigation, route }) {
  const initialTab = route.params?.initialTab || 'dateWise';
  const [activeTab, setActiveTab] = useState(initialTab); // 'dateWise' | 'studentWise' | 'defaulters'

  const {
    students,
    records,
    batches,
    selectedBatch,
    setSelectedBatch,
    deleteAttendance,
  } = useAttendance();

  // Listen to tab changes passed through navigation (e.g., from Dashboard Defaulter alerts)
  // useFocusEffect guarantees tab switches immediately on native Android
  useFocusEffect(
    useCallback(() => {
      if (route.params?.initialTab) {
        setActiveTab(route.params.initialTab);
      }
    }, [route.params?.initialTab, route.params?.timestamp])
  );

  // For Date-Wise Tab
  const availableSessions = Object.values(records)
    .filter((r) => (selectedBatch === 'All' ? true : r.batch === selectedBatch))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const [selectedSessionKey, setSelectedSessionKey] = useState(
    availableSessions.length > 0
      ? `${availableSessions[0].date}_${availableSessions[0].batch}`
      : null
  );
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'present' | 'absent' | 'late'

  // Current session object
  const currentSession = records[selectedSessionKey] || availableSessions[0] || null;

  // Student-wise calculations using centralized StorageService calculation
  const studentRankings = students
    .filter((s) => (selectedBatch === 'All' ? true : s.batch?.trim() === selectedBatch?.trim()))
    .map((s) => {
      const stats = StorageService.calculateStudentStats(s.id, s.batch, records);
      return {
        ...s,
        totalClasses: stats.totalClasses,
        presentCount: stats.presentCount,
        absentCount: stats.absentCount,
        lateCount: stats.lateCount,
        effectiveAttended: stats.effectiveAttended,
        percentage: stats.percentage,
        isDefaulter: stats.isDefaulter,
        classesNeeded: stats.classesNeededFor75,
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  // Defaulters list (< 75%)
  const defaultersList = studentRankings.filter((s) => s.isDefaulter);

  // Export / Share function
  const handleExportShare = async () => {
    try {
      let content = `STUDENT ATTENDANCE REPORT\n`;
      content += `Generated on: ${new Date().toLocaleDateString()}\n`;
      content += `Batch: ${selectedBatch}\n`;
      content += `=====================================\n\n`;

      if (activeTab === 'dateWise') {
        if (!currentSession) {
          Alert.alert('No Data', 'No session data available to export.');
          return;
        }
        content += `Date: ${currentSession.date}\n`;
        content += `Batch: ${currentSession.batch}\n`;
        content += `Subject: ${currentSession.subject || 'Lecture'}\n\n`;
        content += `STUDENT ATTENDANCE ROLL:\n`;
        content += `Roll No | Name | Status\n`;
        content += `-------------------------------------\n`;

        const sessionStudents = students.filter(
          (s) => s.batch === currentSession.batch
        );
        sessionStudents.forEach((st) => {
          const stStatus = currentSession.records[st.id] || 'unmarked';
          content += `${st.rollNo} | ${st.name} | ${stStatus.toUpperCase()}\n`;
        });
      } else if (activeTab === 'defaulters') {
        content += `ATTENDANCE DEFAULTERS LIST (< 75% Criteria)\n`;
        content += `Total Defaulters: ${defaultersList.length}\n`;
        content += `-------------------------------------\n`;
        defaultersList.forEach((d, idx) => {
          content += `${idx + 1}. [${d.rollNo}] ${d.name} (${d.batch})\n`;
          content += `   Attendance: ${d.percentage}% (${d.presentCount}/${d.totalClasses} classes)\n`;
          content += `   Classes Required to Reach 75%: ${d.classesNeeded}\n\n`;
        });
      } else {
        content += `CUMULATIVE ATTENDANCE RANKINGS\n`;
        content += `-------------------------------------\n`;
        studentRankings.forEach((s, idx) => {
          content += `${idx + 1}. [${s.rollNo}] ${s.name}: ${s.percentage}% (${s.presentCount}/${s.totalClasses})\n`;
        });
      }

      await Share.share({
        title: `Attendance Report - ${selectedBatch}`,
        message: content,
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to share report.');
    }
  };

  const handleDeleteSession = (session) => {
    Alert.alert(
      'Delete Session',
      `Delete attendance session for ${session.batch} on ${session.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAttendance(session.date, session.batch);
            setSelectedSessionKey(null);
          },
        },
      ]
    );
  };

  // Render Date-Wise Details
  const renderDateWiseContent = () => {
    if (!currentSession) {
      return (
        <EmptyState
          icon="calendar-outline"
          title="No Sessions Recorded"
          description="Mark attendance for a class to view date-wise reports."
          actionLabel="Mark Attendance Now"
          onAction={() => navigation.navigate('Mark Attendance')}
        />
      );
    }

    const sessionStudents = students.filter(
      (s) => s.batch === currentSession.batch
    );
    const total = sessionStudents.length;
    let pCount = 0;
    let aCount = 0;
    let lCount = 0;

    sessionStudents.forEach((st) => {
      const stStatus = currentSession.records[st.id];
      if (stStatus === 'present') pCount += 1;
      else if (stStatus === 'absent') aCount += 1;
      else if (stStatus === 'late') lCount += 1;
    });

    const rate =
      total > 0 ? Math.round(((pCount + lCount * 0.5) / total) * 100) : 0;

    const displayedStudents = sessionStudents.filter((st) => {
      if (statusFilter === 'All') return true;
      return currentSession.records[st.id] === statusFilter;
    });

    return (
      <View style={styles.tabContentContainer}>
        {/* Session Selector Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={availableSessions}
          keyExtractor={(item) => `${item.date}_${item.batch}`}
          contentContainerStyle={styles.sessionDateList}
          renderItem={({ item }) => {
            const key = `${item.date}_${item.batch}`;
            const isSelected =
              selectedSessionKey === key ||
              (!selectedSessionKey && currentSession && `${currentSession.date}_${currentSession.batch}` === key);

            return (
              <TouchableOpacity
                style={[
                  styles.sessionChip,
                  isSelected && styles.sessionChipActive,
                ]}
                onPress={() => setSelectedSessionKey(key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sessionChipDate,
                    isSelected && styles.sessionChipDateActive,
                  ]}
                >
                  {item.date}
                </Text>
                <Text
                  style={[
                    styles.sessionChipBatch,
                    isSelected && styles.sessionChipBatchActive,
                  ]}
                >
                  {item.batch}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Selected Session Summary Card */}
        <View style={styles.sessionSummaryCard}>
          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryDateText}>{currentSession.date}</Text>
              <Text style={styles.summarySubjectText}>
                {currentSession.subject || 'Lecture'} • {currentSession.batch}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteSession(currentSession)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>

          <ProgressBar percentage={rate} height={8} showLabel />

          <View style={styles.statusCountRow}>
            <View style={styles.statusBoxSmall}>
              <Text style={[styles.statusBoxNum, { color: COLORS.presentDark }]}>
                {pCount}
              </Text>
              <Text style={styles.statusBoxLabel}>Present</Text>
            </View>
            <View style={styles.statusBoxSmall}>
              <Text style={[styles.statusBoxNum, { color: COLORS.absentDark }]}>
                {aCount}
              </Text>
              <Text style={styles.statusBoxLabel}>Absent</Text>
            </View>
            <View style={styles.statusBoxSmall}>
              <Text style={[styles.statusBoxNum, { color: COLORS.lateDark }]}>
                {lCount}
              </Text>
              <Text style={styles.statusBoxLabel}>Late</Text>
            </View>
            <View style={styles.statusBoxSmall}>
              <Text style={[styles.statusBoxNum, { color: COLORS.primary }]}>
                {rate}%
              </Text>
              <Text style={styles.statusBoxLabel}>Rate</Text>
            </View>
          </View>
        </View>

        {/* Filter by Status Pill Row */}
        <View style={styles.statusFilterRow}>
          {['All', 'present', 'absent', 'late'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.statusFilterChip,
                statusFilter === st && styles.statusFilterChipActive,
              ]}
              onPress={() => setStatusFilter(st)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  statusFilter === st && styles.statusFilterTextActive,
                ]}
              >
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Student Roll Call Results */}
        {displayedStudents.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Records Found"
            description="No students match the selected filter."
          />
        ) : (
          displayedStudents.map((item) => {
            const stStatus = currentSession.records[item.id] || 'unmarked';
            return (
              <View key={item.id} style={styles.rollItem}>
                <View style={styles.rollLeft}>
                  <Text style={styles.rollNo}>{item.rollNo}</Text>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <AttendanceStatusBadge status={stStatus} size="small" />
              </View>
            );
          })
        )}
      </View>
    );
  };

  // Render Student Ranking List
  const renderStudentWiseContent = () => {
    return (
      <View style={styles.tabContentContainer}>
        {studentRankings.length === 0 ? (
          <EmptyState
            icon="stats-chart"
            title="No Students Registered"
            description="Register students to see overall percentage rankings."
          />
        ) : (
          studentRankings.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.rankingCard}
              onPress={() => navigation.navigate('StudentDetail', { student: item })}
              activeOpacity={0.7}
            >
              <View style={styles.rankNumBadge}>
                <Text style={styles.rankNumText}>#{index + 1}</Text>
              </View>

              <View style={styles.rankingInfo}>
                <Text style={styles.rankingName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.rankingRoll}>
                  Roll: {item.rollNo} • {item.batch}
                </Text>
                <View style={{ marginTop: 6 }}>
                  <ProgressBar percentage={item.percentage} height={5} />
                </View>
              </View>

              <View style={styles.rankingRight}>
                <Text
                  style={[
                    styles.rankingPct,
                    {
                      color:
                        item.percentage >= 75
                          ? COLORS.present
                          : item.percentage >= 65
                          ? COLORS.late
                          : COLORS.danger,
                    },
                  ]}
                >
                  {item.percentage}%
                </Text>
                <Text style={styles.rankingClasses}>
                  {item.presentCount}/{item.totalClasses} classes
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  // Render Defaulters Content (< 75%)
  const renderDefaultersContent = () => {
    const criticalCount = defaultersList.filter((s) => s.percentage < 65).length;
    const borderlineCount = defaultersList.filter((s) => s.percentage >= 65 && s.percentage < 75).length;

    return (
      <View style={styles.tabContentContainer}>
        {/* Defaulter Policy Note */}
        <View style={styles.policyCard}>
          <Ionicons name="information-circle" size={22} color={COLORS.danger} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.policyText}>
              Academic Regulation: Students falling below <Text style={{ fontWeight: '700' }}>75%</Text> aggregate
              attendance are deemed ineligible for end-semester examinations unless recovered.
            </Text>
            {defaultersList.length > 0 && (
              <View style={styles.defaulterStatPillsRow}>
                <View style={[styles.statPill, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.statPillText, { color: COLORS.danger }]}>
                    Critical (&lt;65%): {criticalCount}
                  </Text>
                </View>
                <View style={[styles.statPill, { backgroundColor: '#FEF3C7', marginLeft: 6 }]}>
                  <Text style={[styles.statPillText, { color: COLORS.lateDark }]}>
                    At Risk (65-74%): {borderlineCount}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {defaultersList.length === 0 ? (
          <EmptyState
            icon="shield-checkmark"
            title="No Defaulters Found!"
            description={
              selectedBatch === 'All'
                ? 'All registered students across all batches have 75% or higher attendance.'
                : `All students in ${selectedBatch} have 75% or higher attendance.`
            }
            actionLabel={selectedBatch !== 'All' ? 'View All Batches' : undefined}
            onAction={selectedBatch !== 'All' ? () => setSelectedBatch('All') : undefined}
          />
        ) : (
          defaultersList.map((item) => {
            const isCritical = item.percentage < 65;
            const projectedPct =
              item.totalClasses + item.classesNeeded > 0
                ? Math.round(
                    ((item.effectiveAttended + item.classesNeeded) /
                      (item.totalClasses + item.classesNeeded)) *
                      1000
                  ) / 10
                : 75;

            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.defaulterCard,
                  isCritical ? styles.defaulterCardCritical : styles.defaulterCardBorderline,
                ]}
                onPress={() => navigation.navigate('StudentDetail', { student: item })}
                activeOpacity={0.7}
              >
                <View style={styles.defaulterHeaderRow}>
                  <View style={styles.defaulterNameBlock}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.defaulterStudentName}>{item.name}</Text>
                      <View
                        style={[
                          styles.severityTag,
                          { backgroundColor: isCritical ? '#FEE2E2' : '#FEF3C7' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityTagText,
                            { color: isCritical ? COLORS.danger : COLORS.lateDark },
                          ]}
                        >
                          {isCritical ? 'CRITICAL' : 'AT RISK'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.defaulterStudentRoll}>
                      {item.rollNo} • {item.batch}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.shortageBadge,
                      { backgroundColor: isCritical ? COLORS.absentLight : COLORS.lateLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.shortageText,
                        { color: isCritical ? COLORS.danger : COLORS.lateDark },
                      ]}
                    >
                      {item.percentage}%
                    </Text>
                  </View>
                </View>

                {/* Progress bar comparing with 75% goal */}
                <View style={{ marginVertical: 8 }}>
                  <ProgressBar percentage={item.percentage} height={6} />
                </View>

                <View style={styles.defaulterMetricRow}>
                  <Text style={styles.attendedRatio}>
                    Attended: <Text style={{ fontWeight: '700' }}>{item.presentCount}</Text>
                    {item.lateCount > 0 ? ` (+${item.lateCount} late)` : ''} of {item.totalClasses} lectures
                  </Text>
                  <Text style={styles.absentRatio}>
                    Missed: <Text style={{ fontWeight: '700', color: COLORS.danger }}>{item.absentCount}</Text> lectures
                  </Text>
                </View>

                {/* Recovery Formula Chip */}
                <View style={styles.recoveryChip}>
                  <Ionicons name="sparkles" size={15} color={COLORS.lateDark} />
                  <View style={{ marginLeft: 6, flex: 1 }}>
                    <Text style={styles.recoveryText}>
                      Recovery: Must attend next{' '}
                      <Text style={{ fontWeight: '800', color: COLORS.danger }}>
                        {item.classesNeeded} consecutive class{item.classesNeeded > 1 ? 'es' : ''}
                      </Text>{' '}
                      to achieve 75%.
                    </Text>
                    <Text style={styles.projectedText}>
                      Projected attendance after recovery: {projectedPct}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Analytics & Compliance</Text>
          <Text style={styles.headerTitle}>Attendance Reports</Text>
        </View>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={18} color={COLORS.primary} />
          <Text style={styles.exportBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Batch Selector */}
      <View style={styles.batchSelectorSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...batches]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.batchPill,
                selectedBatch === item && styles.batchPillActive,
              ]}
              onPress={() => setSelectedBatch(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.batchPillText,
                  selectedBatch === item && styles.batchPillTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Main Tab Segmented Controls */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'dateWise' && styles.tabItemActive]}
          onPress={() => setActiveTab('dateWise')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar"
            size={16}
            color={activeTab === 'dateWise' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'dateWise' && styles.tabTextActive,
            ]}
          >
            Date-Wise
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'studentWise' && styles.tabItemActive]}
          onPress={() => setActiveTab('studentWise')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="podium"
            size={16}
            color={activeTab === 'studentWise' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'studentWise' && styles.tabTextActive,
            ]}
          >
            Rankings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'defaulters' && styles.tabItemActive]}
          onPress={() => setActiveTab('defaulters')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="alert-circle"
            size={16}
            color={activeTab === 'defaulters' ? COLORS.danger : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'defaulters' && { color: COLORS.danger, fontWeight: '700' },
            ]}
          >
            Defaulters ({defaultersList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content (Clean single ScrollView for native Android reliability) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {activeTab === 'dateWise' && renderDateWiseContent()}
        {activeTab === 'studentWise' && renderStudentWiseContent()}
        {activeTab === 'defaulters' && renderDefaultersContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  batchSelectorSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  batchPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  batchPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  batchPillTextActive: {
    color: COLORS.textInverse,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabContentContainer: {
    padding: 16,
  },
  sessionDateList: {
    paddingBottom: 12,
  },
  sessionChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  sessionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sessionChipDate: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sessionChipDateActive: {
    color: COLORS.textInverse,
  },
  sessionChipBatch: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sessionChipBatchActive: {
    color: '#E0E7FF',
  },
  sessionSummaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryDateText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summarySubjectText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  statusBoxSmall: {
    alignItems: 'center',
  },
  statusBoxNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusBoxLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusFilterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statusFilterChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statusFilterTextActive: {
    color: COLORS.textInverse,
  },
  rollItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rollLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rollNo: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    width: 65,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  rankingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankNumBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  rankingInfo: {
    flex: 1,
    marginRight: 12,
  },
  rankingName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rankingRoll: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rankingRight: {
    alignItems: 'flex-end',
  },
  rankingPct: {
    fontSize: 16,
    fontWeight: '800',
  },
  rankingClasses: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    marginLeft: 8,
    lineHeight: 16,
  },
  defaulterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  defaulterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  defaulterNameBlock: {
    flex: 1,
    marginRight: 10,
  },
  defaulterStudentName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  defaulterStudentRoll: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  shortageBadge: {
    backgroundColor: COLORS.absentLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  shortageText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.danger,
  },
  defaulterMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  attendedRatio: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  absentRatio: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  recoveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lateLight,
    padding: 8,
    borderRadius: 10,
  },
  recoveryText: {
    fontSize: 11,
    color: COLORS.lateDark,
    marginLeft: 6,
    flex: 1,
  },
  defaulterStatPillsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  defaulterCardCritical: {
    borderColor: '#FECACA',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  defaulterCardBorderline: {
    borderColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.late,
  },
  severityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  severityTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  projectedText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
