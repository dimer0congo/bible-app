import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
}

export default function NoteEditor({ visible, onClose, onSave, onDelete, initialContent = '', book, chapter, verse, verseEnd }: NoteEditorProps) {
    const { colors } = useTheme();
    const [content, setContent] = useState(initialContent);

    useEffect(() => {
        setContent(initialContent);
    }, [initialContent, visible]);

    const handleSave = () => {
        onSave(content);
        onClose();
    };

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
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={{ color: colors.tint, fontSize: 16 }}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.text }]}>
                        Note: {book} {chapter}:{verse}{verseEnd ? `-${verseEnd}` : ''}
                    </Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={{ color: colors.tint, fontWeight: 'bold', fontSize: 16 }}>Save</Text>
                    </TouchableOpacity>
                </View>

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

                {/* Footer/Delete */}
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => { onDelete(); onClose(); }}>
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
    input: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        textAlignVertical: 'top',
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
