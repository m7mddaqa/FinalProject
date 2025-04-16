import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Keyboard, Linking, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; //icon for the recenter button
import Entypo from '@expo/vector-icons/Entypo'; //icon for the menu
import Ionicons from '@expo/vector-icons/Ionicons'; //icon for the back button
import Fontisto from '@expo/vector-icons/Fontisto'; //icon for the menu
import { useNavigation } from '@react-navigation/native';
import { styles } from '../styles/MapPageStyle';
import { MapsApiKey } from '@env';
import { isLoggedIn } from '../services/getToken'; //check if the user is logged in
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import polyline from '@mapbox/polyline';
import axios from 'axios';
import { URL } from '@env';
import LogoutButton from './LogoutButton';
import { isVolunteer } from '../services/userTypeService';

import { cancelRide, getManeuverIcon, handleRecenter, getManeuverText, handleMenuToggle, calculateDistanceToRoute } from '../services/driveHelpers';

const googleMapsApiKey = MapsApiKey;

const NavigationPage = () => {
    const [origin, setOrigin] = useState(null); //user current location
    const [destination, setDestination] = useState(null);//destination location
    const [instructions, setInstructions] = useState([]); //array of instructions
    const [currentStepIndex, setCurrentStepIndex] = useState(0);  //current step index
    const [mapRegion, setMapRegion] = useState(null); //map region
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height + 50)).current; //animation value for menu
    const navigation = useNavigation();
    const mapRef = useRef();
    const [isCheckingToken, setIsCheckingToken] = useState(true); //check if token exists
    const isAlertShown = useRef(false); //alert shown state
    const isLocationPermissionGranted = useRef(false); //location permission granted state
    const [refreshFlag, setRefreshFlag] = useState(false); //refresh flag to trigger permission re-check and re-render the page
    const [showReportPanel, setShowReportPanel] = useState(false);//events/reports handling pannel
    const [routeCoordinates, setRouteCoordinates] = useState([]);    // [New] full route polyline coordinates
    const [isRerouting, setIsRerouting] = useState(false);          // [New] rerouting in progress flag
    const [forceReroute, setForceReroute] = useState(false);        // [New] toggle state to force rerouting
    const lastRerouteTime = useRef(Date.now()); // [NEW] track last reroute time
    const [searchHistory, setSearchHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isVolunteerUser, setIsVolunteerUser] = useState(false);
    const [showVolunteerPanel, setShowVolunteerPanel] = useState(false);
    const [volunteerReports, setVolunteerReports] = useState([]);
    const [showDebugInfo, setShowDebugInfo] = useState(false);
    const [currentDistance, setCurrentDistance] = useState(0);
    const [nextStepDistance, setNextStepDistance] = useState(0);
    const [isOffRoute, setIsOffRoute] = useState(false);
    const [showAllSteps, setShowAllSteps] = useState(false);
    const [eta, setEta] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInternationalSearch, setIsInternationalSearch] = useState(false);

    //functions:

    const handleAddEvent = () => {
        setShowReportPanel(prev => !prev);
    };

    const handleReport = async (type) => {
        try {
            const { coords } = await Location.getCurrentPositionAsync({});
            const token = await AsyncStorage.getItem('token'); // Get token from storage

            await axios.post(`${URL}/api/events`, {
                type,
                location: {
                    latitude: coords.latitude,
                    longitude: coords.longitude
                }
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            Alert.alert("Reported", `You reported: ${type}`);
            setShowReportPanel(false);
        } catch (error) {
            console.error("Failed to report event:", error);
            Alert.alert("Error", "Failed to report event");
        }
    };

    //opening menu function + animation
    const handleMenu = () => {
        handleMenuToggle(isMenuVisible, slideAnim, setIsMenuVisible);
    };

    // Function to save search to history
    const saveSearchToHistory = async (query, location) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                return;
            }

            const response = await axios.post(
                `${URL}/api/search-history`,
                {
                    searchQuery: query,
                    location: {
                        latitude: location.lat,
                        longitude: location.lng
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200 || response.status === 201) {
                // Update local search history state
                const updatedHistory = await fetchSearchHistory();
                // Remove duplicates and sort by timestamp
                const uniqueHistory = updatedHistory.reduce((acc, current) => {
                    const x = acc.find(item => item.searchQuery === current.searchQuery);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        // If duplicate found, keep the one with the most recent timestamp
                        const existingIndex = acc.findIndex(item => item.searchQuery === current.searchQuery);
                        if (new Date(current.timestamp) > new Date(acc[existingIndex].timestamp)) {
                            acc[existingIndex] = current;
                        }
                        return acc;
                    }
                }, []);
                setSearchHistory(uniqueHistory);
            }
        } catch (error) {
            console.error('Error saving search history:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
        }
    };

    // Function to fetch search history
    const fetchSearchHistory = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                return [];
            }

            const response = await axios.get(
                `${URL}/api/search-history`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // Remove duplicates and sort by timestamp
                const uniqueHistory = response.data.reduce((acc, current) => {
                    const x = acc.find(item => item.searchQuery === current.searchQuery);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        // If duplicate found, keep the one with the most recent timestamp
                        const existingIndex = acc.findIndex(item => item.searchQuery === current.searchQuery);
                        if (new Date(current.timestamp) > new Date(acc[existingIndex].timestamp)) {
                            acc[existingIndex] = current;
                        }
                        return acc;
                    }
                }, []);
                return uniqueHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
            return [];
        } catch (error) {
            console.error('Error fetching search history:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
            return [];
        }
    };

    // Fetch search history when component mounts
    useEffect(() => {
        const loadHistory = async () => {
            const history = await fetchSearchHistory();
            setSearchHistory(history);
        };
        loadHistory();
    }, []);

    // Custom render function for search history items
    const renderHistoryItem = (item) => ({
        description: item.searchQuery,
        geometry: {
            location: {
                lat: item.location.latitude,
                lng: item.location.longitude
            }
        }
    });

    //useEffects:

    //check if token exists
    useEffect(() => {
        (async () => {
            const token = await isLoggedIn();
            if (!token) navigation.replace('Home');
            setIsCheckingToken(false);
        })();
    }, []);

    //check and get location permission
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (!isAlertShown.current) {
                    isAlertShown.current = true;
                    isLocationPermissionGranted.current = false;
                    Alert.alert(
                        'Location Permission Required',
                        'Please enable location access in your settings.',
                        [
                            {
                                text: 'Go to Settings',
                                onPress: async () => {
                                    isAlertShown.current = false;
                                    Linking.openURL('app-settings:');
                                    setRefreshFlag(prev => !prev);
                                },
                            },
                            {
                                text: 'Cancel',
                                style: 'cancel',
                                onPress: () => {
                                    setRefreshFlag(prev => !prev);
                                    isAlertShown.current = false;
                                }
                            },
                        ]
                    );
                }
            } else if (status === 'granted') {
                isLocationPermissionGranted.current = true;
                handleRecenter(setOrigin, setMapRegion);
            }
        })();
    }, [refreshFlag]);

    //set the steps of the first leg of the first route
    //TO-DO later: avoid tolls documentation: https://developers.google.com/maps/documentation/directions/get-directions#avoid
    //fetch directions for a new destination or forced reroute
    useEffect(() => {
        if (!origin || !destination) return;
        const fetchDirections = async () => {
            try {
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${googleMapsApiKey}`
                );
                const data = await response.json();

                if (data.routes.length > 0) {
                    const route = data.routes[0];
                    const points = polyline.decode(route.overview_polyline.points);
                    const routeCoords = points.map(point => ({
                        latitude: point[0],
                        longitude: point[1]
                    }));
                    setRouteCoordinates(routeCoords);

                    const steps = route.legs[0].steps.map(step => ({
                        distance: step.distance.value,
                        duration: step.duration.value,
                        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                        maneuver: step.maneuver,
                        startLocation: step.start_location,
                        endLocation: step.end_location
                    }));
                    setInstructions(steps);
                    setCurrentStepIndex(0);

                    // Log detailed route information
                    console.log('Route Details:', {
                        totalDistance: route.legs[0].distance.text,
                        totalDuration: route.legs[0].duration.text,
                        numberOfSteps: steps.length,
                        steps: steps.map(step => ({
                            instruction: step.instruction,
                            distance: step.distance,
                            maneuver: step.maneuver
                        }))
                    });
                }
            } catch (error) {
                console.error('Error fetching directions:', error);
            }
        };
        fetchDirections();
    }, [destination, forceReroute]); // [Modified] include forceReroute to allow re-fetch

    useEffect(() => {
        if (!destination) {
            // [New] Clear route data when destination is removed (cancel navigation)
            setRouteCoordinates([]);
            setIsRerouting(false);
        }
    }, [destination]);

    //track user progress and handle rerouting
    useEffect(() => {
        if (!origin || !instructions.length) return;
        
        const subscription = Location.watchPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 5,
        }, location => {
            const currLoc = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            const step = instructions[currentStepIndex];
            setOrigin(currLoc);

            // Calculate distance to next step in meters
            const dLat = (step.endLocation.lat - currLoc.latitude) * 111000;
            const dLon = (step.endLocation.lng - currLoc.longitude) * 111000 * Math.cos(currLoc.latitude * Math.PI / 180);
            const distanceToNextStep = Math.sqrt(dLat * dLat + dLon * dLon);

            // Only check for off-route if we're not very close to the next step
            if (distanceToNextStep > 30) {
                const offRouteByStep = distanceToNextStep > 150; // Increased threshold
                let offRouteByRoute = false;
                
                if (routeCoordinates.length) {
                    const distanceFromRoute = calculateDistanceToRoute(currLoc, routeCoordinates);
                    offRouteByRoute = distanceFromRoute > 100; // Increased threshold
                }

                const now = Date.now();
                // Only reroute if we're significantly off route and haven't rerouted recently
                if ((offRouteByStep || offRouteByRoute) && !isRerouting && now - lastRerouteTime.current > 30000) { // Increased cooldown to 30 seconds
                    console.log('User off route. Recalculating...');
                    Speech.speak('Recalculating...');
                    setIsRerouting(true);
                    setForceReroute(prev => !prev);
                    lastRerouteTime.current = now;
                }
            }

            // Move to next step if close enough
            if (distanceToNextStep < 30 && currentStepIndex < instructions.length - 1) {
                const nextStep = instructions[currentStepIndex + 1];
                Speech.speak(getManeuverText(nextStep.maneuver, nextStep.instruction));
                setCurrentStepIndex(prev => prev + 1);
            }
        });

        return () => {
            subscription.then(sub => sub.remove());
        };
    }, [instructions, currentStepIndex]);

    useEffect(() => {
        const checkUserType = async () => {
            console.log('Checking user type...');
            const volunteerStatus = await isVolunteer();
            console.log('Volunteer status:', volunteerStatus);
            setIsVolunteerUser(volunteerStatus);
            if (volunteerStatus) {
                console.log('Fetching volunteer reports...');
                fetchVolunteerReports();
            }
        };
        checkUserType();
    }, []);

    const fetchVolunteerReports = async () => {
        try {
            console.log('Attempting to fetch reports...');
            const token = await AsyncStorage.getItem('token');
            console.log('Token exists:', !!token);
            const response = await axios.get(`${URL}/api/events`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Reports fetched:', response.data);
            setVolunteerReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    const handleVolunteerPanel = () => {
        setShowVolunteerPanel(prev => !prev);
    };

    const handleResolveReport = async (reportId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${URL}/api/events/${reportId}/resolve`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            Alert.alert('Success', 'Report marked as resolved');
            fetchVolunteerReports();
        } catch (error) {
            console.error('Error resolving report:', error);
            Alert.alert('Error', 'Failed to resolve report');
        }
    };

    // Add this function to check if user is off route
    const checkRouteDeviation = async () => {
        if (!origin || !routeCoordinates.length) return;

        try {
            const { coords } = await Location.getCurrentPositionAsync({});
            const distance = calculateDistanceToRoute(
                { latitude: coords.latitude, longitude: coords.longitude },
                routeCoordinates
            );
            
            // If more than 50 meters from route, consider it a wrong turn
            const isDeviated = distance > 50;
            setIsOffRoute(isDeviated);
            
            if (isDeviated) {
                Alert.alert(
                    "Wrong Turn Detected",
                    "You have deviated from the route. Recalculating...",
                    [{ text: "OK" }]
                );
                // Trigger rerouting
                setForceReroute(true);
            }
        } catch (error) {
            console.error("Error checking route deviation:", error);
        }
    };

    // Add this useEffect to periodically check route deviation
    useEffect(() => {
        const interval = setInterval(() => {
            if (instructions.length > 0) {
                checkRouteDeviation();
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [instructions, routeCoordinates]);

    // Modify the fetchDirections function to include more debug info
    const fetchDirections = async () => {
        try {
            if (!origin || !destination) return;

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${googleMapsApiKey}`
            );
            const data = await response.json();

            if (data.routes.length > 0) {
                const route = data.routes[0];
                const points = polyline.decode(route.overview_polyline.points);
                const routeCoords = points.map(point => ({
                    latitude: point[0],
                    longitude: point[1]
                }));
                setRouteCoordinates(routeCoords);

                const steps = route.legs[0].steps.map(step => ({
                    distance: step.distance.value,
                    duration: step.duration.value,
                    instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                    maneuver: step.maneuver,
                    startLocation: step.start_location,
                    endLocation: step.end_location
                }));
                setInstructions(steps);
                setCurrentStepIndex(0);

                // Log detailed route information
                console.log('Route Details:', {
                    totalDistance: route.legs[0].distance.text,
                    totalDuration: route.legs[0].duration.text,
                    numberOfSteps: steps.length,
                    steps: steps.map(step => ({
                        instruction: step.instruction,
                        distance: step.distance,
                        maneuver: step.maneuver
                    }))
                });
            }
        } catch (error) {
            console.error('Error fetching directions:', error);
        }
    };

    // Add this function to calculate ETA
    const calculateETA = (steps, currentIndex) => {
        if (!steps || steps.length === 0) return null;
        
        // Sum up remaining durations from current step onwards
        const totalSeconds = steps.slice(currentIndex).reduce((sum, step) => sum + step.duration, 0);
        
        // Calculate arrival time
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + totalSeconds * 1000);
        
        // Format as HH:MM
        const formattedTime = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Calculate remaining time in hours and minutes
        const totalMinutes = Math.ceil(totalSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        let remainingTimeText = '';
        if (hours > 0) {
            remainingTimeText = `${hours} hour${hours > 1 ? 's' : ''}`;
            if (minutes > 0) {
                remainingTimeText += ` ${minutes} min`;
            }
        } else {
            remainingTimeText = `${minutes} min`;
        }
        
        return {
            arrivalTime: formattedTime,
            remainingTime: remainingTimeText
        };
    };

    // Update ETA when steps or current step changes
    useEffect(() => {
        if (instructions.length > 0) {
            setEta(calculateETA(instructions, currentStepIndex));
        }
    }, [instructions, currentStepIndex]);

    const handleSearchTextChange = (text) => {
        setSearchQuery(text);
        // Check if the text contains a country name or major international city
        const internationalKeywords = [
            'egypt', 'cairo', 'usa', 'new york', 'london', 'paris', 
            'rome', 'berlin', 'madrid', 'tokyo', 'dubai', 'country'
        ];
        const isInternational = internationalKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );
        setIsInternationalSearch(isInternational);
    };

    // rendering:
    if (isCheckingToken) {
        return (
            <View>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }
    if (!isLocationPermissionGranted.current) {
        return (
            <View>
                <Text></Text>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <LogoutButton />
            {/* Google Search Input */}
            {!isMenuVisible && (
                <View style={StyleSheet.absoluteFill}>
                    <GooglePlacesAutocomplete
                        placeholder="Search for a destination"
                        fetchDetails
                        onPress={(data, details = null) => {
                            if (details) {
                                const loc = details.geometry.location;
                                setDestination({
                                    latitude: loc.lat,
                                    longitude: loc.lng,
                                });
                                saveSearchToHistory(data.description, loc);
                                Keyboard.dismiss();
                            }
                        }}
                        query={{
                            key: googleMapsApiKey,
                            language: 'en',
                            location: '31.7683,35.2137',
                            radius: 100000,
                            components: isInternationalSearch ? undefined : 'country:il',
                            types: ['address', 'establishment', 'geocode'],
                        }}
                        styles={{
                            container: styles.searchContainer,
                            textInput: styles.searchInput,
                            listView: styles.searchList,
                        }}
                        predefinedPlaces={searchHistory.slice(0, 6).map(renderHistoryItem)}
                        renderRow={(data, index) => {
                            const isHistoryItem = searchHistory.some(
                                item => item.searchQuery === data.description
                            );
                            return (
                                <View style={[
                                    styles.suggestionRow,
                                    isHistoryItem && styles.historySuggestionRow
                                ]}>
                                    {isHistoryItem && (
                                        <MaterialIcons 
                                            name="history" 
                                            size={20} 
                                            color="#666" 
                                            style={styles.historyIcon}
                                        />
                                    )}
                                    <Text style={[
                                        styles.suggestionText,
                                        isHistoryItem && styles.historySuggestionText
                                    ]}>
                                        {data.description}
                                    </Text>
                                </View>
                            );
                        }}
                        listViewDisplayed="auto"
                        minLength={3}
                        enablePoweredByContainer={false}
                        debounce={200}
                        filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']}
                        renderDescription={(row) => row.description}
                        onFail={(error) => console.error(error)}
                        requestUrl={{
                            url: 'https://maps.googleapis.com/maps/api',
                            useOnPlatform: 'web',
                        }}
                        nearbyPlacesAPI="GooglePlacesSearch"
                        GooglePlacesSearchQuery={{
                            rankby: 'distance',
                        }}
                        GooglePlacesDetailsQuery={{
                            fields: 'formatted_address,geometry',
                        }}
                        maxResults={6}
                        textInputProps={{
                            onChangeText: handleSearchTextChange
                        }}
                    />
                    <TouchableOpacity 
                        style={styles.historyButton}
                        onPress={() => {
                            setShowHistory(!showHistory);
                            if (!showHistory) {
                                fetchSearchHistory();
                            }
                        }}
                    >
                        <MaterialIcons name="history" size={24} color="black" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Search History Panel */}
            {showHistory && !isMenuVisible && (
                <View style={styles.historyPanel}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Recent Searches</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                            <Text style={styles.closeHistory}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.historyList}>
                        {searchHistory.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.historyItem}
                                onPress={() => {
                                    setDestination({
                                        latitude: item.location.latitude,
                                        longitude: item.location.longitude,
                                    });
                                    setShowHistory(false);
                                }}
                            >
                                <MaterialIcons name="history" size={20} color="gray" />
                                <Text style={styles.historyText}>{item.searchQuery}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Map View */}
            {mapRegion && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    region={mapRegion}
                    showsUserLocation={true}
                    isTrafficEnabled={true}
                    showsMyLocationButton={false}
                    showsCompass={true}
                >
                    {destination && <Marker coordinate={destination} title="Destination" />}
                    {origin && destination && (
                        <MapViewDirections
                            origin={origin}
                            destination={destination}
                            apikey={googleMapsApiKey}
                            strokeWidth={4}
                            strokeColor="blue"
                            onReady={result => {
                                mapRef.current?.fitToCoordinates(result.coordinates, {
                                    edgePadding: { top: 80, right: 50, bottom: 50, left: 50 },
                                });
                            }}
                        />
                    )}
                </MapView>
            )}

            {/* Menu Button */}
            {!isMenuVisible && (
                <TouchableOpacity style={styles.menu} onPress={handleMenu}>
                    <Entypo name="menu" size={24} color="black" />
                </TouchableOpacity>
            )}

            {/* Sliding Menu */}
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

                <TouchableOpacity style={styles.menuItem} onPress={() => cancelRide(setDestination, setInstructions, setCurrentStepIndex, true)}>
                    <Ionicons name="power-outline" size={24} color="white" />
                    <Text style={styles.menuItemText}>Shut off</Text>
                </TouchableOpacity>
            </Animated.View>

            {!isMenuVisible && (
                <TouchableOpacity style={styles.recenterButton} onPress={() => handleRecenter(setOrigin, setMapRegion)}>
                    <MaterialIcons name="gps-fixed" size={24} color="black" />
                </TouchableOpacity>
            )}

            {/* Voice Step Feedback */}
            {instructions.length > 0 && !isMenuVisible && (
                <View style={styles.instructionsContainer}>
                    <TouchableOpacity 
                        style={styles.instructionsHeader}
                        onPress={() => setShowAllSteps(!showAllSteps)}
                    >
                        <View style={styles.etaContainer}>
                            <Text style={styles.etaText}>
                                Arrival: {eta?.arrivalTime} ({eta?.remainingTime})
                            </Text>
                        </View>
                        <Text style={styles.heading}>Next Step:</Text>
                        <View style={styles.stepRow}>
                            {getManeuverIcon(instructions[currentStepIndex]?.maneuver)}
                            <Text style={styles.stepText}>
                                {getManeuverText(instructions[currentStepIndex]?.maneuver, instructions[currentStepIndex]?.instruction)} in {instructions[currentStepIndex]?.distance} meters
                            </Text>
                            {destination && !isMenuVisible && (
                                <TouchableOpacity style={styles.cancelButton} onPress={() => cancelRide(setDestination, setInstructions, setCurrentStepIndex)}>
                                    <MaterialIcons name="cancel" size={24} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>
                    
                    {showAllSteps && (
                        <ScrollView 
                            style={styles.allStepsContainer}
                            showsVerticalScrollIndicator={true}
                            nestedScrollEnabled={true}
                        >
                            {instructions.map((step, index) => (
                                <View 
                                    key={index} 
                                    style={[
                                        styles.stepItem,
                                        index === currentStepIndex && styles.currentStepItem
                                    ]}
                                >
                                    <View style={styles.stepIconContainer}>
                                        {getManeuverIcon(step.maneuver)}
                                    </View>
                                    <View style={styles.stepTextContainer}>
                                        <Text style={styles.stepItemText}>
                                            {getManeuverText(step.maneuver, step.instruction)} in {step.distance} meters
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            )}

            {!isMenuVisible && (
                <TouchableOpacity
                    onPress={handleAddEvent}
                    style={styles.addEventButton}
                >
                    <Image
                        source={require('../images/add_new_event_to_map.webp')}
                        style={styles.addEventIcon}
                    />
                </TouchableOpacity>
            )}

            {showReportPanel && (
                <View style={styles.reportPanel}>
                    <View style={styles.reportHeader}>
                        <Text style={styles.reportTitle}>Report</Text>
                        <TouchableOpacity onPress={() => setShowReportPanel(false)}>
                            <Text style={styles.closeReport}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.reportGrid}>
                        {[
                            { icon: '🚗', label: 'Traffic Jam', onPress: () => handleReport('Traffic Jam') },
                            { icon: '👮', label: 'Police', onPress: () => handleReport('Police') },
                            { icon: '💥', label: 'Accident', onPress: () => handleReport('Accident') },
                            { icon: '⚠️', label: 'Hazard', onPress: () => handleReport('Hazard') },
                            { icon: '📷', label: 'Camera', onPress: () => handleReport('Camera') },
                            { icon: '💬', label: 'Map Chat', onPress: () => handleReport('Map Chat') },
                            { icon: '❌', label: 'Map Issue', onPress: () => handleReport('Map Issue') },
                            { icon: '⛽', label: 'Gas Prices', onPress: () => handleReport('Gas Prices') },
                            { icon: '🚧', label: 'Closure', onPress: () => handleReport('Closure') },
                        ]
                            .map((item, index) => (
                                <TouchableOpacity key={index} style={styles.reportItem} onPress={item.onPress}>
                                    <Text style={styles.reportIcon}>{item.icon}</Text>
                                    <Text style={styles.reportLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                    </View>
                </View>
            )}

            {/* [New] Rerouting Indicator UI */}
            {isRerouting && (
                <View style={{ position: 'absolute', top: 80, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.8)', padding: 8, borderRadius: 5, flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={{ marginLeft: 5, fontWeight: 'bold' }}>Recalculating...</Text>
                </View>
            )}

            {isVolunteerUser && (
                <TouchableOpacity 
                    style={styles.volunteerButton}
                    onPress={handleVolunteerPanel}
                >
                    <MaterialCommunityIcons name="account-group" size={24} color="white" />
                </TouchableOpacity>
            )}

            {showVolunteerPanel && (
                <View style={styles.volunteerPanel}>
                    <Text style={styles.volunteerTitle}>Volunteer Dashboard</Text>
                    <ScrollView style={styles.volunteerReportsList}>
                        {volunteerReports.map((report) => (
                            <View key={report._id} style={styles.volunteerReportItem}>
                                <Text style={styles.volunteerReportType}>{report.type}</Text>
                                <Text style={styles.volunteerReportLocation}>
                                    Location: {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                                </Text>
                                <Text style={styles.volunteerReportTime}>
                                    Reported: {new Date(report.createdAt).toLocaleString()}
                                </Text>
                                <TouchableOpacity 
                                    style={styles.resolveButton}
                                    onPress={() => handleResolveReport(report._id)}
                                >
                                    <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Debug Information Panel */}
            {showDebugInfo && (
                <View style={styles.debugPanel}>
                    <Text style={styles.debugTitle}>Navigation Debug Info</Text>
                    <Text style={styles.debugText}>
                        Current Step: {instructions[currentStepIndex]?.instruction}
                    </Text>
                    <Text style={styles.debugText}>
                        Distance to Next Step: {nextStepDistance.toFixed(0)} meters
                    </Text>
                    <Text style={styles.debugText}>
                        Total Steps: {instructions.length}
                    </Text>
                    <Text style={styles.debugText}>
                        Current Step Index: {currentStepIndex}
                    </Text>
                    <Text style={[styles.debugText, isOffRoute && styles.offRouteText]}>
                        Status: {isOffRoute ? 'OFF ROUTE' : 'ON ROUTE'}
                    </Text>
                </View>
            )}

            {/* Debug Toggle Button */}
            <TouchableOpacity 
                style={styles.debugButton}
                onPress={() => setShowDebugInfo(!showDebugInfo)}
            >
                <Text style={styles.debugButtonText}>
                    {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default NavigationPage;