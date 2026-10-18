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

    Object.values(allRecords).forEach((session) => {
      // Check if session applies to student's batch
      if (session.batch === batch && session.records && session.records[studentId]) {
        totalClasses += 1;
        const status = session.records[studentId];
        if (status === 'present') presentCount += 1;
        else if (status === 'absent') absentCount += 1;
        else if (status === 'late') lateCount += 1;

        history.push({
          date: session.date,
          status,
          subject: session.subject || 'Lecture',
        });
      }
    });

    // Sort history date descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Academic percentage calculation: Late counts as 0.5 (or Present based on policy; here 0.5 attendance)
    // Percentage formula: ((Present + 0.5 * Late) / Total) * 100
    const effectiveAttended = presentCount + lateCount * 0.5;
    const percentage = totalClasses > 0 ? Math.round((effectiveAttended / totalClasses) * 1000) / 10 : 0;

    // Defaulter math: classes needed to attend consecutively to reach 75%
    // (effectiveAttended + x) / (totalClasses + x) >= 0.75
    // effectiveAttended + x >= 0.75 * totalClasses + 0.75 * x
    // 0.25 * x >= 0.75 * totalClasses - effectiveAttended
    // x >= (0.75 * totalClasses - effectiveAttended) / 0.25
    let classesNeededFor75 = 0;
    if (totalClasses > 0 && percentage < 75) {
      const required = (0.75 * totalClasses - effectiveAttended) / 0.25;
      classesNeededFor75 = Math.max(0, Math.ceil(required));
    }

    return {
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      percentage,
      classesNeededFor75,
      history,
    };
  },

  calculateOverallStats(students, records, selectedBatch = null) {
    const targetStudents = selectedBatch ? students.filter((s) => s.batch === selectedBatch) : students;
    const studentCount = targetStudents.length;

    const sessions = Object.values(records).filter((r) =>
      selectedBatch ? r.batch === selectedBatch : true
    );

    let totalAttendanceEntries = 0;
    let totalPresentEntries = 0;
    let defaultersCount = 0;

    targetStudents.forEach((student) => {
      const stats = this.calculateStudentStats(student.id, student.batch, records);
      if (stats.totalClasses > 0 && stats.percentage < 75) {
        defaultersCount += 1;
      }
    });

    sessions.forEach((session) => {
      if (session.records) {
        Object.entries(session.records).forEach(([studentId, status]) => {
          // Verify student belongs to target batch
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
