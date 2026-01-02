import { renderFormattedText } from '@/utils/text_formating';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface VerseData {
    verse: number;
    text: string;
}

interface NoteEditorProps {
    visible: boolean;
    onClose: () => void;
    onSave: (content: string) => void;
    onDelete: () => void;
    initialContent?: string;
    book: string;
    chapter: number;
    verse: number;
    verseEnd?: number;
    verseText?: VerseData[];
}

export default function NoteEditor({ visible, onClose, onSave, onDelete, initialContent = '', book, chapter, verse, verseEnd, verseText }: NoteEditorProps) {
    const { colors } = useTheme();
    const [content, setContent] = useState(initialContent);

    useEffect(() => {
        setContent(initialContent);
    }, [initialContent, visible]);

    const handleSave = () => {
        onSave(content);
        onClose();
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Note",
            "Are you sure you want to delete this note?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        onDelete();
                        onClose();
                    }
                }
            ]
        );
    };

    const verseReference = verseEnd && verseEnd !== verse
        ? `${book} ${chapter}:${verse}-${verseEnd}`
        : `${book} ${chapter}:${verse}`;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { backgroundColor: colors.background }]}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={{ color: colors.tint, fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Note: {verseReference}
                    </Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={{ color: colors.tint, fontWeight: 'bold', fontSize: 16 }}>Save</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollContent}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Editor */}
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        multiline
                        placeholder="Write your thoughts here..."
                        placeholderTextColor={colors.icon}
                        value={content}
                        onChangeText={setContent}
                        autoFocus
                    />

                    {/* Verse Text Display - Now AFTER the input */}
                    {verseText && verseText.length > 0 && (
                        <View style={[styles.verseCard, { backgroundColor: colors.card, borderLeftColor: colors.tint }]}>
                            <View style={styles.quoteIconContainer}>
                                <Ionicons name="chatbubble-outline" size={20} color={colors.tint} style={{ opacity: 0.2 }} />
                            </View>
                            <Text style={styles.verseContent}>
                                {verseText.map((v, index) => (
                                    <Text key={v.verse}>
                                        <Text style={[styles.verseNumber, { color: colors.tint }]}>
                                            {v.verse}{' '}
                                        </Text>
                                        <Text style={[styles.verseText, { color: colors.text }]}>
                                            {renderFormattedText(v.text)}{index < verseText.length - 1 ? ' ' : ''}
                                        </Text>
                                    </Text>
                                ))}
                            </Text>
                            <View style={styles.verseFooter}>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <Text style={[styles.verseLabel, { color: colors.tint }]}>
                                    {verseReference}
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Footer/Delete */}
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        <Text style={[styles.deleteText, { color: '#ef4444' }]}>Delete Note</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        fontSize: 16,
        fontWeight: 'bold',
    },
    verseCard: {
        margin: 16,
        padding: 16,
        borderLeftWidth: 4,
    },
    quoteIconContainer: {
        position: 'absolute',
        top: 8,
        right: 12,
    },
    verseText: {
        fontSize: 16,
        lineHeight: 26,
    },
    verseContent: {
        marginTop: 4,
    },
    verseNumber: {
        fontSize: 12,
        fontWeight: 'bold',
        verticalAlign: 'top',
    },
    verseFooter: {
        marginTop: 12,
    },
    divider: {
        height: 1,
        width: 40,
        marginBottom: 8,
        borderRadius: 1,
    },
    verseLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollContent: {
        flex: 1,
    },
    input: {
        padding: 18,
        fontSize: 16,
        margin: 16,
        textAlignVertical: 'top',
        minHeight: 20,
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        alignItems: 'center',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteText: {
        fontSize: 16,
        fontWeight: '500',
    }
});
