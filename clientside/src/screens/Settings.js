import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Settings = ({ navigation }) => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [avoidTolls, setAvoidTolls] = useState(false);

    //load saved settings
    React.useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedAvoidTolls = await AsyncStorage.getItem('avoidTolls');
                if (savedAvoidTolls !== null) {
                    setAvoidTolls(JSON.parse(savedAvoidTolls));
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        loadSettings();
    }, []);

    //save settings when changed
    const toggleAvoidTolls = async () => {
        const newValue = !avoidTolls;
        setAvoidTolls(newValue);
        try {
            await AsyncStorage.setItem('avoidTolls', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const themeStyles = {
        container: isDarkMode ? styles.containerDark : styles.container,
        header: isDarkMode ? styles.headerDark : styles.header,
        title: isDarkMode ? styles.titleDark : styles.title,
        settingItem: isDarkMode ? styles.settingItemDark : styles.settingItem,
        settingText: isDarkMode ? styles.settingTextDark : styles.settingText,
        backButton: isDarkMode ? styles.backButtonDark : styles.backButton,
    };

    return (
        <View style={themeStyles.container}>
            {/* Custom Back Button */}
            <TouchableOpacity 
                style={themeStyles.backButton}
                onPress={() => navigation.goBack()}
            >
                <MaterialIcons 
                    name="arrow-back" 
                    size={24} 
                    color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
            </TouchableOpacity>

            <View style={themeStyles.header}>
                <Text style={themeStyles.title}>Settings</Text>
            </View>

            <View style={themeStyles.settingItem}>
                <Text style={themeStyles.settingText}>Avoid Tolls</Text>
                <Switch
                    value={avoidTolls}
                    onValueChange={toggleAvoidTolls}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={avoidTolls ? '#067ef5' : '#f4f3f4'}
                />
            </View>

            <View style={themeStyles.settingItem}>
                <Text style={themeStyles.settingText}>
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </Text>
                <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isDarkMode ? '#067ef5' : '#f4f3f4'}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    containerDark: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerDark: {
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
    },
    titleDark: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    settingItemDark: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    settingText: {
        fontSize: 16,
        color: '#000000',
    },
    settingTextDark: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
    backButtonDark: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1,
    },
});

export default Settings; 