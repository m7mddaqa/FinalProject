import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, ActivityIndicator, Linking, Alert, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { URL } from '@env';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';

const EventDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { event } = route.params;
    const { theme, isDarkMode } = useTheme();
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef(null);

    const isVideo = event.image?.endsWith('.mp4');

    const getImageUrl = () => {
        if (!event.image) return null;
        
        //if the image path is already a full URL, return it as is
        if (event.image.startsWith('http')) {
            return event.image;
        }
        
        //if the image path already starts with /api/uploads, just prepend the base URL
        if (event.image.startsWith('/api/uploads/')) {
            return `${URL}${event.image}`;
        }
        
        //if the image path starts with /uploads, replace it with /api/uploads
        if (event.image.startsWith('/uploads/')) {
            return `${URL}/api${event.image}`;
        }
        
        //otherwise, construct the full URL
        return `${URL}/api/uploads/${event.image}`;
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
                    {imageError && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Failed to load video</Text>
                            <Text style={styles.errorSubtext}>URL: {videoUrl}</Text>
                        </View>
                    )}
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
                    style={styles.eventImage}
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

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                    Event Details
                </Text>
            </View>
            
            <ScrollView style={styles.content}>
                {renderMedia()}
                
                <View style={styles.detailsContainer}>
                    <Text style={[styles.eventType, { color: isDarkMode ? '#fff' : '#000' }]}>
                        {event.type}
                    </Text>
                    
                    {event.description && (
                        <Text style={[styles.description, { color: isDarkMode ? '#ccc' : '#666' }]}>
                            {event.description}
                        </Text>
                    )}
                    
                    <View style={styles.infoContainer}>
                        <View style={styles.infoRow}>
                            <Ionicons name="time-outline" size={20} color={isDarkMode ? '#ccc' : '#666'} />
                            <Text style={[styles.infoText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                                {new Date(event.createdAt).toLocaleString()}
                            </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={20} color={isDarkMode ? '#ccc' : '#666'} />
                            <Text style={[styles.infoText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                                Reported by: {event.userInfo?.name || 'Anonymous User'}
                            </Text>
                        </View>
                        
                        {event.distance !== undefined && (
                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={20} color={isDarkMode ? '#ccc' : '#666'} />
                                <Text style={[styles.infoText, { color: isDarkMode ? '#ccc' : '#666' }]}>
                                    {event.distance.toFixed(2)} km away
                                </Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity 
                        style={[styles.checkDetailsButton, { backgroundColor: isDarkMode ? '#007AFF' : '#007AFF' }]}
                        onPress={() => navigation.navigate('EventDetails', { event })}
                    >
                        <Text style={styles.checkDetailsButtonText}>Go to Location</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            
            {renderVideoModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        marginRight: 16,
        paddingVertical: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        paddingVertical: 8,
    },
    content: {
        flex: 1,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#f5f5f5',
    },
    eventImage: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 16,
        fontWeight: 'bold',
    },
    errorSubtext: {
        color: '#ff3b30',
        fontSize: 14,
        marginTop: 4,
    },
    detailsContainer: {
        padding: 16,
    },
    eventType: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        marginBottom: 16,
        lineHeight: 24,
    },
    infoContainer: {
        marginTop: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 16,
    },
    videoContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoContent: {
        alignItems: 'center',
    },
    videoText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        color: '#666',
    },
    videoSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
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
        padding: 16,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1,
    },
    videoPlayer: {
        width: '100%',
        height: '100%',
    },
    videoLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoErrorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    retryButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkDetailsButton: {
        marginTop: 24,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    checkDetailsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EventDetailsScreen; 