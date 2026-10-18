import type { Palette } from '../theme';
import type { ViewStyle, TextStyle } from 'react-native';

type CommonStyles = Record<string, ViewStyle | TextStyle>;

export const makeCommonStyles = (c: Palette): CommonStyles => ({
  screenHeader: {
    backgroundColor: c.primary,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  headerBrand: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 16,
    letterSpacing: 0.6,
  },
  headerSubtitle: {
    color: '#D4C5A9',
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cartBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FDC003',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    color: '#261A00',
  },
  accentLine: {
    height: 3,
    width: 40,
    backgroundColor: c.accent,
    borderRadius: 3,
    marginTop: 12,
  },
  card: {
    backgroundColor: c.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_800ExtraBold',
    color: '#261A00',
  },
});