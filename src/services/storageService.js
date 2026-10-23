import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_STUDENTS, generateDemoAttendance } from '../constants/defaultData';
import { BATCHES } from '../constants/colors';

const STORAGE_KEYS = {
  STUDENTS: '@attendance_app_students',
  ATTENDANCE: '@attendance_app_records',
  BATCHES: '@attendance_app_batches',
  INITIALIZED: '@attendance_app_initialized_v1',
};

export const StorageService = {
  // Initialize storage with demo data if empty
  async initStorage() {
    try {
      const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!initialized) {
        await this.seedDemoData();
      }
    } catch (error) {
      console.error('StorageService.initStorage error:', error);
    }
  },

  // ---------------- STUDENTS ----------------
  async getStudents() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS);
      return json != null ? JSON.parse(json) : [];
    } catch (error) {
      console.error('StorageService.getStudents error:', error);
      return [];
    }
  },

  async saveStudent(studentData) {
    try {
      const students = await this.getStudents();
      const newStudent = {
        id: studentData.id || `s-${Date.now()}`,
        rollNo: studentData.rollNo.trim(),
        name: studentData.name.trim(),
        batch: studentData.batch || 'MCA 1st Year',
        email: studentData.email?.trim() || '',
        phone: studentData.phone?.trim() || '',
        gender: studentData.gender || 'Not Specified',
        createdAt: new Date().toISOString(),
      };

      const updated = [newStudent, ...students];
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));
      return newStudent;
    } catch (error) {
      console.error('StorageService.saveStudent error:', error);
      throw error;
    }
  },

  async updateStudent(id, updatedFields) {
    try {
      const students = await this.getStudents();
      const index = students.findIndex((s) => s.id === id);
      if (index === -1) throw new Error('Student not found');

      students[index] = {
        ...students[index],
        ...updatedFields,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      return students[index];
    } catch (error) {
      console.error('StorageService.updateStudent error:', error);
      throw error;
    }
  },

  async deleteStudent(id) {
    try {
      const students = await this.getStudents();
      const filtered = students.filter((s) => s.id !== id);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));

      // Also clean up student ID from attendance records
      const records = await this.getAttendanceRecords();
      let recordsModified = false;
      Object.keys(records).forEach((key) => {
        if (records[key].records && records[key].records[id]) {
          delete records[key].records[id];
          recordsModified = true;
        }
      });
      if (recordsModified) {
        await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
      }

      return true;
    } catch (error) {
      console.error('StorageService.deleteStudent error:', error);
      throw error;
    }
  },

  // ---------------- ATTENDANCE ----------------
  async getAttendanceRecords() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return json != null ? JSON.parse(json) : {};
    } catch (error) {
      console.error('StorageService.getAttendanceRecords error:', error);
      return {};
    }
  },

  async saveAttendanceSession(date, batch, studentStatusMap, subject = 'Core Computer Science') {
    try {
      const records = await this.getAttendanceRecords();
      const key = `${date}_${batch}`;

      records[key] = {
        date,
        batch,
        subject,
        records: studentStatusMap, // { [studentId]: 'present' | 'absent' | 'late' }
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
      return records[key];
    } catch (error) {
      console.error('StorageService.saveAttendanceSession error:', error);
      throw error;
    }
  },

  async deleteAttendanceSession(date, batch) {
    try {
      const records = await this.getAttendanceRecords();
      const key = `${date}_${batch}`;
      if (records[key]) {
        delete records[key];
        await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
      }
      return true;
    } catch (error) {
      console.error('StorageService.deleteAttendanceSession error:', error);
      throw error;
    }
  },

  // ---------------- BATCHES ----------------
  async getBatches() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.BATCHES);
      return json != null ? JSON.parse(json) : BATCHES;
    } catch (error) {
      return BATCHES;
    }
  },

  // ---------------- CALCULATIONS & ANALYTICS ----------------
  calculateStudentStats(studentId, batch, allRecords) {
    let totalClasses = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    const history = [];

    // Collect all sessions that were either conducted for this batch or recorded this student
    const sessions = Object.values(allRecords || {}).filter((session) => {
      const matchBatch = session.batch && batch && session.batch.trim().toLowerCase() === batch.trim().toLowerCase();
      const hasRecord = session.records && session.records[studentId] !== undefined;
      return matchBatch || hasRecord;
    });

    sessions.forEach((session) => {
      totalClasses += 1;
      const status = (session.records && session.records[studentId]) || 'absent';
      if (status === 'present') {
        presentCount += 1;
      } else if (status === 'late') {
        lateCount += 1;
      } else {
        absentCount += 1;
      }

      history.push({
        date: session.date,
        status,
        subject: session.subject || 'Lecture',
        batch: session.batch,
      });
    });

    // Sort history date descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Academic percentage calculation: Late counts as 0.5 (half credit)
    const effectiveAttended = presentCount + lateCount * 0.5;
    const percentage = totalClasses > 0 ? Math.round((effectiveAttended / totalClasses) * 1000) / 10 : 0;

    // Defaulter math: classes needed to attend consecutively to reach 75%
    // Condition: (effectiveAttended + X) / (totalClasses + X) >= 0.75
    // X >= (0.75 * totalClasses - effectiveAttended) / 0.25
    let classesNeededFor75 = 0;
    const isDefaulter = totalClasses > 0 && percentage < 75;
    if (isDefaulter) {
      const required = (0.75 * totalClasses - effectiveAttended) / 0.25;
      classesNeededFor75 = Math.max(1, Math.ceil(Math.round(required * 1000) / 1000));
    }

    return {
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      effectiveAttended,
      percentage,
      isDefaulter,
      classesNeededFor75,
      history,
    };
  },

  calculateOverallStats(students, records, selectedBatch = null) {
    const isAll = !selectedBatch || selectedBatch === 'All';
    const targetStudents = isAll
      ? students
      : students.filter((s) => s.batch && s.batch.trim().toLowerCase() === selectedBatch.trim().toLowerCase());

    const studentCount = targetStudents.length;

    const sessions = Object.values(records || {}).filter((r) =>
      isAll ? true : (r.batch && r.batch.trim().toLowerCase() === selectedBatch.trim().toLowerCase())
    );

    let defaultersCount = 0;
    let criticalDefaultersCount = 0;
    let borderlineDefaultersCount = 0;

    targetStudents.forEach((student) => {
      const stats = this.calculateStudentStats(student.id, student.batch, records);
      if (stats.isDefaulter) {
        defaultersCount += 1;
        if (stats.percentage < 65) {
          criticalDefaultersCount += 1;
        } else {
          borderlineDefaultersCount += 1;
        }
      }
    });

    let totalAttendanceEntries = 0;
    let totalPresentEntries = 0;

    sessions.forEach((session) => {
      if (session.records) {
        Object.entries(session.records).forEach(([studentId, status]) => {
          const belongs = targetStudents.some((s) => s.id === studentId);
          if (belongs) {
            totalAttendanceEntries += 1;
            if (status === 'present') totalPresentEntries += 1;
            else if (status === 'late') totalPresentEntries += 0.5;
          }
        });
      }
    });

    const overallPercentage =
      totalAttendanceEntries > 0
        ? Math.round((totalPresentEntries / totalAttendanceEntries) * 1000) / 10
        : 0;

    return {
      totalStudents: studentCount,
      totalSessions: sessions.length,
      overallPercentage,
      defaultersCount,
      criticalDefaultersCount,
      borderlineDefaultersCount,
    };
  },

  // ---------------- SEED & RESET ----------------
  async seedDemoData() {
    try {
      const demoAttendance = generateDemoAttendance(INITIAL_STUDENTS);
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(demoAttendance));
      await AsyncStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(BATCHES));
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      return { students: INITIAL_STUDENTS, attendance: demoAttendance };
    } catch (error) {
      console.error('StorageService.seedDemoData error:', error);
      throw error;
    }
  },

  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.STUDENTS,
        STORAGE_KEYS.ATTENDANCE,
        STORAGE_KEYS.BATCHES,
        STORAGE_KEYS.INITIALIZED,
      ]);
      return true;
    } catch (error) {
      console.error('StorageService.clearAllData error:', error);
      throw error;
    }
  },
};
