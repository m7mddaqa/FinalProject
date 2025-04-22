import React from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
    const themeStyles = {
        menu: styles.slidingMenu,
        text: styles.menuItemText,
        icon: '#000000',
        profileName: styles.profileName,
        menuItem: styles.menuItem,
    };

    return (
        <Animated.View
            style={[
                themeStyles.menu,
                { transform: [{ translateY: slideAnim }] },
            ]}
        >
            {/* Close Button */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={handleMenu}
            >
                <MaterialIcons name="close" size={24} color={themeStyles.icon} />
            </TouchableOpacity>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                <MaterialIcons name="person" size={50} color="#067ef5" />
                <View style={styles.profileText}>
                    <Text style={themeStyles.profileName}>mohamad dacca</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ProfilePage')}>
                        <Text style={styles.viewProfileText}>View profile</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Menu Items */}
            <TouchableOpacity style={themeStyles.menuItem}>
                <MaterialIcons name="schedule" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Plan a drive</Text>
            </TouchableOpacity>

            <TouchableOpacity style={themeStyles.menuItem}>
                <MaterialIcons name="chat" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Inbox</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={themeStyles.menuItem}
                onPress={() => navigation.navigate('Settings')}
            >
                <MaterialIcons name="settings" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={themeStyles.menuItem}>
                <MaterialIcons name="help" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Help and feedback</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={themeStyles.menuItem}
                onPress={() =>
                    cancelRide(setDestination, setInstructions, setCurrentStepIndex, true)
                }
            >
                <MaterialIcons name="power-settings-new" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Shut off</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default MapPageMenu;
