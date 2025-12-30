import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BIBLE_BOOKS_EN, BIBLE_BOOKS_FR, BOOK_CHAPTER_COUNTS } from '../constants/BibleData';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';

interface SelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (book: string, chapter: number) => void;
    currentBook: string;
    currentChapter: number;
}

type Mode = 'BOOK' | 'CHAPTER';

export default function BookChapterSelector({ visible, onClose, onSelect, currentBook, currentChapter }: SelectorProps) {
    const { colors, theme } = useTheme();
    const { bibleVersion } = useSettings();

    // State
    const [mode, setMode] = useState<Mode>('BOOK');
    const [selectedBook, setSelectedBook] = useState(currentBook);

    // Always use English keys for internal logic/DB to ensure compatibility
    const books = BIBLE_BOOKS_EN;

    useEffect(() => {
        if (visible) {
            setSelectedBook(currentBook);
            setMode('BOOK');
        }
    }, [visible, currentBook]);

    const handleBookSelect = (book: string) => {
        setSelectedBook(book);
        setMode('CHAPTER');
    };

    const handleChapterSelect = (chapter: number) => {
        onSelect(selectedBook, chapter);
        setMode('BOOK'); // Reset for next time
    };

    const renderBookItem = ({ item }: { item: string }) => {
        // Display name based on current language
        // Map English key (item) to French name if needed
        const displayName = bibleVersion === 'FR_APEE'
            ? BIBLE_BOOKS_FR[BIBLE_BOOKS_EN.indexOf(item)]
            : item;

        return (
            <TouchableOpacity
                style={[styles.item, { borderBottomColor: colors.border }]}
                onPress={() => handleBookSelect(item)}
            >
                <Text style={[
                    styles.itemText,
                    { color: colors.text },
                    selectedBook === item && { color: colors.tint, fontWeight: 'bold' }
                ]}>
                    {displayName}
                </Text>
                {selectedBook === item && <Ionicons name="checkmark" size={20} color={colors.tint} />}
            </TouchableOpacity>
        );
    };

    const renderChapterItem = ({ item }: { item: number }) => (
        <TouchableOpacity
            style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleChapterSelect(item)}
        >
            <Text style={[
                styles.gridItemText,
                { color: colors.text },
                selectedBook === currentBook && currentChapter === item && { color: colors.tint, fontWeight: 'bold' }
            ]}>
                {item}
            </Text>
        </TouchableOpacity>
    );

    const chapters = Array.from({ length: BOOK_CHAPTER_COUNTS[selectedBook] || 50 }, (_, i) => i + 1);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => mode === 'CHAPTER' ? setMode('BOOK') : onClose()}>
                        <Ionicons name={mode === 'CHAPTER' ? "arrow-back" : "close"} size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {mode === 'BOOK' ? 'Select Book' : `Select Chapter (${
                            // Also localize title if needed
                            bibleVersion === 'FR_APEE'
                                ? BIBLE_BOOKS_FR[BIBLE_BOOKS_EN.indexOf(selectedBook)]
                                : selectedBook
                            })`}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Content */}
                {mode === 'BOOK' ? (
                    <FlatList
                        key="book-list"
                        data={books}
                        keyExtractor={(item) => item}
                        renderItem={renderBookItem}
                        contentContainerStyle={styles.listContent}
                    />
                ) : (
                    <FlatList
                        key="chapter-grid"
                        data={chapters}
                        keyExtractor={(item) => item.toString()}
                        renderItem={renderChapterItem}
                        numColumns={5} // Grid layout
                        contentContainerStyle={styles.gridContent}
                        columnWrapperStyle={styles.rowWrapper}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 16,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    itemText: {
        fontSize: 18,
    },
    gridContent: {
        padding: 16,
    },
    rowWrapper: {
        gap: 10,
        marginBottom: 10,
    },
    gridItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    gridItemText: {
        fontSize: 16,
    },
});
