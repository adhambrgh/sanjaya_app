import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { headerButtonStyle } from './HeaderCartButton';

export default function HeaderSearchButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={headerButtonStyle}>
      <Ionicons name='search' size={18} color='#fff' />
    </TouchableOpacity>
  );
}