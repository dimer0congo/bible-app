import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface HighlightMenuProps {
    visible: boolean;
    onClose: () => void;
    onSelectColor: (color: string) => void;
    onRemoveHighlight: () => void;
    onNote: () => void;
    onBookmark: () => void;
    onCopy: () => void;
    onShare: () => void;
    isBookmarked: boolean;
    book: string;
    chapter: number;
    selectedVerses: number[];
}

export default function HighlightMenu({
    visible,
    onClose,
    onSelectColor,
    onRemoveHighlight,
    onNote,
    onBookmark,
    isBookmarked,
    book,
    chapter,
    selectedVerses,
    onCopy,
    onShare
}: HighlightMenuProps) {
    const { colors } = useTheme();
    const colorsList = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3'];

    if (!visible) return null;

    const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
    const startVerse = sortedVerses[0];
    const endVerse = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;

    const verseReference = endVerse && endVerse !== startVerse
        ? `${book} ${chapter}:${startVerse}-${endVerse}`
        : `${book} ${chapter}:${startVerse}`;


    return (
        <View style={[styles.highlightMenu, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRowContainer}>
                <View style={styles.closeButtonContainer}>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle" size={24} color={colors.icon} />
                    </TouchableOpacity>
                </View>
                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={onNote}>
                        <Ionicons name="create-outline" size={20} color={colors.text} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Note</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={onBookmark}>
                        <Ionicons
                            name={isBookmarked ? "bookmark" : "bookmark-outline"}
                            size={20}
                            color={isBookmarked ? colors.tint : colors.text}
                        />
                        <Text style={[styles.actionButtonText, { color: isBookmarked ? colors.tint : colors.text }]}>
                            {isBookmarked ? 'Saved' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                        <Ionicons name="share-outline" size={20} color={colors.text} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={onCopy}>
                        <Ionicons name="copy-outline" size={20} color={colors.text} />
                        <Text style={[styles.actionButtonText, { color: colors.text }]}>Copy</Text>
                    </TouchableOpacity>

                </View>

            </View>

            <View style={styles.headerRow}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>
                    {verseReference}
                </Text>
            </View>

            <View style={styles.colorRow}>
                {colorsList.map((color, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[styles.colorCircle, { backgroundColor: color }]}
                        onPress={() => onSelectColor(color)}
                    />
                ))}
                <TouchableOpacity
                    style={[
                        styles.colorCircle,
                        { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }
                    ]}
                    onPress={onRemoveHighlight}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    highlightMenu: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderBottomWidth: 0,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    actionButtonsRowContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    closeButtonContainer: {
        position: "absolute",
        top: -38,
        right: '1%',
        alignItems: 'center',
        gap: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    actionButton: {
        alignItems: 'center',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: "center",
        width: '100%',
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    colorRow: {
        flexDirection: 'row',
        gap: 24,
    },
    colorCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
