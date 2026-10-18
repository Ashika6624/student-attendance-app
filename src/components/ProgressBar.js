import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

export default function ProgressBar({
  percentage = 0,
  height = 8,
  showLabel = false,
  labelStyle,
}) {
  const clamped = Math.min(Math.max(percentage, 0), 100);

  // Determine color based on college academic threshold:
  // >= 75%: Green (Safe)
  // 65% - 74.9%: Amber (Warning / At Risk)
  // < 65%: Red (Critical Shortage)
  let barColor = COLORS.present;
  if (clamped < 65) {
    barColor = COLORS.absent;
  } else if (clamped < 75) {
    barColor = COLORS.late;
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={[styles.labelText, labelStyle]}>Attendance</Text>
          <Text style={[styles.percentageText, { color: barColor }]}>
            {clamped}%
          </Text>
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clamped}%`,
              backgroundColor: barColor,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 6,
  },
});
