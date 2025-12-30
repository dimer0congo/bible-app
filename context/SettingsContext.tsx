import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type BibleVersion = 'KJV' | 'FR_APEE';

interface SettingsContextType {
    bibleVersion: BibleVersion;
    setBibleVersion: (version: BibleVersion) => void;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
    bibleVersion: 'KJV',
    setBibleVersion: () => { },
    isLoading: true,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [bibleVersion, setBibleVersionState] = useState<BibleVersion>('KJV');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedVersion = await AsyncStorage.getItem('bibleVersion');
            if (savedVersion) {
                setBibleVersionState(savedVersion as BibleVersion);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setBibleVersion = async (version: BibleVersion) => {
        try {
            setBibleVersionState(version);
            await AsyncStorage.setItem('bibleVersion', version);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    return (
        <SettingsContext.Provider value={{ bibleVersion, setBibleVersion, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
};
