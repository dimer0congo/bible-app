import { renderFormattedText } from '@/utils/text_formating';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface VerseData {
    verse: number;
    text: string;
}

interface NoteViewerProps {
    visible: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    content: string;
    book: string;
    chapter: number;
    verse: number;
    verseEnd?: number;
    verseText?: VerseData[];
    createdAt?: string;
}

export default function NoteViewer({
    visible,
    onClose,
    onEdit,
    onDelete,
    content,
    book,
    chapter,
    verse,
    verseEnd,
    verseText,
    createdAt
}: NoteViewerProps) {
    const { colors } = useTheme();
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // variables
    const snapPoints = useMemo(() => ['55%', '94%'], []);

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        if (index === -1) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (visible) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [visible]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
                opacity={0.5}
            />
        ),
        []
    );

    const verseReference = verseEnd && verseEnd !== verse
        ? `${book} ${chapter}:${verse}-${verseEnd}`
        : `${book} ${chapter}:${verse}`;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            // SQLite timestamp is YYYY-MM-DD HH:MM:SS
            const date = new Date(dateString.replace(' ', 'T') + 'Z');
            return date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    const renderHeader = useCallback(() => (
        <View>
            <View style={styles.header}>
                <TouchableOpacity style={styles.closeButton} onPress={() => bottomSheetModalRef.current?.dismiss()}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                        {verseReference}
                    </Text>
                    {createdAt && (
                        <Text style={[styles.dateText, { color: colors.text + '80' }]}>
                            {formatDate(createdAt)}
                        </Text>
                    )}
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.actionIcon} onPress={onDelete}>
                        <Ionicons name="trash-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.noteBox}>
                <Text style={[styles.noteContent, { color: colors.text }]}>{content}</Text>
            </View>

            <View style={{ height: 24 }} />
        </View>
    ), [colors, content, verseReference, onDelete, createdAt]);

    const renderVerseItem = useCallback(({ item, index }: { item: VerseData; index: number }) => {
        const isFirst = index === 0;
        const isLast = verseText ? index === verseText.length - 1 : false;

        return (
            <View style={[
                styles.verseItem,
                isFirst && styles.verseFirstItem,
                isLast && styles.verseLastItem,
                { borderLeftColor: colors.tint, backgroundColor: colors.card }
            ]}>
                <Text style={styles.verseTextContainer}>
                    <Text style={[styles.verseNumber, { color: colors.tint }]}>{item.verse} </Text>
                    <Text style={[styles.verseText, { color: colors.text }]}>
                        {renderFormattedText(item.text)}
                    </Text>
                </Text>
                {isLast && (
                    <Text style={[styles.verseRef, { color: colors.tint }]}>{verseReference}</Text>
                )}
            </View>
        );
    }, [colors, verseReference, verseText]);

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backdropComponent={renderBackdrop}
            enablePanDownToClose
            backgroundStyle={{ backgroundColor: colors.background }}
            handleIndicatorStyle={{ backgroundColor: colors.border }}
        >
            <BottomSheetFlatList
                data={verseText || []}
                keyExtractor={(item: any) => item.verse.toString()}
                renderItem={renderVerseItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={true}
            />
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 12,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionIcon: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noteBox: {
        marginVertical: 10,
    },
    noteContent: {
        fontSize: 17,
        lineHeight: 26,
    },
    verseItem: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderLeftWidth: 4,
    },
    verseFirstItem: {
        paddingTop: 16,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    verseLastItem: {
        paddingBottom: 16,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        marginBottom: 20,
    },
    verseTextContainer: {
        fontSize: 15,
        lineHeight: 24,

    },
    verseNumber: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    verseText: {
        fontSize: 16,
    },
    verseRef: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});
