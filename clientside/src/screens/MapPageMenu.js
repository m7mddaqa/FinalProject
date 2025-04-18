import React from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styles } from '../styles/MapPageStyle';
import { cancelRide } from '../services/driveHelpers';

const MapPageMenu = ({
    slideAnim,
    handleMenu,
    navigation,
    setDestination,
    setInstructions,
    setCurrentStepIndex,
}) => {
    return (
        <Animated.View
            style={[
                styles.slidingMenu,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            {/* Close Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={handleMenu}
            >
                <Fontisto name="close" size={24} color="white" />
            </TouchableOpacity>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                <Ionicons name="person-circle-outline" size={50} color="white" />
                <View style={styles.profileText}>
                    <Text style={styles.profileName}>Username</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ProfilePage')}>
                        <Text style={styles.viewProfileText}>View profile</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Menu Items */}
            <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="car-outline" size={24} color="white" />
                <Text style={styles.menuItemText}>Plan a drive</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
                <Text style={styles.menuItemText}>Inbox</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="settings-outline" size={24} color="white" />
                <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="help-circle-outline" size={24} color="white" />
                <Text style={styles.menuItemText}>Help and feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                    cancelRide(setDestination, setInstructions, setCurrentStepIndex, true)
                }
            >
                <Ionicons name="power-outline" size={24} color="white" />
                <Text style={styles.menuItemText}>Shut off</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default MapPageMenu;
