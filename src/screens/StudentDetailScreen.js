import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAttendance } from '../context/AttendanceContext';
import { StorageService } from '../services/storageService';
import { COLORS } from '../constants/colors';
import ProgressBar from '../components/ProgressBar';
import AttendanceStatusBadge from '../components/AttendanceStatusBadge';

export default function StudentDetailScreen({ navigation, route }) {
  const { student } = route.params;
  const { records, students } = useAttendance();

  // Find latest state of this student in case it was updated
  const currentStudent = students.find((s) => s.id === student.id) || student;

  // Compute attendance stats using centralized calculation
  const stats = StorageService.calculateStudentStats(
    currentStudent.id,
    currentStudent.batch,
    records
  );

  const totalClasses = stats.totalClasses;
  const presentCount = stats.presentCount;
  const absentCount = stats.absentCount;
  const lateCount = stats.lateCount;
  const percentage = stats.percentage;
  const isDefaulter = stats.isDefaulter;
  const classesNeeded = stats.classesNeededFor75;
  const history = stats.history;

  const handleCall = () => {
    if (currentStudent.phone) {
      Linking.openURL(`tel:${currentStudent.phone}`);
    }
  };

  const handleEmail = () => {
    if (currentStudent.email) {
      Linking.openURL(`mailto:${currentStudent.email}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Profile</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('AddEditStudent', { student: currentStudent })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="create-outline" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {currentStudent.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{currentStudent.name}</Text>
          <Text style={styles.profileRoll}>Roll No: {currentStudent.rollNo}</Text>
          <View style={styles.batchPill}>
            <Text style={styles.batchPillText}>{currentStudent.batch}</Text>
          </View>

          {/* Quick Contact Actions */}
          <View style={styles.contactRow}>
            {currentStudent.phone ? (
              <TouchableOpacity
                style={styles.contactActionBtn}
                onPress={handleCall}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={16} color={COLORS.primary} />
                <Text style={styles.contactActionText}>Call</Text>
              </TouchableOpacity>
            ) : null}

            {currentStudent.email ? (
              <TouchableOpacity
                style={styles.contactActionBtn}
                onPress={handleEmail}
                activeOpacity={0.7}
              >
                <Ionicons name="mail" size={16} color={COLORS.primary} />
                <Text style={styles.contactActionText}>Email</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Attendance Percentage Card */}
        <View style={styles.pctCard}>
          <View style={styles.pctHeaderRow}>
            <View>
              <Text style={styles.pctCardTitle}>Attendance Status</Text>
              <Text style={styles.pctCardSub}>
                {totalClasses > 0 ? `${totalClasses} Total Lectures Held` : 'No sessions recorded yet'}
              </Text>
            </View>
            <Text
              style={[
                styles.bigPctText,
                {
                  color:
                    percentage >= 75
                      ? COLORS.present
                      : percentage >= 65
                      ? COLORS.late
                      : COLORS.danger,
                },
              ]}
            >
              {totalClasses > 0 ? `${percentage}%` : 'N/A'}
            </Text>
          </View>

          <ProgressBar percentage={percentage} height={10} />

          {/* Defaulter / Eligibility Status Alert */}
          {totalClasses > 0 && (
            <View
              style={[
                styles.statusBox,
                percentage >= 75 ? styles.statusBoxSafe : styles.statusBoxWarning,
              ]}
            >
              <Ionicons
                name={percentage >= 75 ? 'shield-checkmark' : 'alert-circle'}
                size={20}
                color={percentage >= 75 ? COLORS.presentDark : COLORS.danger}
              />
              <View style={styles.statusBoxTextContainer}>
                <Text
                  style={[
                    styles.statusBoxTitle,
                    { color: percentage >= 75 ? COLORS.presentDark : COLORS.danger },
                  ]}
                >
                  {percentage >= 75 ? 'Eligible for Examinations' : 'Attendance Shortage Alert'}
                </Text>
                <Text style={styles.statusBoxDesc}>
                  {percentage >= 75
                    ? 'Student meets the minimum 75% college attendance criteria.'
                    : `Needs to attend next ${classesNeeded} consecutive class${classesNeeded > 1 ? 'es' : ''} to reach 75%.`}
                </Text>
              </View>
            </View>
          )}

          {/* 3 Metrics breakdown */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: COLORS.presentDark }]}>
                {presentCount}
              </Text>
              <Text style={styles.metricTitle}>Present</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: COLORS.absentDark }]}>
                {absentCount}
              </Text>
              <Text style={styles.metricTitle}>Absent</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricVal, { color: COLORS.lateDark }]}>
                {lateCount}
              </Text>
              <Text style={styles.metricTitle}>Late</Text>
            </View>
          </View>
        </View>

        {/* Contact & Meta Details */}
        <View style={styles.metaCard}>
          <Text style={styles.metaCardTitle}>Contact & Info</Text>
          <View style={styles.metaRow}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{currentStudent.email || 'Not provided'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{currentStudent.phone || 'Not provided'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={18} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>Gender: {currentStudent.gender || 'Not specified'}</Text>
          </View>
        </View>

        {/* Attendance History Timeline */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Attendance History</Text>
          {history.length === 0 ? (
            <Text style={styles.noHistoryText}>No attendance records found for this student.</Text>
          ) : (
            history.map((item, index) => (
              <View key={`${item.date}_${index}`} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyDate}>{item.date}</Text>
                  <Text style={styles.historySubject}>{item.subject}</Text>
                </View>
                <AttendanceStatusBadge status={item.status} size="small" />
              </View>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 6,
  },
  editBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  profileRoll: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  batchPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchPillText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  contactActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  contactActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  pctCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  pctHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pctCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  pctCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bigPctText: {
    fontSize: 28,
    fontWeight: '800',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
  },
  statusBoxSafe: {
    backgroundColor: COLORS.presentLight,
    borderColor: '#A7F3D0',
  },
  statusBoxWarning: {
    backgroundColor: COLORS.absentLight,
    borderColor: '#FECACA',
  },
  statusBoxTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  statusBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBoxDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  metaCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  metaCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    marginLeft: 10,
  },
  historySection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  noHistoryText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },
  historyLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  historySubject: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
