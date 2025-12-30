import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Good Morning</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>Verse of the Day</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.verseText, { color: colors.text }]}>
            "In the beginning was the Word, and the Word was with God, and the Word was God."
          </Text>
          <Text style={[styles.verseRef, { color: colors.tint }]}>John 1:1 KJV</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/(tabs)/bible')}
          >
            <Ionicons name="book-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Read Bible</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
            onPress={() => router.push('/(tabs)/search')}
          >
            <Ionicons name="search-outline" size={24} color={colors.text} />
            <Text style={[styles.actionText, { color: colors.text }]}>Search</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginTop: 5,
  },
  card: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  verseRef: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
