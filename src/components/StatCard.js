import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = COLORS.primary,
  bgColor = COLORS.primaryLight,
  style,
  onPress,
}) {
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.textMuted}
            style={{ marginLeft: 4 }}
          />
        )}
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
});
