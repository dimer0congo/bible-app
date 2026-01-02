import { formatTimestamp } from '@/utils/date_formating';
import { renderFormattedText } from '@/utils/text_formating';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Bookmark, getAllBookmarks, getAllHighlights, getAllNotes, Highlight, Note } from '../services/DatabaseService';

interface StudyMenuProps {
    visible: boolean;
    onClose: () => void;
    onNavigateToVerse: (book: string, chapter: number, verse: number) => void;
    onEditNote: (note: Note) => void;
    onDeleteBookmark?: (bookmark: Bookmark) => void;
    history: { book: string; chapter: number; verse?: number; timestamp: number }[];
    bibleVersion: string;
}

type Tab = 'Highlights' | 'Notes' | 'Bookmarks' | 'History';

export default function StudyMenu({ visible, onClose, onNavigateToVerse, onEditNote, onDeleteBookmark, history, bibleVersion }: StudyMenuProps) {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState<Tab>('Highlights');
    const [highlights, setHighlights] = useState<(Highlight & { text: string })[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [bookmarks, setBookmarks] = useState<(Bookmark & { text: string })[]>([]);

    useEffect(() => {
        if (visible) {
            loadHighlights();
            loadNotes();
            loadBookmarks();
        }
    }, [visible, bibleVersion]);

    const loadHighlights = async () => {
        try {
            const data = await getAllHighlights(bibleVersion);
            setHighlights(data);
        } catch (e) {
            console.error("Failed to load highlights", e);
        }
    };

    const loadNotes = async () => {
        try {
            const data = await getAllNotes();
            setNotes(data);
        } catch (e) {
            console.error("Failed to load notes", e);
        }
    };

    const loadBookmarks = async () => {
        try {
            const data = await getAllBookmarks(bibleVersion);
            setBookmarks(data);
        } catch (e) {
            console.error("Failed to load bookmarks", e);
        }
    };




    const renderHighlightItem = ({ item }: { item: Highlight & { text: string } }) => (
        <TouchableOpacity
            style={[styles.highlightItem, { borderBottomColor: colors.border }]}
            onPress={() => {
                onNavigateToVerse(item.book, item.chapter, item.verse);
                onClose();
            }}
        >
            <View style={styles.highlightContent}>
                <Text style={[styles.highlightReference, { color: colors.text }]}>
                    {item.book} {item.chapter}:{item.verse}
                </Text>
                <View style={[styles.highlightedText, { backgroundColor: item.color }]}>
                    <Text style={[styles.verseText, { color: '#000' }]}>
                        {renderFormattedText(item.text) || 'No text available'}
                    </Text>
                </View>
                <Text style={[styles.historyTime, { color: colors.text, marginTop: 4, opacity: 0.5, fontSize: 10 }]}>
                    {formatTimestamp(new Date(item.created_at).getTime())}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        </TouchableOpacity>
    );

    const renderNoteItem = ({ item }: { item: Note }) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => {
                onEditNote(item);
                onClose();
            }}
        >
            <View style={styles.noteContent}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {item.book} {item.chapter}:{item.verse}{item.verse_end ? `-${item.verse_end}` : ''}
                </Text>
                <Text style={[styles.notePreview, { color: colors.text }]} numberOfLines={1}>
                    {item.content}
                </Text>
                <Text style={[styles.historyTime, { color: colors.text, marginTop: 4, opacity: 0.5, fontSize: 10 }]}>
                    {formatTimestamp(new Date(item.created_at).getTime())}
                </Text>
            </View>
            <Ionicons name="create-outline" size={20} color={colors.icon} />
        </TouchableOpacity>
    );

    const renderBookmarkItem = ({ item }: { item: Bookmark & { text: string } }) => (
        <View style={[styles.item, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                    onNavigateToVerse(item.book, item.chapter, item.verse);
                    onClose();
                }}
            >
                <View style={[styles.historyContent, { alignItems: 'flex-start' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.itemTitle, { color: colors.text }]}>
                            {item.book} {item.chapter}:{item.verse}{item.verse_end ? `-${item.verse_end}` : ''}
                        </Text>
                        <Text style={[styles.notePreview, { color: colors.text }]} numberOfLines={1}>
                            {renderFormattedText(item.text) || 'No text available'}
                        </Text>
                        <Text style={[styles.historyTime, { color: colors.text, marginTop: 4, opacity: 0.5, fontSize: 10 }]}>
                            {formatTimestamp(new Date(item.created_at).getTime())}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
            <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => {
                    if (onDeleteBookmark) {
                        onDeleteBookmark(item);
                        loadBookmarks(); // Refresh local list after deletion
                    }
                }}
            >
                <Ionicons name="trash-outline" size={20} color={colors.text} style={{ opacity: 0.4 }} />
            </TouchableOpacity>
        </View>
    );

    const renderHistoryItem = ({ item }: { item: { book: string; chapter: number; verse?: number; timestamp: number } }) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => {
                onNavigateToVerse(item.book, item.chapter, item.verse || 1);
                onClose();
            }}
        >
            <View style={styles.historyContent}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>
                    {item.book} {item.chapter}
                </Text>
                <Text style={[styles.historyTime, { color: colors.text }]}>
                    {formatTimestamp(item.timestamp)}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="none"
            presentationStyle="formSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Study Tools</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={28} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                    {(['Highlights', 'Notes', 'Bookmarks', 'History'] as Tab[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tab,
                                activeTab === tab && { borderBottomColor: colors.tint, borderBottomWidth: 2 }
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                { color: activeTab === tab ? colors.tint : colors.text }
                            ]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {activeTab === 'Highlights' && (
                        <FlatList
                            data={highlights}
                            renderItem={renderHighlightItem}
                            keyExtractor={(item) => `${item.book}-${item.chapter}-${item.verse}-${item.id}`}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.text }]}>
                                    No highlights yet.
                                </Text>
                            }
                        />
                    )}
                    {activeTab === 'Notes' && (
                        <FlatList
                            data={notes}
                            renderItem={renderNoteItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.text }]}>
                                    No notes yet.
                                </Text>
                            }
                        />
                    )}
                    {activeTab === 'Bookmarks' && (
                        <FlatList
                            data={bookmarks}
                            renderItem={renderBookmarkItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.text }]}>
                                    No bookmarks yet.
                                </Text>
                            }
                        />
                    )}
                    {activeTab === 'History' && (
                        <FlatList
                            data={history}
                            renderItem={renderHistoryItem}
                            keyExtractor={(item, index) => `${item.book}-${item.chapter}-${index}`}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.text }]}>
                                    No reading history yet.
                                </Text>
                            }
                        />
                    )}
                </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    highlightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
    },
    highlightContent: {
        flex: 1,
        marginRight: 12,
    },
    highlightReference: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    highlightedText: {
        padding: 8,
        borderRadius: 4,
        fontSize: 32,
    },
    verseText: {
        fontSize: 18,
    },
    noteContent: {
        flex: 1,
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    notePreview: {
        fontSize: 14,
        opacity: 0.7,
    },
    historyContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 12,
    },
    historyTime: {
        fontSize: 16,
        opacity: 0.6,
    },
    colorIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 12,
    },
    itemText: {
        flex: 1,
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        opacity: 0.6,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
