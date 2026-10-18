import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAttendance } from '../context/AttendanceContext';
import { COLORS } from '../constants/colors';
import SearchBar from '../components/SearchBar';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';

export default function StudentsScreen({ navigation }) {
  const { students, records, batches, deleteStudent } = useAttendance();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');

  // Filter students based on search and selected batch
  const filteredStudents = students.filter((student) => {
    const matchesBatch = selectedBatch === 'All' || student.batch === selectedBatch;
    const matchesQuery =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBatch && matchesQuery;
  });

  const handleDelete = (student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to remove "${student.name}" (${student.rollNo})? All attendance history for this student will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete student.');
            }
          },
        },
      ]
    );
  };

  const renderStudentItem = ({ item }) => {
    // Calculate student attendance stats
    let totalClasses = 0;
    let presentCount = 0;
    let lateCount = 0;

    Object.values(records).forEach((session) => {
      if (session.batch === item.batch && session.records && session.records[item.id]) {
        totalClasses += 1;
        if (session.records[item.id] === 'present') presentCount += 1;
        else if (session.records[item.id] === 'late') lateCount += 1;
      }
    });

    const effective = presentCount + lateCount * 0.5;
    const percentage =
      totalClasses > 0 ? Math.round((effective / totalClasses) * 1000) / 10 : 0;

    let badgeColor = COLORS.present;
    let badgeBg = COLORS.presentLight;
    if (totalClasses > 0) {
      if (percentage < 65) {
        badgeColor = COLORS.absent;
        badgeBg = COLORS.absentLight;
      } else if (percentage < 75) {
        badgeColor = COLORS.late;
        badgeBg = COLORS.lateLight;
      }
    } else {
      badgeColor = COLORS.textMuted;
      badgeBg = COLORS.surface;
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('StudentDetail', { student: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
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
          <View style={styles.infoCol}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.subRow}>
              <Text style={styles.rollBadge}>{item.rollNo}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.batchText}>{item.batch}</Text>
            </View>
          </View>
          <View style={[styles.pctBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.pctBadgeText, { color: badgeColor }]}>
              {totalClasses > 0 ? `${percentage}%` : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Attendance Progress & Metrics */}
        <View style={styles.cardFooter}>
          <ProgressBar percentage={percentage} height={6} />
          <View style={styles.statsSummaryRow}>
            <Text style={styles.statLabel}>
              Attended: <Text style={styles.statVal}>{presentCount}/{totalClasses}</Text> classes
            </Text>
            <View style={styles.actionsInline}>
              <TouchableOpacity
                onPress={() => navigation.navigate('AddEditStudent', { student: item })}
                style={styles.editBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Student Directory</Text>
          <Text style={styles.headerTitle}>All Registered Students</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddEditStudent')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={18} color={COLORS.textInverse} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Batch Filters */}
      <View style={styles.filterSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by student name or roll no..."
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...batches]}
          keyExtractor={(item) => item}
          style={styles.batchFilterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.batchFilterChip,
                selectedBatch === item && styles.batchFilterChipActive,
              ]}
              onPress={() => setSelectedBatch(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.batchFilterText,
                  selectedBatch === item && styles.batchFilterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Student List */}
      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderStudentItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="people"
            title="No Students Found"
            description={
              searchQuery
                ? `No students matching "${searchQuery}"`
                : 'No students registered in this batch yet.'
            }
            actionLabel="Register New Student"
            onAction={() => navigation.navigate('AddEditStudent')}
          />
        }
      />
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  filterSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  batchFilterList: {
    marginTop: 10,
  },
  batchFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  batchFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  batchFilterTextActive: {
    color: COLORS.textInverse,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  infoCol: {
    flex: 1,
    marginRight: 8,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  rollBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dot: {
    marginHorizontal: 6,
    color: COLORS.textMuted,
  },
  batchText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pctBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardFooter: {
    marginTop: 4,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statVal: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionsInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editBtn: {
    padding: 4,
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
});
