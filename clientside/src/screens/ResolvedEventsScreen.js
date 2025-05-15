import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { URL } from '@env';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { isLoggedIn } from '../services/getToken';

const ResolvedEventsScreen = () => {
    const { isDarkMode } = useTheme();
    const navigation = useNavigation();
    const [resolvedEvents, setResolvedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchResolvedEvents = async () => {
        try {
            const tokenData = await isLoggedIn();
            if (!tokenData) {
                setError('Please log in to view resolved events');
                setLoading(false);
                return;
            }

            // Get the user ID from the token
            const decodedToken = JSON.parse(atob(tokenData.token.split('.')[1]));
            const userId = decodedToken.id;

            const response = await axios.get(`${URL}/api/events/resolved/${userId}`, {
                headers: { Authorization: `Bearer ${tokenData.token}` }
            });
            setResolvedEvents(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching resolved events:', err);
            setError('Failed to load resolved events');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResolvedEvents();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchResolvedEvents().finally(() => setRefreshing(false));
    }, []);

    const getEventColor = (type) => {
        switch (type.toLowerCase()) {
            case 'fire':
                return isDarkMode ? '#FF453A' : '#FF3B30';
            case 'flood':
                return isDarkMode ? '#0A84FF' : '#007AFF';
            case 'earthquake':
                return isDarkMode ? '#FF9F0A' : '#FF9500';
            case 'medical':
                return isDarkMode ? '#32D74B' : '#34C759';
            case 'security':
                return isDarkMode ? '#BF5AF2' : '#AF52DE';
            default:
                return isDarkMode ? '#0A84FF' : '#007AFF';
        }
    };

    const renderEventItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.eventItem,
                isDarkMode ? styles.eventItemDark : null,
                { borderLeftColor: getEventColor(item.type) }
            ]}
            onPress={() => navigation.navigate('ResolvedEventDetails', { event: item })}
        >
            <View style={styles.eventHeader}>
                <Text style={[
                    styles.eventType,
                    isDarkMode ? styles.eventTypeDark : null,
                    { color: getEventColor(item.type) }
                ]}>
                    {item.type}
                </Text>
                <Text style={isDarkMode ? styles.eventDateDark : styles.eventDate}>
                    {new Date(item.resolvedAt).toLocaleString()}
                </Text>
            </View>
            
            <Text style={isDarkMode ? styles.eventLocationDark : styles.eventLocation}>
                Location: {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>
            
            {item.description && (
                <Text 
                    style={isDarkMode ? styles.eventDescriptionDark : styles.eventDescription}
                    numberOfLines={2}
                >
                    {item.description}
                </Text>
            )}

            <View style={styles.volunteersInfo}>
                <MaterialIcons 
                    name="people" 
                    size={20} 
                    color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
                <Text style={isDarkMode ? styles.volunteersCountDark : styles.volunteersCount}>
                    {item.participatingVolunteers?.length || 0} volunteers helped
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, isDarkMode ? styles.containerDark : null]}>
                <ActivityIndicator size="large" color="#067ef5" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, isDarkMode ? styles.containerDark : null]}>
                <Text style={[styles.errorText, isDarkMode ? styles.errorTextDark : null]}>
                    {error}
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, isDarkMode ? styles.containerDark : null]}>
            <View style={styles.header}>
                <MaterialIcons
                    name="arrow-back"
                    size={24}
                    color={isDarkMode ? '#FFFFFF' : '#000000'}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
                <Text style={[styles.title, isDarkMode ? styles.titleDark : null]}>
                    Resolved Events
                </Text>
            </View>
            <FlatList
                data={resolvedEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                refreshing={refreshing}
                onRefresh={onRefresh}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                    <Text style={[styles.emptyText, isDarkMode ? styles.emptyTextDark : null]}>
                        No resolved events found
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        marginRight: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
    },
    titleDark: {
        color: '#FFFFFF',
    },
    listContainer: {
        padding: 16,
    },
    eventItem: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 12,
        padding: 16,
        borderLeftWidth: 4,
    },
    eventItemDark: {
        backgroundColor: '#1E1E1E',
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    eventType: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    eventTypeDark: {
        color: '#FFFFFF',
    },
    eventDate: {
        fontSize: 14,
        color: '#666666',
    },
    eventDateDark: {
        color: '#AAAAAA',
    },
    eventLocation: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
    },
    eventLocationDark: {
        color: '#AAAAAA',
    },
    eventDescription: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 8,
    },
    eventDescriptionDark: {
        color: '#AAAAAA',
    },
    volunteersInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    volunteersCount: {
        fontSize: 14,
        color: '#666666',
        marginLeft: 4,
    },
    volunteersCountDark: {
        color: '#AAAAAA',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    errorTextDark: {
        color: '#FF453A',
    },
    emptyText: {
        color: '#666666',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
    emptyTextDark: {
        color: '#AAAAAA',
    },
});

export default ResolvedEventsScreen; 