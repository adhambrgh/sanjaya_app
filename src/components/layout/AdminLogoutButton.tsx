import React from 'react';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headerButtonStyle } from './HeaderCartButton';

export default function AdminLogoutButton({ onSignOut }: { onSignOut: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole='button'
      accessibilityLabel='Keluar'
      onPress={() => {
        if (Platform.OS === 'web') {
          if (window.confirm('Keluar dari akun admin?')) onSignOut();
        } else {
          Alert.alert('Keluar', 'Keluar dari akun admin?', [
            { text: 'Batal', style: 'cancel' },
            { text: 'Keluar', style: 'destructive', onPress: onSignOut },
          ]);
        }
      }}
      style={headerButtonStyle}
    >
      <Ionicons name='log-out-outline' size={18} color='#fff' />
    </TouchableOpacity>
  );
}