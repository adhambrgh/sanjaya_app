import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../store/cart';

export default function HeaderCartButton({ onPress }: { onPress: () => void }) {
  const cart = useCart();
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <Ionicons name='cart' size={18} color='#fff' />
      {cart.itemCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{cart.itemCount > 99 ? '99+' : cart.itemCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export const headerButtonStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: 'rgba(255,255,255,0.14)',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const styles = StyleSheet.create({
  button: headerButtonStyle,
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FDC003',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#261A00' },
});