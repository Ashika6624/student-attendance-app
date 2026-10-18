import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storageService';
import { BATCHES } from '../constants/colors';

const AttendanceContext = createContext();

export const AttendanceProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState({});
  const [batches, setBatches] = useState(BATCHES);
  const [selectedBatch, setSelectedBatch] = useState(BATCHES[0]);
  const [loading, setLoading] = useState(true);

  // Initial load
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await StorageService.initStorage();
      const loadedStudents = await StorageService.getStudents();
      const loadedRecords = await StorageService.getAttendanceRecords();
      const loadedBatches = await StorageService.getBatches();

      setStudents(loadedStudents);
      setRecords(loadedRecords);
      setBatches(loadedBatches.length > 0 ? loadedBatches : BATCHES);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refresh data from storage
  const refreshData = async () => {
    try {
      const loadedStudents = await StorageService.getStudents();
      const loadedRecords = await StorageService.getAttendanceRecords();
      setStudents(loadedStudents);
      setRecords(loadedRecords);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Add new student
  const addStudent = async (studentData) => {
    try {
      const created = await StorageService.saveStudent(studentData);
      setStudents((prev) => [created, ...prev]);
      return created;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  // Update existing student
  const updateStudent = async (id, updatedFields) => {
    try {
      const updated = await StorageService.updateStudent(id, updatedFields);
      setStudents((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  // Delete student
  const deleteStudent = async (id) => {
    try {
      await StorageService.deleteStudent(id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      // Refresh records to catch cleaned references
      const loadedRecords = await StorageService.getAttendanceRecords();
      setRecords(loadedRecords);
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  // Save attendance session
  const saveAttendance = async (date, batch, statusMap, subject) => {
    try {
      const savedSession = await StorageService.saveAttendanceSession(date, batch, statusMap, subject);
      setRecords((prev) => ({
        ...prev,
        [`${date}_${batch}`]: savedSession,
      }));
      return savedSession;
    } catch (error) {
      console.error('Error saving attendance:', error);
      throw error;
    }
  };

  // Delete attendance session
  const deleteAttendance = async (date, batch) => {
    try {
      await StorageService.deleteAttendanceSession(date, batch);
      setRecords((prev) => {
        const next = { ...prev };
        delete next[`${date}_${batch}`];
        return next;
      });
      return true;
    } catch (error) {
      console.error('Error deleting attendance session:', error);
      throw error;
    }
  };

  // Reset to demo data
  const resetDemoData = async () => {
    try {
      setLoading(true);
      const data = await StorageService.seedDemoData();
      setStudents(data.students);
      setRecords(data.attendance);
    } catch (error) {
      console.error('Error resetting demo data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear all data
  const clearAllData = async () => {
    try {
      setLoading(true);
      await StorageService.clearAllData();
      setStudents([]);
      setRecords({});
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper calculations
  const getStudentStats = (studentId, batch) => {
    return StorageService.calculateStudentStats(studentId, batch, records);
  };

  const getOverallStats = (batch = null) => {
    return StorageService.calculateOverallStats(students, records, batch);
  };

  return (
    <AttendanceContext.Provider
      value={{
        students,
        records,
        batches,
        selectedBatch,
        setSelectedBatch,
        loading,
        refreshData,
        addStudent,
        updateStudent,
        deleteStudent,
        saveAttendance,
        deleteAttendance,
        resetDemoData,
        clearAllData,
        getStudentStats,
        getOverallStats,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};
