import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    colors: typeof Colors.light;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');

    useEffect(() => {
        if (systemScheme) {
            setThemeState(systemScheme);
        }
    }, [systemScheme]);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
        // Ideally save to AsyncStorage here
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const value = {
        theme,
        colors: Colors[theme],
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
