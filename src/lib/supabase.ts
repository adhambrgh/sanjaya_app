// ===== IMPORT (mengambil library / file yang dibutuhkan) =====

// polyfill URL untuk React Native (diperlukan oleh Supabase client di lingkungan RN)
import 'react-native-url-polyfill/auto';
// AsyncStorage untuk menyimpan session/auth secara persisten
import AsyncStorage from '@react-native-async-storage/async-storage';
// createClient dari supabase-js untuk inisialisasi klien Supabase
import { createClient } from '@supabase/supabase-js';
// WebBrowser dari Expo untuk menangani auth session (OAuth, deep linking)
import * as WebBrowser from 'expo-web-browser';

// ===== SETUP AUTH WEB BROWSER =====

// melengkapi auth session jika ada hasil redirect dari OAuth (berguna untuk Expo/React Native)
WebBrowser.maybeCompleteAuthSession();

// ===== KONFIGURASI SUPABASE =====

// URL project Supabase
export const SUPABASE_URL = 'https://hutraaxldkyvhbvqebqq.supabase.co';
// anon/public key Supabase (publishable key) - aman dipakai di client
export const SUPABASE_ANON_KEY = 'sb_publishable_opdv4m4v5uUEYUp-SA3NhQ_i8LJ0lWG';

// ===== INISIALISASI KLIEN SUPABASE =====

// membuat instance klien Supabase dengan konfigurasi auth untuk React Native
// - storage: AsyncStorage -> session tersimpan persisten di perangkat
// - autoRefreshToken: true -> token refresh otomatis saat hampir expired
// - persistSession: true -> mempertahankan session antar buka aplikasi
// - detectSessionInUrl: true -> mendeteksi session dari URL redirect
// - flowType: 'pkce' -> PKCE flow (aman untuk mobile)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
