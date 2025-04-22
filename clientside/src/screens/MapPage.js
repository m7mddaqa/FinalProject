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
import { isVolunteer } from '../services/userTypeService';
import MapPageMenu from './MapPageMenu.js';
import StepsBar from './MapPageStepsBar.js';
import SearchBar from './MapPageSearchaBar.js';
import ReportPanel from './MapPageReportPanel.js';
import VolunteerPanel from './MapPageVolounteerPanel.js';
import { io } from 'socket.io-client';

import {fetchVolunteerReports, calculateETA, cancelRide, getManeuverIcon, handleRecenter, renderHistoryItem, handleMenuToggle, getManeuverText, calculateDistanceToRoute, handleReport, saveSearchToHistory, fetchSearchHistory } from '../services/driveHelpers';

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
    const [searchHistory, setSearchHistory] = useState([]); //fetches and saves search history
    const [showHistory, setShowHistory] = useState(false); //boolean value to show/hide search history
    const [isVolunteerUser, setIsVolunteerUser] = useState(false); //check if the user is a volunteer
    const [showVolunteerPanel, setShowVolunteerPanel] = useState(false); //volunteer dashboard panel + checks if the panel is opened
    const [volunteerReports, setVolunteerReports] = useState([]); //fetches and saves reports
    const [isOffRoute, setIsOffRoute] = useState(false); //check if the user is off route
    const [showAllSteps, setShowAllSteps] = useState(false); //boolean value to show/hide all steps for user's trip
    const [eta, setEta] = useState(null); //ETA calculation
    const [searchQuery, setSearchQuery] = useState(''); //search query for autocomplete
    const [isInternationalSearch, setIsInternationalSearch] = useState(false);
    const [isStepsBar, setIsStepsBar] = useState(false); //boolean value to check whether steps bar is opened or not
    const [events, setEvents] = useState([]); // Add this new state for events

    // Add useEffect to update isStepsBar state
    useEffect(() => {
        setIsStepsBar(instructions.length > 0 || showAllSteps);
    }, [instructions, showAllSteps]);

    //functions:

    const handleAddEvent = () => {
        setShowReportPanel(prev => !prev);
    };


    //opening menu function + animation
    const handleMenu = () => {
        handleMenuToggle(isMenuVisible, slideAnim, setIsMenuVisible);
    };



    //useEffects:t

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


    // //fetch search history when component mounts
    // useEffect(() => {
    //     const loadHistory = async () => {
    //         const history = await fetchSearchHistory();
    //         setSearchHistory(history);
    //     };
    //     loadHistory();
    // }, []);

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
                //get avoidTolls setting
                const avoidTolls = await AsyncStorage.getItem('avoidTolls');
                const avoidTollsParam = avoidTolls === 'true' ? '&avoid=tolls' : '';

                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${avoidTollsParam}&key=${googleMapsApiKey}`
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
                fetchVolunteerReports(setVolunteerReports);
            }
        };
        checkUserType();
    }, []);

    //optimized refresh mechanism for volunteer dashboard
    useEffect(() => {
        let socket;

        const setupSocket = () => {
            socket = io(URL);
        
            socket.on('connect', () => {
                console.log('Connected to socket server');
            });

            socket.on('newEvent', async () => {
                // Update both map events and volunteer reports
                await fetchEvents();
                if (isVolunteerUser) {
                    await fetchVolunteerReports(setVolunteerReports);
                }
            });

            socket.on('updateReports', async () => {
                // Update both map events and volunteer reports
                await fetchEvents();
                if (isVolunteerUser) {
                    await fetchVolunteerReports(setVolunteerReports);
                }
            });

            socket.on('disconnect', () => {
                console.log('Disconnected from socket server');
            });

            return socket;
        };

        setupSocket();

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [origin, isVolunteerUser]); // Add isVolunteerUser to dependencies

    const handleVolunteerPanel = () => {
        setShowVolunteerPanel(prev => !prev);
    };

    const handleResolveReport = async (reportId) => {
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.put(`${URL}/events/${reportId}/resolve`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            Alert.alert('Success', 'Report marked as resolved');
            fetchVolunteerReports(setVolunteerReports);
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

    // Add this function to fetch events
    const fetchEvents = async () => {
        if (origin) {
            try {
                const response = await axios.get(`${URL}/api/events?latitude=${origin.latitude}&longitude=${origin.longitude}`);
                console.log('Events response:', response.data); // Add logging
                setEvents(response.data);
            } catch (error) {
                console.error('Error fetching events:', error.response?.data || error.message);
            }
        }
    };

    // Add useEffect to fetch events when origin changes
    useEffect(() => {
        fetchEvents();
    }, [origin]);

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
                    followsUserLocation={true}
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

                    {/* Add event markers */}
                    {events.map((event, index) => (
                        <Marker
                            key={event._id || index}
                            coordinate={{
                                latitude: event.location.latitude,
                                longitude: event.location.longitude
                            }}
                            title={event.type}
                            description={`Distance: ${event.distance.toFixed(2)} km`}
                        >
                            <View style={styles.eventMarker}>
                                <MaterialCommunityIcons 
                                    name="alert-circle" 
                                    size={30} 
                                    color="#ff4444"
                                />
                            </View>
                        </Marker>
                    ))}
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
                <TouchableOpacity onPress={handleAddEvent} style={!isStepsBar ? styles.addEventButton : (showAllSteps ? styles.addEventButtonFullStepsBar : styles.addEventButtonStepsBar)}>
                    <Image
                        source={require('../images/add_new_event_to_map.webp')}
                        style={styles.addEventIcon}
                    />
                </TouchableOpacity>
            )}

            {/* 🚨 Report Panel */}
            {(showReportPanel && !isMenuVisible) && (
                <ReportPanel
                setShowReportPanel={setShowReportPanel}
                setVolunteerReports={setVolunteerReports}
                />
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
            {isVolunteerUser && !isMenuVisible && !showVolunteerPanel && (
                <TouchableOpacity
                    style={[
                        !isStepsBar ? styles.volunteerButton : (showAllSteps ? styles.volunteerButtonFullStepsBar : styles.volunteerButtonStepsBar),
                        { backgroundColor: '#E53935' }
                    ]}
                    onPress={handleVolunteerPanel}
                >
                    <MaterialCommunityIcons name="medical-bag" size={40} color="white" style={{ marginLeft: -5, marginTop: -8 }} />
                </TouchableOpacity>
            )}

            {/* 👥 Volunteer Dashboard Panel */}
            {showVolunteerPanel && (
                <VolunteerPanel
                    setShowVolunteerPanel={setShowVolunteerPanel}
                    volunteerReports={volunteerReports}
                    handleResolveReport={handleResolveReport}
                    isMenuVisible={isMenuVisible}
                />
            )}
        </View>
    );

};

export default NavigationPage;