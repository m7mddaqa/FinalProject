import React, { useState, useEffect } from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { styles } from '../styles/MapPageStyle';
import { cancelRide } from '../services/driveHelpers';
import { useTheme } from '../context/ThemeContext';
import { getUserName, isLoggedIn } from '../services/getToken';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MapPageMenu = ({
    slideAnim,
    handleMenu,
    navigation,
    setDestination,
    setInstructions,
    setCurrentStepIndex,
    setSearchHistory,
}) => {
    const { isDarkMode } = useTheme();
    const [userName, setUserName] = useState('User');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = await isLoggedIn();
            setIsAuthenticated(!!token);
            if (token) {
                const name = await getUserName();
                if (name) {
                    setUserName(name);
                }
            }
        };
        checkAuth();
    }, []);

    const themeStyles = {
        menu: isDarkMode ? styles.slidingMenuDark : styles.slidingMenu,
        text: isDarkMode ? styles.menuItemTextDark : styles.menuItemText,
        icon: isDarkMode ? '#FFFFFF' : '#000000',
        profileName: isDarkMode ? styles.profileNameDark : styles.profileName,
        menuItem: isDarkMode ? styles.menuItemDark : styles.menuItem,
        profileSection: isDarkMode ? styles.profileSectionDark : styles.profileSection,
        viewProfileText: isDarkMode ? styles.viewProfileTextDark : styles.viewProfileText,
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

            {/* Profile Section or Login */}
            {isAuthenticated ? (
                <View style={themeStyles.profileSection}>
                    <MaterialIcons name="person" size={50} color={isDarkMode ? "#0A84FF" : "#067ef5"} />
                    <View style={styles.profileText}>
                        <Text style={themeStyles.profileName}>{userName}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ProfilePage')}>
                            <Text style={themeStyles.viewProfileText}>View profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={themeStyles.menuItem}
                    onPress={() => navigation.navigate('LoginPage')}
                >
                    <MaterialIcons name="login" size={24} color={themeStyles.icon} />
                    <Text style={themeStyles.text}>Login</Text>
                </TouchableOpacity>
            )}

            {/* Menu Items */}
            <TouchableOpacity style={themeStyles.menuItem}>
                <MaterialIcons name="schedule" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Plan a drive</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={themeStyles.menuItem}
                onPress={() => navigation.navigate('UsersScoreboard', { setSearchHistory })}
            >
                <MaterialIcons name="emoji-events" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Users scoreboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={themeStyles.menuItem}
                onPress={() => navigation.navigate('VolunteersScoreboard', { setSearchHistory })}
            >
                <MaterialIcons name="leaderboard" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Volunteers scoreboard</Text>
            </TouchableOpacity>


            <TouchableOpacity style={themeStyles.menuItem}>
                <MaterialIcons name="chat" size={24} color={themeStyles.icon} />
                <Text style={themeStyles.text}>Inbox</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={themeStyles.menuItem}
                onPress={() => navigation.navigate('Settings', { setSearchHistory })}
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

            {/* Logout Button */}
            {isAuthenticated && (
                <TouchableOpacity
                    style={themeStyles.menuItem}
                    onPress={async () => {
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('userType');
                        navigation.replace('LoginPage');
                    }}
                >
                    <MaterialIcons name="logout" size={24} color={themeStyles.icon} />
                    <Text style={themeStyles.text}>Logout</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

export default MapPageMenu;
