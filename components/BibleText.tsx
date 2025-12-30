import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface Verse {
    id: number;
    book: string;
    chapter: number;
    verse: number;
    text: string;
}

interface BibleTextProps {
    verses: Verse[];
    onVersePress?: (verse: Verse) => void;
    fontSize?: number;
}

export default function BibleText({ verses, onVersePress, fontSize = 20 }: BibleTextProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {verses.map((v) => (
                <View key={v.id} style={styles.verseContainer}>
                    <Text
                        style={[
                            styles.text,
                            {
                                color: colors.text,
                                fontSize,
                                lineHeight: fontSize * 1.6, // Dynamic line height
                                fontFamily: 'Times New Roman' // Or platform specific serif
                            }
                        ]}
                    >
                        <Text style={[styles.verseNumber, { color: colors.tint, fontSize: fontSize * 0.6 }]}>
                            {v.verse}{' '}
                        </Text>
                        {v.text}
                    </Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    verseContainer: {
        marginBottom: 8,
    },
    text: {
        textAlign: 'justify',
    },
    verseNumber: {
        fontWeight: 'bold',
        verticalAlign: 'top',
        opacity: 0.7,
    },
});
