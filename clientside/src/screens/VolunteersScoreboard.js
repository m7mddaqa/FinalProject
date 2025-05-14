import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { URL } from '@env';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const VolunteersScoreboard = ({ navigation }) => {
    const { isDarkMode } = useTheme();
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const fetchVolunteers = async () => {
        try {
            const response = await axios.get(`${URL}/api/volunteerScoreboard`);
            setVolunteers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching volunteers:', err);
            setError('Failed to load volunteers');
            setLoading(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchVolunteers().finally(() => setRefreshing(false));
    }, []);

    const renderVolunteerItem = ({ item, index }) => (
        <View style={[
            styles.volunteerItem,
            isDarkMode ? styles.volunteerItemDark : null
        ]}>
            <View style={styles.rankContainer}>
                <Text style={[
                    styles.rankText,
                    isDarkMode ? styles.rankTextDark : null
                ]}>
                    #{index + 1}
                </Text>
            </View>
            <View style={styles.volunteerInfo}>
                <Text style={[
                    styles.username,
                    isDarkMode ? styles.usernameDark : null
                ]}>
                    {item.username}
                </Text>
                <Text style={[
                    styles.score,
                    isDarkMode ? styles.scoreDark : null
                ]}>
                    {item.score} points
                </Text>
            </View>
        </View>
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
                    Volunteers Scoreboard
                </Text>
            </View>
            <FlatList
                data={volunteers}
                renderItem={renderVolunteerItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                refreshing={refreshing}
                onRefresh={onRefresh}
                showsVerticalScrollIndicator={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
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
    volunteerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 8,
    },
    volunteerItemDark: {
        backgroundColor: '#1E1E1E',
    },
    rankContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#067ef5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    rankTextDark: {
        color: '#FFFFFF',
    },
    volunteerInfo: {
        flex: 1,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    usernameDark: {
        color: '#FFFFFF',
    },
    score: {
        fontSize: 14,
        color: '#666666',
    },
    scoreDark: {
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
});

export default VolunteersScoreboard; 