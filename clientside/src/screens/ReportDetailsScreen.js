import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { handleReport } from '../services/driveHelpers';
import { URL } from '@env';
import { Ionicons } from '@expo/vector-icons';

const ReportDetailsScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { reportType } = route.params;
    const { isDarkMode } = useTheme();
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const selectedMedia = result.assets[0];
                const isVideo = selectedMedia.type === 'video';
                
                setImage({
                    uri: selectedMedia.uri,
                    type: isVideo ? 'video/mp4' : 'image/jpeg',
                    name: `report_${isVideo ? 'video' : 'image'}_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`
                });
            }
        } catch (error) {
            console.error('Error picking media:', error);
            Alert.alert('Error', 'Failed to pick media. Please try again.');
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            const result = await handleReport(reportType, null, null, description, image);
            navigation.goBack();
        } catch (error) {
            console.error('Error submitting report:', error);
            Alert.alert('Error', error.message || 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const themeStyles = {
        container: isDarkMode ? styles.containerDark : styles.container,
        header: isDarkMode ? styles.headerDark : styles.header,
        backButtonText: isDarkMode ? styles.backButtonTextDark : styles.backButtonText,
        title: isDarkMode ? styles.titleDark : styles.title,
        input: isDarkMode ? styles.inputDark : styles.input,
        imageContainer: isDarkMode ? styles.imageContainerDark : styles.imageContainer,
        submitButton: isDarkMode ? styles.submitButtonDark : styles.submitButton,
    };

    return (
        <View style={themeStyles.container}>
            <View style={themeStyles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={themeStyles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={themeStyles.title}>Add Details</Text>
            </View>
            
            <ScrollView style={styles.content}>
                <View style={themeStyles.imageContainer}>
                    {image ? (
                        <View style={styles.mediaContainer}>
                            <TouchableOpacity 
                                style={styles.removeButton}
                                onPress={() => setImage(null)}
                            >
                                <Ionicons name="close-circle" size={24} color="#ff3b30" />
                            </TouchableOpacity>
                            {image.type === 'video/mp4' ? (
                                <View style={styles.videoPlaceholder}>
                                    <Ionicons name="videocam" size={48} color="#666" />
                                    <Text style={styles.videoText}>Video Selected</Text>
                                    <Text style={styles.videoSubtext}>Tap to change</Text>
                                </View>
                            ) : (
                                <Image 
                                    source={{ uri: image.uri }} 
                                    style={styles.media}
                                    onError={(e) => {
                                        console.log('Image loading error:', e.nativeEvent.error);
                                        Alert.alert('Error', 'Could not load the image. Please try selecting a different file.');
                                    }}
                                />
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity 
                            style={styles.addImageButton}
                            onPress={pickImage}
                        >
                            <Text style={styles.addImageButtonText}>Add Media</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TextInput
                    style={themeStyles.input}
                    placeholder="Add description (optional)"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#666'}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <TouchableOpacity 
                    style={[themeStyles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    containerDark: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        padding: 16,
        paddingTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerDark: {
        padding: 16,
        paddingTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 16,
        paddingVertical: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
    },
    backButtonTextDark: {
        fontSize: 16,
        color: '#0A84FF',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    titleDark: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    imageContainer: {
        width: '100%',
        height: 500,
        backgroundColor: '#f5f5f5',
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainerDark: {
        width: '100%',
        height: 500,
        backgroundColor: '#2D2D2D',
        marginBottom: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    media: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    videoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    videoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    videoSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    addImageButton: {
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    addImageButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        color: '#000',
    },
    inputDark: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        color: '#fff',
        backgroundColor: '#2D2D2D',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDark: {
        backgroundColor: '#0A84FF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    mediaContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    removeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        padding: 6,
        zIndex: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default ReportDetailsScreen; 