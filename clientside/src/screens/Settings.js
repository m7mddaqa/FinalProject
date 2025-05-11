import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { URL } from '@env';
import { fetchSearchHistory } from '../services/driveHelpers';

const Settings = ({ navigation }) => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [avoidTolls, setAvoidTolls] = useState(false);
    const [hideMarkers, setHideMarkers] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);

    //load saved settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedAvoidTolls = await AsyncStorage.getItem('avoidTolls');
                const savedHideMarkers = await AsyncStorage.getItem('hideMarkers');
                if (savedAvoidTolls || savedHideMarkers !== null) {
                    setAvoidTolls(JSON.parse(savedAvoidTolls));
                    setHideMarkers(JSON.parse(savedHideMarkers));
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        };
        loadSettings();
    }, []);

    //save avoid tolls choice in async storage when changes
    const toggleAvoidTolls = async () => {
        const newValue = !avoidTolls;
        setAvoidTolls(newValue);
        try {
            await AsyncStorage.setItem('avoidTolls', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    //save hide markers choice in async storage when changes
    const toggleHideMarkers = async () => {
        const newValue = !hideMarkers;
        setHideMarkers(newValue);
        try {
            await AsyncStorage.setItem('hideMarkers', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const clearSearchHistory = async () => {
        Alert.alert(
            "Clear Search History",
            "Are you sure you want to clear your search history?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            //get the token from AsyncStorage
                            const token = await AsyncStorage.getItem('token');
                            if (!token) {
                                throw new Error('No authentication token found');
                            }

                            //delete from database
                            await axios.delete(`${URL}/api/search-history`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            // Set to empty array immediately for instant UI update
                            setSearchHistory([]);
                            // Then fetch to ensure sync with server
                            const updatedHistory = await fetchSearchHistory();
                            setSearchHistory(updatedHistory);

                            Alert.alert("Success", "Search history has been cleared");
                        } catch (error) {
                            console.error('Error clearing search history:', error);
                            Alert.alert("Error", "Failed to clear search history");
                        }
                    }
                }
            ]
        );
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

            <View style={themeStyles.settingItem}>
                <Text style={themeStyles.settingText}>Hide Reports On Map</Text>
                <Switch
                    value={hideMarkers}
                    onValueChange={toggleHideMarkers}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={hideMarkers ? '#067ef5' : '#f4f3f4'}
                />
            </View>

            <TouchableOpacity
                style={themeStyles.settingItem}
                onPress={clearSearchHistory}
            >
                <Text style={[themeStyles.settingText, { color: '#FF3B30' }]}>
                    Clear Search History
                </Text>
            </TouchableOpacity>

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