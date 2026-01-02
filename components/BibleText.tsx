import { renderFormattedText } from '@/utils/text_formating';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { Bookmark, Note } from '../services/DatabaseService';

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
    bookmarks?: { [verse: number]: Bookmark }; // Map verse number to Bookmark object
    selectedVerses?: number[];
    flashVerse?: number | null;
    onVerseLayout?: (verse: number, y: number) => void;
}

export default function BibleText({
    verses,
    onVersePress,
    onNotePress,
    fontSize = 20,
    highlights = {},
    notes = {},
    selectedVerses = [],
    flashVerse,
    bookmarks = {},
    onVerseLayout
}: BibleTextProps) {
    const { colors } = useTheme();



    return (
        <View style={styles.container}>
            {verses.map((v) => {
                const highlightColor = highlights[v.verse];
                const note = notes[v.verse];
                const isSelected = selectedVerses.includes(v.verse);
                const isNoteStart = note && note.verse === v.verse;
                const bookmark = bookmarks[v.verse];
                const isBookmarkStart = bookmark && bookmark.verse === v.verse;
                const isFlashed = v.verse === flashVerse;

                // Reanimated effect for flash
                const progress = useDerivedValue(() => {
                    return isFlashed ? withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 700 })) : 0;
                }, [isFlashed]);

                const animatedStyle = useAnimatedStyle(() => {
                    return {
                        backgroundColor: interpolateColor(
                            progress.value,
                            [0, 1],
                            ['transparent', colors.tint + '40'] // 40 is hex for ~25% opacity
                        ),
                    };
                });

                return (
                    <TouchableOpacity
                        key={v.id}
                        onLayout={(e) => onVerseLayout && onVerseLayout(v.verse, e.nativeEvent.layout.y)}
                        style={[
                            styles.verseContainer,
                            highlightColor ? { backgroundColor: highlightColor, borderRadius: 4, paddingHorizontal: 4 } : undefined,
                            { flexDirection: 'column' }
                        ]}
                        onPress={() => onVersePress && onVersePress(v)}
                        activeOpacity={0.7}
                    >
                        <Animated.View style={[styles.flashOverlay, animatedStyle]} pointerEvents="none" />
                        <Text
                            style={[
                                styles.text,
                                {
                                    color: colors.text,
                                    fontSize,
                                    lineHeight: fontSize * 1.5,
                                    // fontFamily: 'Georgia',
                                },
                                isSelected ? {
                                    textDecorationLine: 'underline',
                                    textDecorationStyle: 'dotted',
                                    textDecorationColor: colors.tint
                                } : undefined
                            ]}
                        >
                            <Text style={[styles.verseNumber, { color: colors.tint, fontSize: fontSize * 0.6 }]}>
                                {v.verse}{' '}
                            </Text>
                            {renderFormattedText(v.text)}
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

                        {isBookmarkStart && (
                            <TouchableOpacity style={[styles.bookmarkIndicator, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '30' }]}>
                                <Ionicons name="bookmark" size={16} color={colors.tint} />
                                <Text style={[styles.bookmarkText, { color: colors.tint }]}>
                                    {bookmark.verse}{bookmark.verse_end ? `-${bookmark.verse_end}` : ''}
                                </Text>
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
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: -1,
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
        alignSelf: 'flex-end',
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
    },
    bookmarkIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 4,
    },
    bookmarkText: {
        fontSize: 11,
        fontWeight: 'bold',
    }
});
