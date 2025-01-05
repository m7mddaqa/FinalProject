import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfilePage = ({ navigation }) => {
    const [isInvisible, setIsInvisible] = React.useState(false);

    const toggleSwitch = () => setIsInvisible((previousState) => !previousState);

    const handleSignOut = async () => {
        try {
            await AsyncStorage.removeItem('token');
            console.log('Token removed successfully');
            
            navigation.navigate('LoginPage');
        } catch (error) {
            console.error('Error removing token:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
    };
    

    return (
        <View style={styles.container}>
            {/* Profile Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={28} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity>
                    <Ionicons name="close-outline" size={28} color="black" />
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileCard}>
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                </View>
                <Text style={styles.profileName}>username</Text>
                <Text style={styles.pointsTitle}>POINTS</Text>
                <Text style={styles.pointsValue}>1246</Text>
                <Text style={styles.userInfo}>Username:</Text>
                <Text style={styles.userInfo}>Joined x years ago</Text>
            </View>

            {/* Profile Menu */}
            <View style={styles.menu}>
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="person-outline" size={24} color="black" />
                    <Text style={styles.menuItemText}>Account and login</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="home-outline" size={24} color="black" />
                    <Text style={styles.menuItemText}>Setup home or work address</Text>
                </TouchableOpacity>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
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
        elevation: 3,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 10,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black',
        marginBottom: 5,
    },
    pointsTitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 5,
    },
    pointsValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#067ef5',
        marginBottom: 10,
    },
    userInfo: {
        fontSize: 14,
        color: '#666',
    },
    menu: {
        backgroundColor: 'white',
        borderRadius: 10,
        paddingVertical: 10,
        elevation: 3,
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    menuItemText: {
        fontSize: 16,
        color: 'black',
        marginLeft: 10,
    },
    signOutButton: {
        backgroundColor: '#f44336', // Red button for "Sign Out"
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignItems: 'center',
        alignSelf: 'center', // Center the button horizontally
        marginTop: 20,
    },
    signOutButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfilePage;
