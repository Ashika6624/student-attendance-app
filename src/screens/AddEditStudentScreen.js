import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAttendance } from '../context/AttendanceContext';
import { COLORS } from '../constants/colors';

export default function AddEditStudentScreen({ navigation, route }) {
  const { student, prefillBatch } = route.params || {};
  const isEditing = !!student;

  const { batches, addStudent, updateStudent, students } = useAttendance();

  const [name, setName] = useState(student ? student.name : '');
  const [rollNo, setRollNo] = useState(student ? student.rollNo : '');
  const [batch, setBatch] = useState(
    student ? student.batch : prefillBatch || batches[0] || 'MCA 1st Year'
  );
  const [email, setEmail] = useState(student ? student.email : '');
  const [phone, setPhone] = useState(student ? student.phone : '');
  const [gender, setGender] = useState(student ? student.gender : 'Male');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter student name.');
      return;
    }
    if (!rollNo.trim()) {
      Alert.alert('Validation Error', 'Please enter student roll number or ID.');
      return;
    }

    // Check unique roll number if adding
    if (!isEditing) {
      const exists = students.some(
        (s) => s.rollNo.toLowerCase() === rollNo.trim().toLowerCase()
      );
      if (exists) {
        Alert.alert(
          'Duplicate Roll No',
          `A student with Roll No "${rollNo.trim()}" is already registered. Please use a unique roll number.`
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const studentData = {
        name: name.trim(),
        rollNo: rollNo.trim(),
        batch,
        email: email.trim(),
        phone: phone.trim(),
        gender,
      };

      if (isEditing) {
        await updateStudent(student.id, studentData);
        Alert.alert('Success', 'Student details updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addStudent(studentData);
        Alert.alert('Success', 'New student registered successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save student details. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Student Details' : 'Student Registration'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="person-add" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>
                {isEditing ? 'Update Student Record' : 'Enroll New Student'}
              </Text>
              <Text style={styles.bannerSub}>
                Enter the academic & personal credentials below to record in attendance register.
              </Text>
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. John Doe"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Roll Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Roll No / Student ID <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="id-card-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={rollNo}
                onChangeText={setRollNo}
                placeholder="e.g. MCA-01 or 24MCA001"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Class / Batch Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Class / Batch</Text>
            <View style={styles.batchOptions}>
              {batches.map((b) => {
                const isSelected = batch === b;
                return (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.batchChoice,
                      isSelected && styles.batchChoiceActive,
                    ]}
                    onPress={() => setBatch(b)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.batchChoiceText,
                        isSelected && styles.batchChoiceTextActive,
                      ]}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Gender Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((g) => {
                const isSelected = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderChip,
                      isSelected && styles.genderChipActive,
                    ]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        g === 'Male'
                          ? 'male'
                          : g === 'Female'
                          ? 'female'
                          : 'person'
                      }
                      size={16}
                      color={isSelected ? COLORS.textInverse : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.genderChipText,
                        isSelected && styles.genderChipTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="e.g. student@college.edu"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. +91 98765 43210"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={{ height: 20 }} />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isEditing ? 'checkmark-circle-outline' : 'person-add'}
              size={20}
              color={COLORS.textInverse}
            />
            <Text style={styles.saveBtnText}>
              {isSubmitting
                ? 'Saving Student...'
                : isEditing
                ? 'Save Changes'
                : 'Register Student'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  required: {
    color: COLORS.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  batchOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  batchChoice: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
  },
  batchChoiceActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  batchChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  batchChoiceTextActive: {
    color: COLORS.textInverse,
  },
  genderRow: {
    flexDirection: 'row',
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: 40,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  genderChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  genderChipTextActive: {
    color: COLORS.textInverse,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
