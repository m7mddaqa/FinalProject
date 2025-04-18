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
import MapPageMenu from './MapPageMenu.js';
import StepsBar from './MapPageStepsBar.js';
import SearchBar from './MapPageSearchaBar.js';
import ReportPanel from './MapPageReportPanel.js';
import VolunteerPanel from './MapPageVolounteerPanel.js';
import { cancelRide, getManeuverIcon, handleRecenter, renderHistoryItem, handleMenuToggle, getManeuverText, calculateDistanceToRoute, handleReport, saveSearchToHistory, fetchSearchHistory } from '../services/driveHelpers';

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
    const [routeCoordinates, setRouteCoordinates] = useState([]); //full route polyline coordinates
    const [isRerouting, setIsRerouting] = useState(false); //rerouting in progress flag
    const [forceReroute, setForceReroute] = useState(false); //toggle state to force rerouting
    const lastRerouteTime = useRef(Date.now()); //track last reroute time
    const [searchHistory, setSearchHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isVolunteerUser, setIsVolunteerUser] = useState(false);
    const [showVolunteerPanel, setShowVolunteerPanel] = useState(false);
    const [volunteerReports, setVolunteerReports] = useState([]);
    const [isOffRoute, setIsOffRoute] = useState(false);
    const [showAllSteps, setShowAllSteps] = useState(false);
    const [eta, setEta] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInternationalSearch, setIsInternationalSearch] = useState(false);

    //functions:

    const handleAddEvent = () => {
        setShowReportPanel(prev => !prev);
    };


    //opening menu function + animation
    const handleMenu = () => {
        handleMenuToggle(isMenuVisible, slideAnim, setIsMenuVisible);
    };



    //useEffects:

    //check if token exists
    useEffect(() => {
        (async () => {
            const token = await isLoggedIn();
            if (!token) navigation.replace('Home');
            setIsCheckingToken(false);
        })();
    }, []);


    //fetch search history when component mounts
    useEffect(() => {
        const loadHistory = async () => {
            const history = await fetchSearchHistory();
            setSearchHistory(history);
        };
        loadHistory();
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

                    //log detailed route information
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
    }, [destination, forceReroute]); //include forceReroute to allow re-fetch

    useEffect(() => {
        if (!destination) {
            //clear route data when destination is removed (cancel navigation)
            setRouteCoordinates([]);
            setIsRerouting(false);
        }
    }, [destination]);

    //track user progress and handle rerouting
    useEffect(() => {
        if (!origin || !instructions.length) return;

        let subscription = null;

        const setupLocationTracking = async () => {
            try {
                subscription = await Location.watchPositionAsync({
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

                    //calculate distance to next step in meters
                    const dLat = (step.endLocation.lat - currLoc.latitude) * 111000;
                    const dLon = (step.endLocation.lng - currLoc.longitude) * 111000 * Math.cos(currLoc.latitude * Math.PI / 180);
                    const distanceToNextStep = Math.sqrt(dLat * dLat + dLon * dLon);

                    //only check for off-route if we're not very close to the next step
                    if (distanceToNextStep > 30) {
                        const offRouteByStep = distanceToNextStep > 150; // Increased threshold
                        let offRouteByRoute = false;

                        if (routeCoordinates.length) {
                            const distanceFromRoute = calculateDistanceToRoute(currLoc, routeCoordinates);
                            offRouteByRoute = distanceFromRoute > 100; // Increased threshold
                        }

                        const now = Date.now();
                        //only reroute if we're significantly off route and haven't rerouted recently
                        if ((offRouteByStep || offRouteByRoute) && !isRerouting && now - lastRerouteTime.current > 30000) { // Increased cooldown to 30 seconds
                            console.log('User off route. Recalculating...');
                            Speech.speak('Recalculating...');
                            setIsRerouting(true);
                            setForceReroute(prev => !prev);
                            lastRerouteTime.current = now;
                        }
                    }

                    //move to next step if close enough
                    if (distanceToNextStep < 30 && currentStepIndex < instructions.length - 1) {
                        const nextStep = instructions[currentStepIndex + 1];
                        Speech.speak(getManeuverText(nextStep.maneuver, nextStep.instruction));
                        setCurrentStepIndex(prev => prev + 1);
                    }
                });
            } catch (error) {
                console.error('Error setting up location tracking:', error);
            }
        };

        setupLocationTracking();

        return () => {
            if (subscription && typeof subscription.remove === 'function') {
                subscription.remove();
            }
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

    //add this function to check if user is off route
    const checkRouteDeviation = async () => {
        if (!origin || !routeCoordinates.length) return;

        try {
            const { coords } = await Location.getCurrentPositionAsync({});
            const distance = calculateDistanceToRoute(
                { latitude: coords.latitude, longitude: coords.longitude },
                routeCoordinates
            );

            //if more than 50 meters from route, consider it a wrong turn
            const isDeviated = distance > 50;
            setIsOffRoute(isDeviated);

            if (isDeviated) {
                Alert.alert(
                    "Wrong Turn Detected",
                    "You have deviated from the route. Recalculating...",
                    [{ text: "OK" }]
                );
                //trigger rerouting
                setForceReroute(true);
            }
        } catch (error) {
            console.error("Error checking route deviation:", error);
        }
    };

    //add this useEffect to periodically check route deviation
    useEffect(() => {
        const interval = setInterval(() => {
            if (instructions.length > 0) {
                checkRouteDeviation();
            }
        }, 5000); //check every 5 seconds

        return () => clearInterval(interval);
    }, [instructions, routeCoordinates]);



    //add this function to calculate ETA
    const calculateETA = (steps, currentIndex) => {
        if (!steps || steps.length === 0) return null;

        //sum up remaining durations from current step onwards
        const totalSeconds = steps.slice(currentIndex).reduce((sum, step) => sum + step.duration, 0);

        //calculate arrival time
        const now = new Date();
        const arrivalTime = new Date(now.getTime() + totalSeconds * 1000);

        //format as HH:MM
        const formattedTime = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        //calculate remaining time in hours and minutes
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

    //update ETA when steps or current step changes
    useEffect(() => {
        if (instructions.length > 0) {
            setEta(calculateETA(instructions, currentStepIndex));
        }
    }, [instructions, currentStepIndex]);

    const handleSearchTextChange = (text) => {
        setSearchQuery(text);
        //check if the text contains a country name or major international city
        const internationalKeywords = [
            'egypt', 'cairo', 'usa', 'new york', 'london', 'paris',
            'rome', 'berlin', 'madrid', 'tokyo', 'dubai', 'country'
        ];
        const isInternational = internationalKeywords.some(keyword =>
            text.toLowerCase().includes(keyword)
        );
        setIsInternationalSearch(isInternational);
    };


    // Conditional rendering: show loading screen
    if (isCheckingToken) {
        return (
            <View>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // Conditional rendering: block app if location permission is not granted
    if (!isLocationPermissionGranted.current) {
        return (
            <View>
                <Text></Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Logout Button */}
            <LogoutButton />

            {/* 🔍 Search Input + History */}
            <SearchBar
                handleSearchTextChange={handleSearchTextChange}
                isMenuVisible={isMenuVisible}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchHistory={searchHistory}
                setSearchHistory={setSearchHistory}
                setDestination={setDestination}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                fetchSearchHistory={fetchSearchHistory}
                isInternationalSearch={isInternationalSearch}
            />

            {/* 🗺️ Map View */}
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
                    {/* 📍 Destination Marker */}
                    {destination && <Marker coordinate={destination} title="Destination" />}

                    {/* ➡️ Route Directions */}
                    {origin && destination && (
                        <MapViewDirections
                            origin={origin}
                            destination={destination}
                            apikey={googleMapsApiKey}
                            strokeWidth={4}
                            strokeColor="blue"
                            onReady={(result) => {
                                mapRef.current?.fitToCoordinates(result.coordinates, {
                                    edgePadding: { top: 80, right: 50, bottom: 50, left: 50 },
                                });
                            }}
                        />
                    )}
                </MapView>
            )}

            {/* ☰ Menu Button */}
            {!isMenuVisible && (
                <TouchableOpacity style={styles.menu} onPress={handleMenu}>
                    <Entypo name="menu" size={24} color="black" />
                </TouchableOpacity>
            )}

            {/* 📂 Slide-out Menu Panel */}
            <MapPageMenu
                slideAnim={slideAnim}
                handleMenu={handleMenu}
                navigation={navigation}
                setDestination={setDestination}
                setInstructions={setInstructions}
                setCurrentStepIndex={setCurrentStepIndex}
            />

            {/* 📍 Recenter Button */}
            {!isMenuVisible && (
                <TouchableOpacity
                    style={styles.recenterButton}
                    onPress={() => handleRecenter(setOrigin, setMapRegion)}
                >
                    <MaterialIcons name="gps-fixed" size={24} color="black" />
                </TouchableOpacity>
            )}

            {/* 🧭 Navigation Steps Bar */}
            <StepsBar
                instructions={instructions}
                currentStepIndex={currentStepIndex}
                eta={eta}
                showAllSteps={showAllSteps}
                setShowAllSteps={setShowAllSteps}
                destination={destination}
                isMenuVisible={isMenuVisible}
                setDestination={setDestination}
                setInstructions={setInstructions}
                setCurrentStepIndex={setCurrentStepIndex}
            />

            {/* ➕ Add Event Button */}
            {!isMenuVisible && (
                <TouchableOpacity onPress={handleAddEvent} style={styles.addEventButton}>
                    <Image
                        source={require('../images/add_new_event_to_map.webp')}
                        style={styles.addEventIcon}
                    />
                </TouchableOpacity>
            )}

            {/* 🚨 Report Panel */}
            {showReportPanel && (
                <ReportPanel setShowReportPanel={setShowReportPanel} />
            )}

            {/* 🔄 Rerouting Indicator */}
            {isRerouting && (
                <View style={{
                    position: 'absolute',
                    top: 80,
                    alignSelf: 'center',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    padding: 8,
                    borderRadius: 5,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}>
                    <ActivityIndicator size="small" color="#000" />
                    <Text style={{ marginLeft: 5, fontWeight: 'bold' }}>Recalculating...</Text>
                </View>
            )}

            {/* 🆘 Volunteer Button */}
            {isVolunteerUser && (
                <TouchableOpacity
                    style={styles.volunteerButton}
                    onPress={handleVolunteerPanel}
                >
                    <MaterialCommunityIcons name="account-group" size={24} color="white" />
                </TouchableOpacity>
            )}

            {/* 👥 Volunteer Dashboard Panel */}
            {showVolunteerPanel && (
                <VolunteerPanel
                    volunteerReports={volunteerReports}
                    handleResolveReport={handleResolveReport}
                />
            )}
        </View>
    );

};

export default NavigationPage;