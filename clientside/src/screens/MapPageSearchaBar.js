import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Keyboard, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { MaterialIcons } from '@expo/vector-icons';
import { styles } from '../styles/MapPageStyle';
import { saveSearchToHistory, renderHistoryItem } from '../services/driveHelpers';
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
    isInternationalSearch,
    setIsInternationalSearch
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
        setIsInternationalSearch(isInternational);
    };

    if (isMenuVisible) return null;

    return (
        <>
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0
            }}>
                <GooglePlacesAutocomplete
                    placeholder="Search for a destination"
                    fetchDetails
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
                    }}
                    query={{
                        key: process.env.MapsApiKey,
                        language: 'en',
                        location: '31.7683,35.2137',
                        radius: 100000,
                        components: isInternationalSearch ? undefined : 'country:il',
                        types: ['address', 'establishment', 'geocode'],
                        rankby: 'prominence',
                    }}
                    styles={{
                        container: isDarkMode ? styles.searchContainerDark : styles.searchContainer,
                        textInput: isDarkMode ? styles.searchInputDark : styles.searchInput,
                        listView: isDarkMode ? styles.searchListDark : styles.searchList,
                        row: isDarkMode ? styles.suggestionRowDark : styles.suggestionRow,
                        description: isDarkMode ? styles.suggestionTextDark : styles.suggestionText,
                        separator: isDarkMode ? styles.separatorDark : styles.separator,
                    }}
                    predefinedPlaces={!searchQuery ? searchHistory.slice(0, 6).map(renderHistoryItem) : []}
                    renderRow={(data, index) => {
                        const isHistoryItem = searchHistory.some(
                            item => item.searchQuery === data.description
                        );
                        return (
                            <View style={[
                                isDarkMode ? styles.suggestionRowDark : styles.suggestionRow,
                                isHistoryItem && (isDarkMode ? styles.historySuggestionRowDark : styles.historySuggestionRow)
                            ]}>
                                {isHistoryItem && (
                                    <MaterialIcons
                                        name="history"
                                        size={20}
                                        color={isDarkMode ? "#fff" : "#666"}
                                        style={styles.historyIcon}
                                    />
                                )}
                                <Text style={[
                                    isDarkMode ? styles.suggestionTextDark : styles.suggestionText,
                                    isHistoryItem && (isDarkMode ? styles.historySuggestionTextDark : styles.historySuggestionText)
                                ]}>
                                    {data.description}
                                </Text>
                            </View>
                        );
                    }}
                    listViewDisplayed="auto"
                    minLength={2}
                    enablePoweredByContainer={false}
                    debounce={500}
                    filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
                    renderDescription={(row) => row.description}
                    onFail={(error) => console.error(error)}
                    requestUrl={{
                        url: 'https://maps.googleapis.com/maps/api',
                        useOnPlatform: 'web',
                    }}
                    nearbyPlacesAPI="GooglePlacesSearch"
                    GooglePlacesSearchQuery={{
                        rankby: 'prominence',
                        location: '31.7683,35.2137',
                        radius: 100000,
                    }}
                    GooglePlacesDetailsQuery={{
                        fields: 'formatted_address,geometry',
                    }}
                    maxResults={6}
                    textInputProps={{
                        onChangeText: handleSearchTextChange
                    }}
                />
                <TouchableOpacity
                    style={isDarkMode ? styles.historyButtonDark : styles.historyButton}
                    onPress={() => {
                        setShowHistory(!showHistory);
                        if (!showHistory) {
                            fetchSearchHistory();
                        }
                    }}
                >
                    <MaterialIcons name="history" size={24} color={isDarkMode ? "#fff" : "black"} />
                </TouchableOpacity>
            </View>

            {showHistory && (
                <View style={isDarkMode ? styles.historyPanelDark : styles.historyPanel}>
                    <View style={isDarkMode ? styles.historyHeaderDark : styles.historyHeader}>
                        <Text style={isDarkMode ? styles.historyTitleDark : styles.historyTitle}>Recent Searches</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                            <Text style={isDarkMode ? styles.closeHistoryDark : styles.closeHistory}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={isDarkMode ? styles.historyListDark : styles.historyList}>
                        {searchHistory.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={isDarkMode ? styles.historyItemDark : styles.historyItem}
                                onPress={() => {
                                    setDestination({
                                        latitude: item.location.latitude,
                                        longitude: item.location.longitude,
                                    });
                                    setShowHistory(false);
                                }}
                            >
                                <MaterialIcons name="history" size={20} color={isDarkMode ? "#fff" : "gray"} />
                                <Text style={isDarkMode ? styles.historyTextDark : styles.historyText}>{item.searchQuery}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </>
    );
};

export default SearchBar;
