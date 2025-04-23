import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Keyboard, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/MapPageStyle';
import { saveSearchToHistory, renderHistoryItem } from '../services/driveHelpers';
import { MapsApiKey } from '@env';
import { useTheme } from '../context/ThemeContext';

const SearchBar = ({
    isMenuVisible,
    searchQuery,
    setSearchQuery,
    searchHistory,
    setSearchHistory,
    setDestination,
    showHistory,
    setShowHistory,
    fetchSearchHistory,
    isInternationalSearch
}) => {
    const { isDarkMode } = useTheme();

    const handleSearchTextChange = (text) => {
        setSearchQuery(text);
        const internationalKeywords = [
            'egypt', 'cairo', 'usa', 'new york', 'london', 'paris',
            'rome', 'berlin', 'madrid', 'tokyo', 'dubai', 'country'
        ];
        const isInternational = internationalKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
    };

    if (isMenuVisible) return null;

    return (
        <>
            <View style={styles.searchContainer}>
                <GooglePlacesAutocomplete
                    placeholder="Search"
                    onPress={(data, details = null) => {
                        if (details) {
                            const loc = details.geometry.location;
                            setDestination({
                                latitude: loc.lat,
                                longitude: loc.lng,
                            });
                            saveSearchToHistory(data.description, loc, setSearchHistory);
                            Keyboard.dismiss();
                        }
                        setShowHistory(false);
                    }}
                    query={{
                        key: MapsApiKey,
                        language: 'en',
                    }}
                    textInputProps={{
                        value: searchQuery,
                        onChangeText: handleSearchTextChange,
                        onFocus: () => setShowHistory(true),
                        placeholderTextColor: isDarkMode ? '#8E8E93' : '#666666',
                    }}
                    styles={{
                        container: {
                            flex: 0,
                        },
                        textInput: {
                            ...(isDarkMode ? styles.searchInputDark : styles.searchInput),
                            color: isDarkMode ? '#FFFFFF' : '#000000',
                            paddingLeft: 40,
                        },
                        listView: isDarkMode ? styles.searchListDark : styles.searchList,
                        row: {
                            backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF',
                            padding: 13,
                            height: 44,
                            flexDirection: 'row',
                        },
                        separator: {
                            height: 1,
                            backgroundColor: isDarkMode ? '#333333' : '#E5E5E5',
                        },
                        description: {
                            color: isDarkMode ? '#FFFFFF' : '#000000',
                        },
                        textInputContainer: {
                            backgroundColor: 'transparent',
                            position: 'relative',
                        },
                    }}
                    enablePoweredByContainer={false}
                    fetchDetails={true}
                    onFail={error => console.error(error)}
                />
                <MaterialIcons 
                    name="search" 
                    size={24} 
                    color={isDarkMode ? '#8E8E93' : '#666666'} 
                    style={{
                        position: 'absolute',
                        left: 15,
                        top: 13,
                        zIndex: 1,
                    }}
                />
            </View>

            <TouchableOpacity
                style={styles.historyButton}
                onPress={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) {
                        fetchSearchHistory();
                    }
                }}
            >
                <MaterialIcons name="history" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>

            {showHistory && (
                <View style={styles.historyPanel}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Recent Searches</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                            <Text style={styles.closeHistory}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.historyList}>
                        {searchHistory.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.historyItem}
                                onPress={() => {
                                    setDestination({
                                        latitude: item.location.latitude,
                                        longitude: item.location.longitude,
                                    });
                                    setShowHistory(false);
                                }}
                            >
                                <MaterialIcons name="history" size={20} color={isDarkMode ? '#8E8E93' : 'gray'} />
                                <Text style={[styles.historyText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{item.searchQuery}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </>
    );
};

export default SearchBar;
