import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider'; // Install this package
import { COLORS } from '../../../../shared/constants/colors';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onValueChange: (val: number) => void;
  unit?: string;
}

export default function SliderControl({ label, value, min, max, onValueChange, unit }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.round(value)} {unit}</Text>
      </View>
      <Slider
        style={{ width: '100%', height: 40 }}
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={COLORS.secondary}
        maximumTrackTintColor="#555"
        thumbTintColor={COLORS.secondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { color: COLORS.textLight, fontSize: 14, fontWeight: '600' },
  value: { color: COLORS.secondary, fontWeight: 'bold' },
});