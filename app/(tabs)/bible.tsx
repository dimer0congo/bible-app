import HighlightMenu from '@/components/HighlightMenu';
import NoteEditor from '@/components/NoteEditor';
import StudyMenu from '@/components/StudyMenu';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BibleText from '../../components/BibleText';
import BookChapterSelector from '../../components/BookChapterSelector';
import { BOOK_CHAPTER_COUNTS, getLocalizedBookName } from '../../constants/BibleData';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { addHighlight, deleteNote, getHighlights, getNote, getNotesForChapter, getVerses, Note, removeHighlight, saveNote } from '../../services/DatabaseService';

export default function BibleScreen() {
    const { colors } = useTheme();
    const { bibleVersion } = useSettings();
    const params = useLocalSearchParams();
    const router = useRouter();

    // Navigation State
    const [book, setBook] = useState('Genesis');
    const [chapter, setChapter] = useState(1);

    // Data State
    const [verses, setVerses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectorVisible, setSelectorVisible] = useState(false);
    const [fontSize, setFontSize] = useState(20);

    // History State
    const [historyVisible, setHistoryVisible] = useState(false);
    const [readingHistory, setReadingHistory] = useState<{ book: string, chapter: number, timestamp: number }[]>([]);

    // Highlight State
    const [highlights, setHighlights] = useState<{ [verse: number]: string }>({});
    const [notes, setNotes] = useState<{ [verse: number]: Note }>({});
    const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

    // Note State
    const [noteVisible, setNoteVisible] = useState(false);
    const [currentNote, setCurrentNote] = useState('');

    // Study Menu State
    const [studyMenuVisible, setStudyMenuVisible] = useState(false);

    // Derived state
    // ...

    // Functions
    const handleNotePress = async () => {
        if (selectedVerses.length === 0) return;
        const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
        const vNum = sortedVerses[0];
        const vEnd = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;

        try {
            const note = await getNote(book, chapter, vNum, vEnd);
            setCurrentNote(note ? note.content : '');
            setNoteVisible(true);
        } catch (e) {
            console.error("Failed to load note", e);
        }
    };

    const handleSaveNote = async (content: string) => {
        if (selectedVerses.length === 0) return;
        const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
        const vNum = sortedVerses[0];
        const vEnd = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;

        try {
            await saveNote(book, chapter, vNum, content, vEnd);
            setNoteVisible(false);
            loadNotes(); // Refresh notes to show indicator
        } catch (e) {
            console.error("Failed to save note", e);
        }
    };

    const handleDeleteNote = async () => {
        if (selectedVerses.length === 0) return;
        const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
        const vNum = sortedVerses[0];
        const vEnd = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;

        try {
            await deleteNote(book, chapter, vNum, vEnd);
            setNoteVisible(false);
            loadNotes(); // Refresh notes to remove indicator
        } catch (e) {
            console.error("Failed to delete note", e);
        }
    };

    const handleNavigateToVerse = (tBook: string, tChapter: number, tVerse: number) => {
        setBook(tBook);
        setChapter(tChapter);
        // Optional: Scroll to verse (requires ref on BibleText which we might not have yet, 
        // but setting book/chapter is the main part)
    };

    // Derived state
    const highlightMenuVisible = selectedVerses.length > 0;

    // Effects
    useEffect(() => {
        if (params.book && params.chapter) {
            setBook(params.book as string);
            setChapter(parseInt(params.chapter as string, 10));
        }
    }, [params.book, params.chapter]);

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        loadVerses();
        loadHighlights();
        loadNotes();
    }, [book, chapter, bibleVersion]);

    useEffect(() => {
        addToHistory(book, chapter);
    }, [book, chapter]);

    // Functions
    const loadHighlights = async () => {
        try {
            const data = await getHighlights(book, chapter);
            const map: { [verse: number]: string } = {};
            data.forEach(h => map[h.verse] = h.color);
            setHighlights(map);
        } catch (e) {
            console.error("Failed to load highlights", e);
        }
    };

    const loadNotes = async () => {
        try {
            const data = await getNotesForChapter(book, chapter);
            const map: { [verse: number]: Note } = {};
            data.forEach(n => {
                map[n.verse] = n;
                // If it's a range, mark all verses in the range with the SAME note object
                if (n.verse_end) {
                    for (let i = n.verse + 1; i <= n.verse_end; i++) {
                        map[i] = n;
                    }
                }
            });
            setNotes(map);
        } catch (e) {
            console.error("Failed to load notes", e);
        }
    };

    const handleOpenNote = (note: Note) => {
        setCurrentNote(note.content);
        // We need to set the context so save/delete works correctly
        // We can infer the selection from the note
        const verses: number[] = [];
        verses.push(note.verse);
        if (note.verse_end) {
            for (let i = note.verse + 1; i <= note.verse_end; i++) {
                verses.push(i);
            }
        }
        setSelectedVerses(verses);
        setNoteVisible(true);
    };

    const handleVersePress = (verse: any) => {
        setSelectedVerses(prev => {
            if (prev.includes(verse.verse)) {
                return prev.filter(v => v !== verse.verse);
            } else {
                return [...prev, verse.verse];
            }
        });
    };

    const handleClearSelection = () => {
        setSelectedVerses([]);
    };

    const handleAddHighlight = async (color: string) => {
        if (selectedVerses.length === 0) return;
        try {
            // Apply to all selected verses
            await Promise.all(selectedVerses.map(vNum =>
                addHighlight(book, chapter, vNum, color)
            ));

            // Update local state
            setHighlights(prev => {
                const next = { ...prev };
                selectedVerses.forEach(vNum => {
                    next[vNum] = color;
                });
                return next;
            });
            handleClearSelection();
        } catch (e) {
            console.error(e);
        }
    };

    const handleRemoveHighlight = async () => {
        if (selectedVerses.length === 0) return;
        try {
            // Remove from all selected verses
            await Promise.all(selectedVerses.map(vNum =>
                removeHighlight(book, chapter, vNum)
            ));

            setHighlights(prev => {
                const next = { ...prev };
                selectedVerses.forEach(vNum => {
                    delete next[vNum];
                });
                return next;
            });
            handleClearSelection();
        } catch (e) {
            console.error(e);
        }
    };

    // Functions
    const loadHistory = async () => {
        try {
            const saved = await AsyncStorage.getItem('reading_history');
            if (saved) setReadingHistory(JSON.parse(saved));
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    const addToHistory = async (currentBook: string, currentChapter: number) => {
        const newItem = { book: currentBook, chapter: currentChapter, timestamp: Date.now() };
        setReadingHistory(prev => {
            const filtered = prev.filter(i => !(i.book === currentBook && i.chapter === currentChapter));
            const updated = [newItem, ...filtered].slice(0, 20);
            AsyncStorage.setItem('reading_history', JSON.stringify(updated)).catch(console.error);
            return updated;
        });
    };

    const loadVerses = async () => {
        setLoading(true);
        try {
            const data = await getVerses(book, chapter, bibleVersion);
            setVerses(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleNextChapter = () => {
        const maxChapters = BOOK_CHAPTER_COUNTS[book] || 50;
        if (chapter < maxChapters) {
            const newChapter = chapter + 1;
            setChapter(newChapter);
            router.setParams({ book, chapter: newChapter.toString() });
        }
    };

    const handlePrevChapter = () => {
        if (chapter > 1) {
            const newChapter = chapter - 1;
            setChapter(newChapter);
            router.setParams({ book, chapter: newChapter.toString() });
        }
    };

    const handleSelection = (newBook: string, newChapter: number) => {
        setBook(newBook);
        setChapter(newChapter);
        router.setParams({ book: newBook, chapter: newChapter.toString() });
        setSelectorVisible(false);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.navGroup}>
                    <TouchableOpacity onPress={handlePrevChapter} style={styles.iconButton}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.selectorButton, { backgroundColor: colors.card }]}
                        onPress={() => setSelectorVisible(true)}
                    >
                        <Text style={[styles.selectorText, { color: colors.text }]}>
                            {getLocalizedBookName(book, bibleVersion)} {chapter}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={colors.tint} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNextChapter} style={styles.iconButton}>
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.settingsGroup}>
                    <TouchableOpacity onPress={() => setFontSize(Math.max(14, fontSize - 2))} style={styles.iconButton}>
                        <Text style={{ fontSize: 14, color: colors.text, fontWeight: 'bold' }}>A</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFontSize(Math.min(32, fontSize + 2))} style={styles.iconButton}>
                        <Text style={{ fontSize: 20, color: colors.text, fontWeight: 'bold' }}>A</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setHistoryVisible(true)} style={styles.iconButton}>
                        <Ionicons name="time-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStudyMenuVisible(true)} style={styles.iconButton}>
                        <Ionicons name="book-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                    {verses.length > 0 ? (
                        <BibleText
                            verses={verses}
                            fontSize={fontSize}
                            highlights={highlights}
                            notes={notes}
                            selectedVerses={selectedVerses}
                            onVersePress={handleVersePress}
                            onNotePress={handleOpenNote}
                        />
                    ) : (
                        <View style={styles.center}>
                            <Text style={{ color: colors.icon }}>No verses found.</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* History Modal */}
            <Modal
                visible={historyVisible}
                animationType="slide"
                style={{ backgroundColor: colors.highlight }}
                presentationStyle="pageSheet"
                onRequestClose={() => setHistoryVisible(false)}
            >
                <View style={[styles.historyContainer, { backgroundColor: colors.background }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.historyTitle, { color: colors.text }]}>Reading History</Text>
                        <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {readingHistory.length === 0 ? (
                        <View style={styles.center}>
                            <Text style={{ color: colors.icon }}>No reading history yet.</Text>
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.historyList}>
                            {readingHistory.map((item, index) => (
                                <TouchableOpacity
                                    key={`${item.book}-${item.chapter}-${item.timestamp}`}
                                    style={[styles.historyItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setBook(item.book);
                                        setChapter(item.chapter);
                                        router.setParams({ book: item.book, chapter: item.chapter.toString() });
                                        setHistoryVisible(false);
                                    }}
                                >
                                    <View>
                                        <Text style={[styles.historyReference, { color: colors.text }]}>
                                            {item.book} {item.chapter}
                                        </Text>
                                        <Text style={[styles.historyTime, { color: colors.icon }]}>
                                            {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={colors.icon} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </Modal>

            {/* Highlight Menu (Non-Modal) */}
            <HighlightMenu
                visible={highlightMenuVisible}
                onClose={handleClearSelection}
                onSelectColor={handleAddHighlight}
                onRemoveHighlight={handleRemoveHighlight}
                onNote={handleNotePress}
                verseNumber={selectedVerses[0]}
                count={selectedVerses.length}
            />

            <NoteEditor
                visible={noteVisible}
                onClose={() => setNoteVisible(false)}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
                initialContent={currentNote}
                book={book}
                chapter={chapter}
                verse={selectedVerses.length > 0 ? Math.min(...selectedVerses) : 0}
                verseEnd={selectedVerses.length > 1 ? Math.max(...selectedVerses) : undefined}
            />

            <StudyMenu
                visible={studyMenuVisible}
                onClose={() => setStudyMenuVisible(false)}
                onNavigateToVerse={handleNavigateToVerse}
            />

            <BookChapterSelector
                visible={selectorVisible}
                onClose={() => setSelectorVisible(false)}
                onSelect={handleSelection}
                currentBook={book}
                currentChapter={chapter}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    studyMenuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    bookSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    menuButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookSelectorText: {
        flexDirection: 'row', alignItems: 'center', gap: 8
    },
    settingsGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    selectorText: { fontSize: 16, fontWeight: 'bold' },
    iconButton: { padding: 8 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    historyContainer: { flex: 1 },
    historyTitle: { fontSize: 20, fontWeight: 'bold' },
    historyList: { padding: 16 },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    historyReference: { fontSize: 16, fontWeight: '500' },
    historyTime: { fontSize: 12, marginTop: 2 },
});
