import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAttendance } from '../context/AttendanceContext';
import { COLORS } from '../constants/colors';
import EmptyState from '../components/EmptyState';

export default function MarkAttendanceScreen({ navigation }) {
  const { students, records, batches, selectedBatch, setSelectedBatch, saveAttendance } =
    useAttendance();

  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [subject, setSubject] = useState('Core Computer Science');
  const [attendanceState, setAttendanceState] = useState({});
  const [isSaved, setIsSaved] = useState(false);

  // Filter students for currently selected batch
  const batchStudents = students.filter((s) => s.batch === selectedBatch);

  // When date or batch changes, load existing records if already marked
  useEffect(() => {
    const sessionKey = `${currentDate}_${selectedBatch}`;
    const existing = records[sessionKey];

    if (existing && existing.records) {
      setAttendanceState({ ...existing.records });
      if (existing.subject) setSubject(existing.subject);
      setIsSaved(true);
    } else {
      // Default initial state: empty or unselected
      const initial = {};
      batchStudents.forEach((student) => {
        initial[student.id] = null; // null = unmarked
      });
      setAttendanceState(initial);
      setIsSaved(false);
    }
  }, [currentDate, selectedBatch, records, students]);

  // Adjust Date
  const changeDateByDays = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const setStatusForStudent = (studentId, status) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setIsSaved(false);
  };

  const markAll = (status) => {
    const updated = {};
    batchStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceState(updated);
    setIsSaved(false);
  };

  // Calculations for real-time header
  const totalCount = batchStudents.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let markedCount = 0;

  batchStudents.forEach((s) => {
    const st = attendanceState[s.id];
    if (st === 'present') {
      presentCount += 1;
      markedCount += 1;
    } else if (st === 'absent') {
      absentCount += 1;
      markedCount += 1;
    } else if (st === 'late') {
      lateCount += 1;
      markedCount += 1;
    }
  });

  const effectiveAttended = presentCount + lateCount * 0.5;
  const currentPct =
    markedCount > 0 ? Math.round((effectiveAttended / markedCount) * 100) : 0;

  const handleSave = async () => {
    if (batchStudents.length === 0) {
      Alert.alert('No Students', 'No students enrolled in this batch to mark attendance.');
      return;
    }

    if (markedCount === 0) {
      Alert.alert('Incomplete Attendance', 'Please mark attendance for at least one student.');
      return;
    }

    // Default any unmarked student to absent with confirmation if some are unmarked
    if (markedCount < totalCount) {
      Alert.alert(
        'Unmarked Students',
        `You have marked ${markedCount} of ${totalCount} students. Any unmarked student will be marked Absent. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: () => performSave(true),
          },
        ]
      );
    } else {
      performSave(false);
    }
  };

  const performSave = async (fillUnmarkedAbsent) => {
    try {
      const finalMap = { ...attendanceState };
      if (fillUnmarkedAbsent) {
        batchStudents.forEach((s) => {
          if (!finalMap[s.id]) {
            finalMap[s.id] = 'absent';
          }
        });
      }

      await saveAttendance(currentDate, selectedBatch, finalMap, subject);
      setIsSaved(true);
      Alert.alert(
        'Attendance Saved!',
        `Records saved for ${selectedBatch} on ${currentDate}.\n\n` +
          `• Present: ${presentCount}\n• Absent: ${totalCount - presentCount - lateCount}\n• Late: ${lateCount}\n• Attendance Rate: ${currentPct}%`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance records. Please try again.');
    }
  };

  const renderStudentItem = ({ item }) => {
    const status = attendanceState[item.id];

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {item.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.rollNoText}>Roll: {item.rollNo}</Text>
          </View>
        </View>

        {/* Action Toggle Buttons: P, A, L */}
        <View style={styles.statusButtonsContainer}>
          {/* Present Button */}
          <TouchableOpacity
            style={[
              styles.statusBtn,
              status === 'present' ? styles.presentBtnActive : styles.statusBtnInactive,
            ]}
            onPress={() => setStatusForStudent(item.id, 'present')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statusBtnText,
                status === 'present'
                  ? styles.statusBtnTextActive
                  : { color: COLORS.presentDark },
              ]}
            >
              P
            </Text>
          </TouchableOpacity>

          {/* Absent Button */}
          <TouchableOpacity
            style={[
              styles.statusBtn,
              status === 'absent' ? styles.absentBtnActive : styles.statusBtnInactive,
            ]}
            onPress={() => setStatusForStudent(item.id, 'absent')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statusBtnText,
                status === 'absent'
                  ? styles.statusBtnTextActive
                  : { color: COLORS.absentDark },
              ]}
            >
              A
            </Text>
          </TouchableOpacity>

          {/* Late Button */}
          <TouchableOpacity
            style={[
              styles.statusBtn,
              status === 'late' ? styles.lateBtnActive : styles.statusBtnInactive,
            ]}
            onPress={() => setStatusForStudent(item.id, 'late')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.statusBtnText,
                status === 'late' ? styles.statusBtnTextActive : { color: COLORS.lateDark },
              ]}
            >
              L
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Class Roll Call</Text>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
        </View>
        {isSaved && (
          <View style={styles.savedBadge}>
            <Ionicons name="cloud-done" size={14} color={COLORS.presentDark} />
            <Text style={styles.savedBadgeText}>Saved</Text>
          </View>
        )}
      </View>

      {/* Date & Batch Controls */}
      <View style={styles.controlSection}>
        {/* Date Selector Row */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={() => changeDateByDays(-1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.dateCenter}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.dateDisplay}>{currentDate}</Text>
          </View>

          <TouchableOpacity
            style={styles.dateNavBtn}
            onPress={() => changeDateByDays(1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => setCurrentDate(new Date().toISOString().split('T')[0])}
            activeOpacity={0.7}
          >
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        </View>

        {/* Batch Selector */}
        <View style={styles.batchRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={batches}
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

        {/* Subject Input Row */}
        <View style={styles.subjectRow}>
          <Ionicons name="book-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.subjectInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject / Course Topic"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>
      </View>

      {/* Real-time Summary Card */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryMetric}>
          <Text style={styles.metricVal}>{totalCount}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryMetric}>
          <Text style={[styles.metricVal, { color: COLORS.presentDark }]}>
            {presentCount}
          </Text>
          <Text style={styles.metricLabel}>Present</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryMetric}>
          <Text style={[styles.metricVal, { color: COLORS.absentDark }]}>
            {absentCount}
          </Text>
          <Text style={styles.metricLabel}>Absent</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryMetric}>
          <Text style={[styles.metricVal, { color: COLORS.lateDark }]}>{lateCount}</Text>
          <Text style={styles.metricLabel}>Late</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryMetric}>
          <Text style={[styles.metricVal, { color: COLORS.primary }]}>{currentPct}%</Text>
          <Text style={styles.metricLabel}>Rate</Text>
        </View>
      </View>

      {/* Quick Bulk Actions */}
      <View style={styles.bulkActionsRow}>
        <TouchableOpacity
          style={[styles.bulkBtn, { backgroundColor: COLORS.presentLight }]}
          onPress={() => markAll('present')}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-done" size={15} color={COLORS.presentDark} />
          <Text style={[styles.bulkBtnText, { color: COLORS.presentDark }]}>
            All Present
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bulkBtn, { backgroundColor: COLORS.absentLight }]}
          onPress={() => markAll('absent')}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={15} color={COLORS.absentDark} />
          <Text style={[styles.bulkBtnText, { color: COLORS.absentDark }]}>
            All Absent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bulkBtn, { backgroundColor: COLORS.surface }]}
          onPress={() => {
            const cleared = {};
            batchStudents.forEach((s) => (cleared[s.id] = null));
            setAttendanceState(cleared);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={15} color={COLORS.textSecondary} />
          <Text style={[styles.bulkBtnText, { color: COLORS.textSecondary }]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {/* Student List */}
      <FlatList
        data={batchStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudentItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={`No Students in ${selectedBatch}`}
            description="Add students to this batch or pick a different batch to start marking attendance."
            actionLabel="Register Student"
            onAction={() => navigation.navigate('AddEditStudent', { prefillBatch: selectedBatch })}
          />
        }
      />

      {/* Bottom Floating Save Button */}
      {batchStudents.length > 0 && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons name="save-outline" size={20} color={COLORS.textInverse} />
            <Text style={styles.saveButtonText}>
              {isSaved ? 'Update Attendance' : 'Save Attendance'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.presentLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  savedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.presentDark,
    marginLeft: 4,
  },
  controlSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dateDisplay: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  todayBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  batchRow: {
    marginBottom: 8,
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
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  subjectInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginLeft: 6,
    paddingVertical: 0,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryMetric: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  bulkActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
  },
  bulkBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  nameContainer: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  rollNoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    borderWidth: 1,
  },
  statusBtnInactive: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  presentBtnActive: {
    backgroundColor: COLORS.present,
    borderColor: COLORS.presentDark,
  },
  absentBtnActive: {
    backgroundColor: COLORS.absent,
    borderColor: COLORS.absentDark,
  },
  lateBtnActive: {
    backgroundColor: COLORS.late,
    borderColor: COLORS.lateDark,
  },
  statusBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
