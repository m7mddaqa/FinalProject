import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLoggedIn } from '../services/getToken';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = process.env.URL;
console.log('API URL:', API_URL);

const ProfilePage = ({ navigation }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    const [token, setToken] = useState(null);
    const [showImagePickerModal, setShowImagePickerModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tokenData = await isLoggedIn();
                if (!tokenData) {
                    navigation.navigate('MapPage');
                    return;
                }

                setToken(tokenData.token);
                console.log('Token:', tokenData.token);
                console.log('User ID:', tokenData.userId);

                //fetch user profile data
                const response = await axios.get(`${API_URL}/api/profile/${tokenData.userId}`, {
                    headers: { Authorization: `Bearer ${tokenData.token}` }
                });
                console.log('Profile data:', response.data);
                setUserData(response.data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching profile:', error);
                console.error('Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                setError('Failed to load profile data');
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleImagePick = async (source) => {
        try {
            if (source === 'gallery') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture');
                    return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                });

                if (!result.canceled) {
                    setShowImagePickerModal(false);
                    await uploadImage(result.assets[0].uri);
                }
            } else if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Please grant camera permissions to take a profile picture');
                    return;
                }

                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                });

                if (!result.canceled) {
                    setShowImagePickerModal(false);
                    await uploadImage(result.assets[0].uri);
                }
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadImage = async (uri) => {
        try {
            const formData = new FormData();
            formData.append('image', {
                uri: uri,
                type: 'image/jpeg',
                name: 'profile.jpg'
            });
            formData.append('userId', userData._id);

            const response = await axios.post(`${API_URL}/api/profile/image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setUserData(prev => ({
                ...prev,
                profileImage: response.data.profileImage
            }));
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', 'Failed to upload profile picture');
        }
    };

    const handleSignOut = async () => {
        try {
            await AsyncStorage.removeItem('token');
            navigation.navigate('MapPage');
        } catch (error) {
            console.error('Error removing token:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        //replace backslashes with forward slashes and remove any double slashes
        const cleanPath = path.replace(/\\/g, '/').replace(/\/+/g, '/');
        //remove 'uploads/' from the path since it's already in the API_URL
        const filename = cleanPath.replace('uploads/', '');
        return `${API_URL}/uploads/${filename}`;
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Ionicons name="arrow-back-outline" size={28} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity onPress = {() => navigation.navigate('MapPage')} style={{ marginTop: 20 }}>
                    <Ionicons name="close-outline" size={28} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.profileCard}>
                <TouchableOpacity onPress={() => setShowImagePickerModal(true)}>
                    <View style={styles.avatarContainer}>
                        {userData?.profileImage ? (
                            <Image
                                source={{ uri: getImageUrl(userData.profileImage) }}
                                style={styles.avatar}
                                onError={(e) => {
                                    console.error('Image loading error:', e.nativeEvent.error);
                                    console.error('Attempted URL:', getImageUrl(userData.profileImage));
                                }}
                            />
                        ) : (
                            <View style={styles.defaultAvatar}>
                                <Ionicons name="person-circle-outline" size={120} color="#067ef5" />
                            </View>
                        )}
                        <View style={[
                            styles.editIconContainer,
                            userData?.profileImage && styles.editIconContainerHidden
                        ]}>
                            <Ionicons name="camera-outline" size={20} color="white" />
                        </View>
                    </View>
                </TouchableOpacity>

                <Text style={styles.profileName}>{userData?.username}</Text>
                <Text style={styles.pointsTitle}>POINTS</Text>
                <Text style={styles.pointsValue}>{userData?.score || 0}</Text>
                <Text style={styles.userInfo}>Username: {userData?.username}</Text>
                <Text style={styles.userInfo}>Joined: {formatDate(userData?.createdAt)}</Text>
            </View>

            {/* Image Picker Modal */}
            <Modal
                visible={showImagePickerModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowImagePickerModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Change Profile Picture</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => handleImagePick('gallery')}
                        >
                            <Ionicons name="images-outline" size={24} color="#067ef5" />
                            <Text style={styles.modalButtonText}>Choose from Gallery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => handleImagePick('camera')}
                        >
                            <Ionicons name="camera-outline" size={24} color="#067ef5" />
                            <Text style={styles.modalButtonText}>Take a Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setShowImagePickerModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.menu}>
                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigation.navigate('ResolvedEvents')}
                >
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#067ef5" />
                        <Text style={styles.menuItemText}>Resolved Events</Text>
                    </View>
                    <View style={styles.menuItemRight}>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                    <View style={styles.menuItemLeft}>
                        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                        <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Sign Out</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        marginTop: 20,
        fontSize: 20,
        fontWeight: 'bold',
        color: 'black',
    },
    profileCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 40,
        elevation: 3,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        marginBottom: 10,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        width: '100%',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconContainerHidden: {
        opacity: 0,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 5,
    },
    pointsTitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 5,
    },
    pointsValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#067ef5',
        marginBottom: 15,
    },
    userInfo: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    menu: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginTop: 20,
        marginHorizontal: 16,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 12,
        color: '#333',
    },
    menuItemValue: {
        fontSize: 16,
        color: '#666',
        marginRight: 8,
    },
    signOutButton: {
        backgroundColor: '#f44336',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 20,
    },
    signOutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    defaultAvatar: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'black',
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalButtonText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#067ef5',
    },
    cancelButton: {
        borderBottomWidth: 0,
        marginTop: 10,
    },
    cancelButtonText: {
        color: 'red',
        fontSize: 16,
    },
});

export default ProfilePage;
