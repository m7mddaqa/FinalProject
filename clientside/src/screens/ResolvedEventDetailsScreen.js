import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Platform, Modal, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { Video } from 'expo-av';
import { URL } from '@env';

const ResolvedEventDetailsScreen = () => {
    const { isDarkMode } = useTheme();
    const navigation = useNavigation();
    const route = useRoute();
    const { event } = route.params;
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const videoRef = useRef(null);

    const isVideo = event.image?.endsWith('.mp4');

    const getImageUrl = () => {
        if (!event.image) return null;

        //if the image path is already a full URL, return it as is
        if (event.image.startsWith('http')) {
            return event.image;
        }

        //if the image path already starts with /uploads, just prepend the base URL
        if (event.image.startsWith('/uploads/')) {
            return `${URL}${event.image}`;
        }

        //otherwise, construct the full URL
        return `${URL}/uploads/${event.image}`;
    };

    const handleVideoPress = async (videoUrl) => {
        try {
            if (videoUrl) {
                const fullVideoUrl = videoUrl.startsWith('http') ? videoUrl : `${URL}${videoUrl}`;

                //test if the URL is accessible
                const response = await fetch(fullVideoUrl, {
                    method: 'HEAD',
                    headers: {
                        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
                    }
                });

                if (!response.ok) {
                    //if the URL contains /api/uploads, try without /api
                    if (fullVideoUrl.includes('/api/uploads/')) {
                        const altUrl = fullVideoUrl.replace('/api/uploads/', '/uploads/');

                        const altResponse = await fetch(altUrl, {
                            method: 'HEAD',
                            headers: {
                                'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8'
                            }
                        });

                        if (altResponse.ok) {
                            setVideoLoading(true);
                            setVideoError(false);
                            setSelectedVideo(altUrl);
                            return;
                        }
                    }

                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                setVideoLoading(true);
                setVideoError(false);
                setSelectedVideo(fullVideoUrl);
            }
        } catch (error) {
            console.error('Error handling video:', error);
            Alert.alert(
                'Error',
                'Could not play video. Please check your connection and try again.',
                [
                    {
                        text: 'Retry',
                        onPress: () => handleVideoPress(videoUrl)
                    },
                    {
                        text: 'Cancel',
                        style: 'cancel'
                    }
                ]
            );
            setVideoError(true);
            setVideoLoading(false);
        }
    };

    const renderVideoModal = () => {
        if (!selectedVideo) return null;

        return (
            <Modal
                visible={!!selectedVideo}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setSelectedVideo(null);
                    setVideoLoading(false);
                    setVideoError(false);
                }}
            >
                <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setSelectedVideo(null);
                                setVideoLoading(false);
                                setVideoError(false);
                            }}
                        >
                            <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
                        </TouchableOpacity>
                        {videoLoading && (
                            <View style={styles.videoLoadingContainer}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>Loading video...</Text>
                            </View>
                        )}
                        {videoError ? (
                            <View style={styles.videoErrorContainer}>
                                <Text style={styles.errorText}>Failed to load video</Text>
                                <Text style={styles.errorSubtext}>Please check your connection and try again</Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={() => handleVideoPress(getImageUrl())}
                                >
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Video
                                ref={videoRef}
                                source={{ uri: selectedVideo }}
                                style={styles.videoPlayer}
                                useNativeControls
                                resizeMode="contain"
                                isLooping={false}
                                shouldPlay={true}
                                onLoadStart={() => {
                                    setVideoLoading(true);
                                }}
                                onLoad={() => {
                                    setVideoLoading(false);
                                    setVideoError(false);
                                }}
                                onError={(error) => {
                                    setVideoError(true);
                                    setVideoLoading(false);
                                }}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        );
    };

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

    const renderMedia = () => {
        if (!event.image) return null;

        if (isVideo) {
            const videoUrl = getImageUrl();
            return (
                <TouchableOpacity
                    style={styles.videoContainer}
                    onPress={() => handleVideoPress(videoUrl)}
                >
                    <View style={styles.videoContent}>
                        <Ionicons name="videocam" size={64} color="#666" />
                        <Text style={styles.videoText}>Tap to play video</Text>
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.imageContainer}>
                {imageLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                    </View>
                )}
                <Image
                    source={{
                        uri: getImageUrl(),
                        cache: 'force-cache'
                    }}
                    style={styles.image}
                    resizeMode="contain"
                    onLoadStart={() => {
                        setImageLoading(true);
                        setImageError(false);
                    }}
                    onLoad={() => {
                        setImageLoading(false);
                        setImageError(false);
                    }}
                    onError={(error) => {
                        setImageError(true);
                        setImageLoading(false);
                    }}
                />
                {imageError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Failed to load image</Text>
                    </View>
                )}
            </View>
        );
    };

    const openMaps = () => {
        const url = Platform.select({
            ios: `maps:${event.location.latitude},${event.location.longitude}?q=${event.location.latitude},${event.location.longitude}`,
            android: `geo:${event.location.latitude},${event.location.longitude}?q=${event.location.latitude},${event.location.longitude}`
        });
        Linking.openURL(url);
    };

    return (
        <ScrollView style={[styles.container, isDarkMode ? styles.containerDark : null]}>
            <View style={styles.header}>
                <MaterialIcons
                    name="arrow-back"
                    size={24}
                    color={isDarkMode ? '#FFFFFF' : '#000000'}
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
                <Text style={[styles.title, isDarkMode ? styles.titleDark : null]}>
                    Event Details
                </Text>
            </View>

            <View style={[styles.content, isDarkMode ? styles.contentDark : null]}>
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode ? styles.sectionTitleDark : null]}>
                        Event Information
                    </Text>
                    <View style={styles.infoRow}>
                        <Text style={[styles.label, isDarkMode ? styles.labelDark : null]}>Type:</Text>
                        <Text style={[
                            styles.value,
                            isDarkMode ? styles.valueDark : null,
                            { color: getEventColor(event.type) }
                        ]}>
                            {event.type}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.label, isDarkMode ? styles.labelDark : null]}>Reported by:</Text>
                        <Text style={[styles.value, isDarkMode ? styles.valueDark : null]}>
                            {event.userInfo?.name || 'Anonymous'}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.label, isDarkMode ? styles.labelDark : null]}>Resolved at:</Text>
                        <Text style={[styles.value, isDarkMode ? styles.valueDark : null]}>
                            {new Date(event.resolvedAt).toLocaleString()}
                        </Text>
                    </View>
                </View>

                {event.description && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDarkMode ? styles.sectionTitleDark : null]}>
                            Description
                        </Text>
                        <Text style={[styles.description, isDarkMode ? styles.descriptionDark : null]}>
                            {event.description}
                        </Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode ? styles.sectionTitleDark : null]}>
                        Location
                    </Text>
                    <TouchableOpacity onPress={openMaps} style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: event.location.latitude,
                                longitude: event.location.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                        >
                            <Marker
                                coordinate={{
                                    latitude: event.location.latitude,
                                    longitude: event.location.longitude,
                                }}
                            />
                        </MapView>
                        <View style={styles.mapOverlay}>
                            <MaterialIcons name="open-in-new" size={24} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                {event.image && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, isDarkMode ? styles.sectionTitleDark : null]}>
                            Media
                        </Text>
                        {renderMedia()}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, isDarkMode ? styles.sectionTitleDark : null]}>
                        Participating Volunteers
                    </Text>
                    {event.participatingVolunteers?.map((volunteer, index) => (
                        <View key={index} style={styles.volunteerItem}>
                            <MaterialIcons
                                name="person"
                                size={24}
                                color={isDarkMode ? '#FFFFFF' : '#000000'}
                            />
                            <Text style={[styles.volunteerName, isDarkMode ? styles.volunteerNameDark : null]}>
                                {volunteer.username}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {renderVideoModal()}
        </ScrollView>
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
    content: {
        padding: 16,
    },
    contentDark: {
        backgroundColor: '#121212',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 12,
    },
    sectionTitleDark: {
        color: '#FFFFFF',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        color: '#666666',
        width: 100,
    },
    labelDark: {
        color: '#AAAAAA',
    },
    value: {
        fontSize: 16,
        color: '#000000',
        flex: 1,
    },
    valueDark: {
        color: '#FFFFFF',
    },
    description: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
    },
    descriptionDark: {
        color: '#AAAAAA',
    },
    mapContainer: {
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    mapOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        padding: 8,
    },
    imageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    errorContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    volunteerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    volunteerName: {
        fontSize: 16,
        color: '#000000',
        marginLeft: 12,
    },
    volunteerNameDark: {
        color: '#FFFFFF',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        height: '80%',
        borderRadius: 10,
        padding: 20,
    },
    closeButton: {
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 1,
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    videoLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    videoErrorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        marginBottom: 8,
    },
    errorSubtext: {
        color: '#666',
        fontSize: 14,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    videoContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
    },
    videoContent: {
        alignItems: 'center',
    },
    videoText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16,
    },
});

export default ResolvedEventDetailsScreen; 