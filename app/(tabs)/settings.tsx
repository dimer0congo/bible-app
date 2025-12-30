import React from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { forceResetDatabase } from '../../services/DatabaseService';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '../../context/SettingsContext';

export default function SettingsScreen() {
    const { colors, theme, toggleTheme } = useTheme();
    const { bibleVersion, setBibleVersion } = useSettings();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>

            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>Appearance</Text>

                    <View style={styles.row}>
                        <Text style={[styles.label, { color: colors.text }]}>Dark Mode</Text>
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: colors.tint }}
                        />
                    </View>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>Language (Bible Version)</Text>

                    <View style={styles.optionRow}>
                        <Text style={[styles.label, { color: colors.text }]}>English (KJV)</Text>
                        <Switch
                            value={bibleVersion === 'KJV'}
                            onValueChange={(val) => { if (val) setBibleVersion('KJV'); }}
                            disabled={bibleVersion === 'KJV'}
                        />
                    </View>
                    <View style={styles.optionRow}>
                        <Text style={[styles.label, { color: colors.text }]}>Français (APEE)</Text>
                        <Switch
                            value={bibleVersion === 'FR_APEE'}
                            onValueChange={(val) => { if (val) setBibleVersion('FR_APEE'); }}
                            disabled={bibleVersion === 'FR_APEE'}
                        />
                    </View>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>About</Text>
                    <Text style={[styles.text, { color: colors.text }]}>Bible App v1.0.0</Text>
                </View>

                <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.tint }]}>Troubleshooting</Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.tint }]}
                        onPress={() => {
                            Alert.alert(
                                "Repair Database",
                                "This will delete and reload all Bible data. Use this if you are missing verses. The app will need to be restarted.",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Repair",
                                        style: "destructive",
                                        onPress: async () => {
                                            await forceResetDatabase();
                                            Alert.alert("Success", "Database repaired. Please restart the app.");
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <Text style={styles.buttonText}>Repair Database</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
    },
    text: {
        fontSize: 16,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
