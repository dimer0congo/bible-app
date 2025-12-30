import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NT_BOOKS, OT_BOOKS } from '../../constants/BibleData';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { searchVerses } from '../../services/DatabaseService';

export default function SearchScreen() {
    const { colors } = useTheme();
    const { bibleVersion } = useSettings();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Filter State
    const [filterScope, setFilterScope] = useState<'ALL' | 'OT' | 'NT'>('ALL');
    const [filterBook, setFilterBook] = useState<string | null>(null);

    useEffect(() => {
        loadRecentSearches();
    }, []);

    // Reset filters when a new search is performed
    useEffect(() => {
        setFilterScope('ALL');
        setFilterBook(null);
    }, [results]);

    const loadRecentSearches = async () => {
        try {
            const saved = await AsyncStorage.getItem('recent_searches');
            if (saved) setRecentSearches(JSON.parse(saved));
        } catch (e) {
            console.error(e);
        }
    };

    const saveSearchTerm = async (term: string) => {
        if (!term.trim()) return;
        const newHistory = [term, ...recentSearches.filter(t => t !== term)].slice(0, 10);
        setRecentSearches(newHistory);
        await AsyncStorage.setItem('recent_searches', JSON.stringify(newHistory));
    };

    const handleSearch = async () => {
        if (query.trim().length < 3) return;
        Keyboard.dismiss();
        setLoading(true);
        setHasSearched(true);
        saveSearchTerm(query.trim());
        try {
            const data = await searchVerses(query, bibleVersion);
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        setHasSearched(false);
    };

    // Filter Logic
    const filteredResults = results.filter(item => {
        // 1. Scope Filter
        if (filterScope === 'OT' && !OT_BOOKS.includes(item.book)) return false;
        if (filterScope === 'NT' && !NT_BOOKS.includes(item.book)) return false;

        // 2. Book Filter
        if (filterBook && item.book !== filterBook) return false;

        return true;
    });

    // Extract available books from current results (filtered by scope only, ignoring book filter)
    const availableBooks = Array.from(new Set(results.filter(item => {
        if (filterScope === 'OT' && !OT_BOOKS.includes(item.book)) return false;
        if (filterScope === 'NT' && !NT_BOOKS.includes(item.book)) return false;
        return true;
    }).map(r => r.book)));


    const router = useRouter();

    // Helper to highlight search term
    const renderHighlightedText = (text: string, term: string) => {
        if (!term || term.length < 3) return <Text style={[styles.resultText, { color: colors.text }]}>{text}</Text>;

        const parts = text.split(new RegExp(`(${term})`, 'gi'));
        return (
            <Text style={[styles.resultText, { color: colors.text }]}>
                {parts.map((part, index) =>
                    part.toLowerCase() === term.toLowerCase() ? (
                        <Text key={index} style={{ color: colors.tint, fontWeight: 'bold', backgroundColor: colors.card === '#1c1c1e' ? '#3a3a3c' : '#f2f2f7' }}>{part}</Text>
                    ) : (
                        <Text key={index}>{part}</Text>
                    )
                )}
            </Text>
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
                // key: forces a remount/update if already on the tab
                router.push({ pathname: '/(tabs)/bible', params: { book: item.book, chapter: item.chapter } });
            }}
        >
            <View style={styles.resultHeader}>
                <Text style={[styles.resultReference, { color: colors.tint }]}>
                    {item.book} {item.chapter}:{item.verse}
                </Text>
                <Ionicons name="book-outline" size={16} color={colors.icon} />
            </View>
            {renderHighlightedText(item.text, query)}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Search</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.icon} />
                <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Search verses (min 3 chars)..."
                    placeholderTextColor={colors.icon}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    autoCapitalize="none"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={clearSearch}>
                        <Ionicons name="close-circle" size={20} color={colors.icon} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={handleSearch}
                    style={{
                        backgroundColor: colors.tint,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        marginLeft: 4
                    }}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Go</Text>
                </TouchableOpacity>
            </View>

            {/* Filter UI - Only show if we have results */}
            {hasSearched && !loading && (
                <View style={styles.filterContainer}>
                    {/* Top Row: Count & Scope Toggles */}
                    <View style={styles.filterRow}>
                        <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                            Found {filteredResults.length} results
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {(['ALL', 'OT', 'NT'] as const).map(scope => (
                                <TouchableOpacity
                                    key={scope}
                                    onPress={() => { setFilterScope(scope); setFilterBook(null); }}
                                    style={[
                                        styles.filterChip,
                                        { backgroundColor: filterScope === scope ? colors.tint : colors.card, borderWidth: 1, borderColor: colors.border }
                                    ]}
                                >
                                    <Text style={{
                                        color: filterScope === scope ? 'white' : colors.text,
                                        fontSize: 12, fontWeight: 'bold'
                                    }}>
                                        {scope}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Bottom Row: Book Chips (Horizontal Scroll) */}
                    {availableBooks.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={['All Books', ...availableBooks]}
                                keyExtractor={item => item}
                                contentContainerStyle={{ gap: 8 }}
                                renderItem={({ item }) => {
                                    const isSelected = (item === 'All Books' && filterBook === null) || item === filterBook;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => setFilterBook(item === 'All Books' ? null : item)}
                                            style={[
                                                styles.bookChip,
                                                {
                                                    backgroundColor: isSelected ? colors.tint : colors.card,
                                                    borderColor: isSelected ? colors.tint : colors.border
                                                }
                                            ]}
                                        >
                                            <Text style={{ color: isSelected ? 'white' : colors.text, fontSize: 12 }}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    )}
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.tint} />
                    <Text style={[styles.loadingText, { color: colors.icon }]}>Searching Scripture...</Text>
                </View>
            ) : !hasSearched && query.length === 0 ? (
                <View style={styles.recentContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
                    {recentSearches.length > 0 ? (
                        <FlatList
                            data={recentSearches}
                            keyExtractor={(item) => item}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.recentItem, { borderBottomColor: colors.border }]}
                                    onPress={() => {
                                        setQuery(item);
                                        // Need to trigger search properly, setting state isn't instant
                                        // But for simple consistency we can just populate the box
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <Ionicons name="time-outline" size={20} color={colors.icon} />
                                        <Text style={{ color: colors.text, fontSize: 16 }}>{item}</Text>
                                    </View>
                                    <Ionicons name="arrow-up-circle-outline" size={20} color={colors.icon} />
                                </TouchableOpacity>
                            )}
                        />
                    ) : (
                        <Text style={{ color: colors.icon, marginTop: 10 }}>No recent searches.</Text>
                    )}
                </View>
            ) : (
                <FlatList
                    data={filteredResults}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    onScrollEndDrag={Keyboard.dismiss}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={64}
                                color={colors.border}
                                style={{ marginBottom: 16 }}
                            />
                            <Text style={[styles.emptyText, { color: colors.icon }]}>
                                No matches found.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    resultCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    resultReference: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultText: {
        fontSize: 16,
        lineHeight: 24,
        fontFamily: 'Times New Roman', // Matches reader serif style
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        marginTop: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    recentContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    bookChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    }
});
