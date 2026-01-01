import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Note } from '../services/DatabaseService';

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
    onNotePress?: (note: Note) => void;
    fontSize?: number;
    highlights?: { [verse: number]: string }; // Map verse number to color
    notes?: { [verse: number]: Note }; // Map verse number to Note object
    selectedVerses?: number[];
}

export default function BibleText({ verses, onVersePress, onNotePress, fontSize = 20, highlights = {}, notes = {}, selectedVerses = [] }: BibleTextProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {verses.map((v) => {
                const highlightColor = highlights[v.verse];
                const note = notes[v.verse];
                const isSelected = selectedVerses.includes(v.verse);

                // Only show indicator on the FIRST verse of a note to avoid clutter, 
                // OR show on all if that's preferred. The map has the note on all its verses.
                // Let's show it on the first verse ONLY, or maybe a small line on others.
                // Actually, for simplicity/access, showing on all is fine, but duplicate buttons might be noisy.
                // Let's check if this is the start verse of the note.
                const isNoteStart = note && note.verse === v.verse;
                // If it's part of a range but NOT the start, maybe show a smaller indicator? 
                // For now, let's just show the full indicator on the start verse to be "expressive" without spamming.

                return (
                    <TouchableOpacity
                        key={v.id}
                        style={[
                            styles.verseContainer,
                            highlightColor ? { backgroundColor: highlightColor, borderRadius: 4, paddingHorizontal: 4 } : undefined,
                            isSelected ? { backgroundColor: colors.card, borderColor: colors.tint, borderWidth: 1 } : undefined,
                            { flexDirection: 'column' }
                        ]}
                        onPress={() => onVersePress && onVersePress(v)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.text,
                                {
                                    color: colors.text,
                                    fontSize,
                                    lineHeight: fontSize * 1.5,
                                    fontFamily: 'Georgia' // Switched to Georgia for better readability nicely
                                }
                            ]}
                        >
                            <Text style={[styles.verseNumber, { color: colors.tint, fontSize: fontSize * 0.6 }]}>
                                {v.verse}{' '}
                            </Text>
                            {v.text}
                        </Text>

                        {isNoteStart && (
                            <TouchableOpacity
                                style={[styles.noteButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={() => onNotePress && onNotePress(note)}
                            >
                                <Ionicons name="document-text" size={16} color={colors.tint} />
                                <Text style={[styles.noteText, { color: colors.tint }]}>View Note</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    verseContainer: {
        marginBottom: 12,
        paddingVertical: 4,
    },
    text: {
        textAlign: 'left', // Justify can look weird on mobile sometimes
    },
    verseNumber: {
        fontWeight: 'bold',
        verticalAlign: 'top',
        opacity: 0.7,
    },
    noteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 6,
    },
    noteText: {
        fontSize: 14,
        fontWeight: '500',
    }
});
