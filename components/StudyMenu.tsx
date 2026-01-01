import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getAllHighlights, Highlight } from '../services/DatabaseService';

interface StudyMenuProps {
    visible: boolean;
    onClose: () => void;
    onNavigateToVerse: (book: string, chapter: number, verse: number) => void;
}

type Tab = 'Highlights' | 'Notes' | 'History';

export default function StudyMenu({ visible, onClose, onNavigateToVerse }: StudyMenuProps) {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState<Tab>('Highlights');
    const [highlights, setHighlights] = useState<Highlight[]>([]);

    useEffect(() => {
        if (visible && activeTab === 'Highlights') {
            loadHighlights();
        }
    }, [visible, activeTab]);

    const loadHighlights = async () => {
        try {
            const data = await getAllHighlights();
            setHighlights(data);
        } catch (e) {
            console.error("Failed to load highlights", e);
        }
    };

    const renderHighlightItem = ({ item }: { item: Highlight }) => (
        <TouchableOpacity
            style={[styles.item, { borderBottomColor: colors.border }]}
            onPress={() => {
                onNavigateToVerse(item.book, item.chapter, item.verse);
                onClose();
            }}
        >
            <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
            <Text style={[styles.itemText, { color: colors.text }]}>
                {item.book} {item.chapter}:{item.verse}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.icon} />
        </TouchableOpacity>
    );

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
                    <Text style={[styles.title, { color: colors.text }]}>Study Tools</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle" size={28} color={colors.icon} />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
                    {(['Highlights', 'Notes', 'History'] as Tab[]).map((tab) => (
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
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <Text style={[styles.emptyText, { color: colors.text }]}>
                                    No highlights yet.
                                </Text>
                            }
                        />
                    )}
                    {activeTab === 'Notes' && (
                        <View style={styles.center}>
                            <Text style={{ color: colors.text }}>Notes coming soon...</Text>
                        </View>
                    )}
                    {activeTab === 'History' && (
                        <View style={styles.center}>
                            <Text style={{ color: colors.text }}>History coming soon...</Text>
                        </View>
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
