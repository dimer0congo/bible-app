import HighlightMenu from '@/components/HighlightMenu';
import NoteEditor from '@/components/NoteEditor';
import NoteViewer from '@/components/NoteViewer';
import StudyMenu from '@/components/StudyMenu';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BibleText from '../../components/BibleText';
import BookChapterSelector from '../../components/BookChapterSelector';
import { BOOK_CHAPTER_COUNTS, getLocalizedBookName } from '../../constants/BibleData';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { addBookmark, addHighlight, Bookmark, deleteNote, getBookmarksForChapter, getHighlights, getNote, getNotesForChapter, getVerses, Note, removeBookmark, removeHighlight, saveNote } from '../../services/DatabaseService';

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
    const [readingHistory, setReadingHistory] = useState<{ book: string, chapter: number, timestamp: number }[]>([]);

    // Highlight & Bookmark State
    const [highlights, setHighlights] = useState<{ [verse: number]: string }>({});
    const [bookmarks, setBookmarks] = useState<{ [verse: number]: Bookmark }>({});
    const [notes, setNotes] = useState<{ [verse: number]: Note }>({});
    const [selectedVerses, setSelectedVerses] = useState<number[]>([]);

    // Note State
    const [noteVisible, setNoteVisible] = useState(false);
    const [noteViewerVisible, setNoteViewerVisible] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [currentNoteDate, setCurrentNoteDate] = useState<string | undefined>();
    const [activeNoteVerses, setActiveNoteVerses] = useState<number[]>([]);

    // Study Menu State
    const [studyMenuVisible, setStudyMenuVisible] = useState(false);

    // Scroll & Flash State
    const scrollViewRef = useRef<ScrollView>(null);
    const versePositions = useRef<{ [verse: number]: number }>({});
    const [flashVerse, setFlashVerse] = useState<number | null>(null);
    const [pendingScrollVerse, setPendingScrollVerse] = useState<number | null>(null);

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
            setCurrentNoteDate(note?.created_at);
            setActiveNoteVerses(sortedVerses);
            setNoteVisible(true);
        } catch (e) {
            console.error("Failed to load note", e);
        }
    };

    const handleSaveNote = async (content: string) => {
        if (activeNoteVerses.length === 0) return;
        const sortedVerses = [...activeNoteVerses].sort((a, b) => a - b);
        const vNum = sortedVerses[0];
        const vEnd = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;

        try {
            await saveNote(book, chapter, vNum, content, vEnd);
            setNoteVisible(false);
            setActiveNoteVerses([]);
            handleClearSelection(); // Clear selection if any after saving
            loadNotes(); // Refresh notes to show indicator
        } catch (e) {
            console.error("Failed to save note", e);
        }
    };

    const handleDeleteNote = async () => {
        if (activeNoteVerses.length === 0) return;
        const sortedVerses = [...activeNoteVerses].sort((a, b) => a - b);
        const vNum = sortedVerses[0];
        const vEnd = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;

        try {
            await deleteNote(book, chapter, vNum, vEnd);
            setNoteVisible(false);
            setNoteViewerVisible(false);
            setActiveNoteVerses([]);
            loadNotes(); // Refresh notes to remove indicator
        } catch (e) {
            console.error("Failed to delete note", e);
        }
    };

    const handleNavigateToVerse = (tBook: string, tChapter: number, tVerse: number) => {
        if (tBook === book && tChapter === chapter) {
            // Same chapter, just scroll
            scrollToVerse(tVerse);
        } else {
            // New chapter, set pending
            setBook(tBook);
            setChapter(tChapter);
            setPendingScrollVerse(tVerse);
        }
    };

    const scrollToVerse = (vNum: number) => {
        const y = versePositions.current[vNum];
        if (y !== undefined) {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
            setFlashVerse(vNum);
            setTimeout(() => setFlashVerse(null), 1000);
        }
    };

    const handleVerseLayout = (verse: number, y: number) => {
        versePositions.current[verse] = y;
    };

    const handleEditNoteFromMenu = (note: Note) => {
        // 0. Close the menu first
        setStudyMenuVisible(false);

        // 1. Navigate to location
        setBook(note.book);
        setChapter(note.chapter);

        // 2. Prepare verse context
        const versesToSelect = [note.verse];
        if (note.verse_end) {
            for (let i = note.verse + 1; i <= note.verse_end; i++) {
                versesToSelect.push(i);
            }
        }
        setActiveNoteVerses(versesToSelect);

        // 3. Open Editor
        setCurrentNote(note.content);
        setCurrentNoteDate(note.created_at);
        setNoteVisible(true);
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
        loadBookmarks();
        loadNotes();
        // Clear positions when chapter changes
        versePositions.current = {};
    }, [book, chapter, bibleVersion]);

    useEffect(() => {
        addToHistory(book, chapter, selectedVerses[0] || 1);
    }, [book, chapter, selectedVerses[0]]);

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

    const loadBookmarks = async () => {
        try {
            const data = await getBookmarksForChapter(book, chapter);
            const map: { [verse: number]: Bookmark } = {};
            data.forEach(b => map[b.verse] = b);
            setBookmarks(map);
        } catch (e) {
            console.error("Failed to load bookmarks", e);
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
        setCurrentNoteDate(note.created_at);
        const versesList: number[] = [];
        versesList.push(note.verse);
        if (note.verse_end) {
            for (let i = note.verse + 1; i <= note.verse_end; i++) {
                versesList.push(i);
            }
        }
        setActiveNoteVerses(versesList);
        setNoteViewerVisible(true);
    };

    const handleEditFromViewer = () => {
        setNoteViewerVisible(false);
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

    const handleBookmarkToggle = async () => {
        if (selectedVerses.length === 0) return;
        const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
        const vNum = sortedVerses[0];
        const vEnd = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;

        try {
            const existing = bookmarks[vNum];
            if (existing) {
                await removeBookmark(book, chapter, vNum, vEnd);
            } else {
                await addBookmark(book, chapter, vNum, vEnd);
            }
            loadBookmarks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCopyVerses = async () => {
        if (selectedVerses.length === 0) return;
        const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
        const selected = verses.filter(v => sortedVerses.includes(v.verse)).sort((a, b) => a.verse - b.verse);

        const vNum = sortedVerses[0];
        const vEnd = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;
        const reference = vEnd ? `${book} ${chapter}:${vNum}-${vEnd}` : `${book} ${chapter}:${vNum}`;

        const textToCopy = `${reference} (${bibleVersion})\n` + selected.map(v => `${v.verse} ${v.text}`).join('\n');

        try {
            await Clipboard.setStringAsync(textToCopy);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleClearSelection();
        } catch (e) {
            console.error("Failed to copy text", e);
        }
    };

    const handleShareVerses = async () => {
        if (selectedVerses.length === 0) return;
        const sortedVerses = [...selectedVerses].sort((a, b) => a - b);
        const selected = verses.filter(v => sortedVerses.includes(v.verse)).sort((a, b) => a.verse - b.verse);

        const vNum = sortedVerses[0];
        const vEnd = sortedVerses.length > 1 ? sortedVerses[sortedVerses.length - 1] : undefined;
        const reference = vEnd ? `${book} ${chapter}:${vNum}-${vEnd}` : `${book} ${chapter}:${vNum}`;

        const textToShare = `📖 ${reference} (${bibleVersion})\n\n` +
            selected.map(v => `• ${v.text}`).join('\n\n') +
            `\n\nShared from Bible App 📖`;

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await Share.share({
                message: textToShare,
                title: reference,
            });
            handleClearSelection();
        } catch (e) {
            console.error("Failed to share verses", e);
        }
    };

    const handleDeleteBookmark = async (bookmark: Bookmark) => {
        try {
            await removeBookmark(bookmark.book, bookmark.chapter, bookmark.verse, bookmark.verse_end || undefined);
            if (bookmark.book === book && bookmark.chapter === chapter) {
                loadBookmarks(); // Refresh indicators if in same chapter
            }
        } catch (e) {
            console.error("Failed to delete bookmark", e);
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

    const addToHistory = async (currentBook: string, currentChapter: number, currentVerse: number = 1) => {
        const newItem = { book: currentBook, chapter: currentChapter, verse: currentVerse, timestamp: Date.now() };
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

            // If we have a pending scroll, wait a bit for layout then scroll
            if (pendingScrollVerse) {
                setTimeout(() => {
                    scrollToVerse(pendingScrollVerse);
                    setPendingScrollVerse(null);
                }, 300); // Small delay to ensure layout is captured
            }
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
                    <TouchableOpacity onPress={() => setFontSize(Math.max(18, fontSize - 2))} style={styles.iconButton}>
                        <Text style={{ fontSize: 14, color: colors.text, fontWeight: 'bold' }}>A</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFontSize(Math.min(36, fontSize + 2))} style={styles.iconButton}>
                        <Text style={{ fontSize: 20, color: colors.text, fontWeight: 'bold' }}>A</Text>
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
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {verses.length > 0 ? (
                        <BibleText
                            verses={verses}
                            fontSize={fontSize}
                            highlights={highlights}
                            notes={notes}
                            selectedVerses={selectedVerses}
                            flashVerse={flashVerse}
                            bookmarks={bookmarks}
                            onVersePress={handleVersePress}
                            onNotePress={handleOpenNote}
                            onVerseLayout={handleVerseLayout}
                        />
                    ) : (
                        <View style={styles.center}>
                            <Text style={{ color: colors.icon }}>No verses found.</Text>
                        </View>
                    )}
                </ScrollView>
            )}



            {/* Highlight Menu (Non-Modal) */}
            <HighlightMenu
                visible={highlightMenuVisible}
                onClose={handleClearSelection}
                onSelectColor={handleAddHighlight}
                onRemoveHighlight={handleRemoveHighlight}
                onNote={handleNotePress}
                onBookmark={handleBookmarkToggle}
                onCopy={handleCopyVerses}
                onShare={handleShareVerses}
                isBookmarked={selectedVerses.length > 0 && !!bookmarks[Math.min(...selectedVerses)]}
                book={book}
                chapter={chapter}
                selectedVerses={selectedVerses}
            />

            <NoteEditor
                visible={noteVisible}
                onClose={() => {
                    setNoteVisible(false);
                    setActiveNoteVerses([]);
                }}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
                initialContent={currentNote}
                book={book}
                chapter={chapter}
                verse={activeNoteVerses.length > 0 ? Math.min(...activeNoteVerses) : 0}
                verseEnd={activeNoteVerses.length > 1 ? Math.max(...activeNoteVerses) : undefined}
                verseText={activeNoteVerses.length > 0
                    ? verses.filter(v => activeNoteVerses.includes(v.verse)).sort((a, b) => a.verse - b.verse)
                    : undefined
                }
            />

            <NoteViewer
                visible={noteViewerVisible}
                onClose={() => {
                    setNoteViewerVisible(false);
                    setActiveNoteVerses([]);
                }}
                onEdit={handleEditFromViewer}
                onDelete={handleDeleteNote}
                content={currentNote}
                book={book}
                chapter={chapter}
                verse={activeNoteVerses.length > 0 ? Math.min(...activeNoteVerses) : 0}
                verseEnd={activeNoteVerses.length > 1 ? Math.max(...activeNoteVerses) : undefined}
                verseText={activeNoteVerses.length > 0
                    ? verses.filter(v => activeNoteVerses.includes(v.verse)).sort((a, b) => a.verse - b.verse)
                    : undefined
                }
                createdAt={currentNoteDate}
            />

            <StudyMenu
                visible={studyMenuVisible}
                onClose={() => setStudyMenuVisible(false)}
                onNavigateToVerse={handleNavigateToVerse}
                onEditNote={handleEditNoteFromMenu}
                onDeleteBookmark={handleDeleteBookmark}
                history={readingHistory}
                bibleVersion={bibleVersion}
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
