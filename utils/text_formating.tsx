import { Text } from "react-native";

export const renderFormattedText = (text: string) => {
    const parts = text.split(/(\{.*?\})/g);
    return parts.map((part, index) => {
        if (part.startsWith('{') && part.endsWith('}')) {
            return (
                <Text key={index} style={[{ fontStyle: 'italic', }]}>
                    {part.slice(1, -1)}
                </Text>
            );
        }
        return <Text key={index}>{part}</Text>;
    });
};