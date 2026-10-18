import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function AttendanceStatusBadge({ status, size = 'medium' }) {
  const normalized = (status || '').toLowerCase();

  let config = {
    label: 'Not Marked',
    color: COLORS.textMuted,
    bg: COLORS.surface,
    icon: 'help-circle-outline',
  };

  if (normalized === 'present') {
    config = {
      label: 'Present',
      color: COLORS.presentDark,
      bg: COLORS.presentLight,
      icon: 'checkmark-circle',
    };
  } else if (normalized === 'absent') {
    config = {
      label: 'Absent',
      color: COLORS.absentDark,
      bg: COLORS.absentLight,
      icon: 'close-circle',
    };
  } else if (normalized === 'late') {
    config = {
      label: 'Late',
      color: COLORS.lateDark,
      bg: COLORS.lateLight,
      icon: 'time',
    };
  }

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={isSmall ? 12 : 14}
        color={config.color}
        style={{ marginRight: 4 }}
      />
      <Text
        style={[
          styles.label,
          { color: config.color },
          isSmall && styles.labelSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
});
