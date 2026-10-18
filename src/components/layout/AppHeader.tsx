import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type AppHeaderProps = {
  variant?: 'customer' | 'admin';
  title?: string;
  subtitle?: string;
};

export default function AppHeader({ variant = 'customer', title = 'SANJAYA', subtitle }: AppHeaderProps) {
  const defaultSubtitle = variant === 'admin' ? 'Admin Panel • Santren Jaya' : 'Santren Jaya Motor';
  const finalSubtitle = subtitle ?? defaultSubtitle;

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: { width: 28, height: 28, borderRadius: 14 },
    textContainer: {},
    title: {
      color: '#fff',
      fontFamily: 'Poppins_800ExtraBold',
      fontSize: variant === 'admin' ? 14 : 16,
      letterSpacing: variant === 'admin' ? 0.5 : 0.6,
    },
    subtitle: {
      color: variant === 'admin' ? '#D4C5A9' : '#D4C5A9',
      fontSize: variant === 'admin' ? 10 : 11,
      marginTop: 1,
      fontFamily: 'Inter_500Medium',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Image source={require('../../../assets/images/logosanjaya.png')} style={styles.logo} resizeMode='contain' />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{finalSubtitle}</Text>
      </View>
    </View>
  );
}