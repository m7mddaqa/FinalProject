import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Keyboard, Linking, Alert, Image, ActivityIndicator, ScrollView, Button } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
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
import VolunteerPanel from './MapPageVolunteerPanel.js';
import { io } from 'socket.io-client';
import { useTheme } from '../context/ThemeContext';
import { Platform } from 'react-native';


import { getEventIcon, calculateBearing, incrementArrivedVolunteers, incrementOnWayVolunteers, decrementOnWayVolunteers, fetchVolunteerReports, calculateETA, cancelRide, getManeuverIcon, handleRecenter, renderHistoryItem, handleMenuToggle, getManeuverText, calculateDistanceToRoute, handleReport, saveSearchToHistory, fetchSearchHistory } from '../services/driveHelpers';

const googleMapsApiKey = MapsApiKey;




// Helper function to calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

const NavigationPage = () => {
    const hasShownArrivalAlert = useRef(false);
    const promptedEvents = useRef(new Set()); 
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
    const [events, setEvents] = useState([]); //add this new state for events
    const [userHeading, setUserHeading] = useState(0); //track user's heading/direction
    const [followsUserLocation, setFollowsUserLocation] = useState(false); // Track if map should follow user
    const [isNavigating, setIsNavigating] = useState(false); //add this state to track if navigation is active
    const [isVolunteerOnWay, setIsVolunteerOnWay] = useState(false); //add this state to track if the volunteer is on his way to an event
    const [isHideMarkers, setIsHideMarkers] = useState(false); //add this state to track if the user wants to hide markers of reports/incidients on the map 
    const [cityAlerts, setCityAlerts] = useState([]); // Add state for city alerts
    const pulseAnim = useRef(new Animated.Value(1)).current; // Add animation value for pulsing effect
    const { isDarkMode } = useTheme();
    const route = useRoute();
    const { event, from } = route.params || {};
    const [eventRoute, setEventRoute] = useState(false);
    //new: reference to know if user moved map manually
    const isUserInteracting = useRef(false);
    //new: reference to save last camera center
    const lastCamera = useRef({});

    //functions:

    const handleAddEvent = async () => {
        try {
            const token = await isLoggedIn();
            if (!token) {
                Alert.alert(
                    'You need to be logged in to add a report.',
                    'Please log in to your account.',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.navigate('LoginPage'),
                        },
                        {
                            text: 'Cancel',
                            onPress: () => console.log('cancel adding report'),
                            style: 'cancel',
                        },
                    ],
                    { cancelable: true }
                );
                return;
            }
            setShowVolunteerPanel(false);
            setShowReportPanel(prev => !prev);
        } catch (error) {
            console.error("Error in handleAddEvent:", error);
        }
    };

    //opening menu function + animation
    const handleMenu = () => {
        handleMenuToggle(isMenuVisible, slideAnim, setIsMenuVisible);
    };

    
    //function to start navigation with fixed zoom and map rotation.
    const handleStartNavigation = () => {
        if (isNavigating) return; //guard to prevent repeated starts
        setIsNavigating(true);
        setFollowsUserLocation(true);
        if (origin && mapRef.current) {
            //apply fixed zoom and orientation according to route
            const next = routeCoordinates[1] || origin;
            const initialBearing = calculateBearing(origin, next);
            const cameraConfig = Platform.OS === 'ios'
                ? { center: origin, heading: initialBearing, pitch: 0, altitude: 1000, duration: 700 }
                : { center: origin, heading: initialBearing, pitch: 0, zoom: 20, duration: 700 };
            mapRef.current.animateCamera(cameraConfig);
            lastCamera.current = cameraConfig;
        }
    };

    // Add compass button handler
    const handleCompassPress = () => {
        if (mapRef.current) {
            const cameraConfig = Platform.OS === 'ios'
                ? { heading: 0, pitch: 0, duration: 700 }
                : { heading: 0, pitch: 0, duration: 700 };
            mapRef.current.animateCamera(cameraConfig);
            lastCamera.current = { ...lastCamera.current, ...cameraConfig };
        }
    };

    const handleResolveReport = async (report) => {
    try {
        if (!report || !report._id) {
        console.error('Report object or ID is missing:', report);
        Alert.alert('Error', 'Invalid report data. Please try again.');
        return;
        }

        if (!origin || !origin.latitude || !origin.longitude) {
        console.error('Current location is missing:', origin);
        Alert.alert('Error', 'Unable to get your current location. Please try again.');
        return;
        }

        console.log('Attempting to resolve report:', {
        reportId: report._id,
        reportType: report.type,
        location: report.location,
        volunteerLocation: { latitude: origin.latitude, longitude: origin.longitude },
        });

        const token = await AsyncStorage.getItem('token');
        if (!token) {
        console.error('No authentication token found');
        Alert.alert('Error', 'You must be logged in to resolve reports.');
        return;
        }

        const response = await fetch(`${URL}/api/events/${report._id}/resolve`, {
        method: 'PUT', // Changed to PUT to match backend
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            volunteerLat: origin.latitude,
            volunteerLon: origin.longitude,
        }),
        });

        const data = await response.json();
        console.log('Resolve response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
        if (response.status === 400 && data.message === 'This event has already been resolved') {
            setVolunteerReports((prevReports) =>
            prevReports.map((r) =>
                r._id === report._id ? { ...r, resolved: true } : r
            )
            );
            Alert.alert('Notice', 'This event has already been resolved by other volunteers.');
            return;
        }
        throw new Error(data.message || 'Failed to resolve report');
        }

        const volunteerMessage = data.participatingVolunteers
        .map((v) => `${v.username}: +10 points (New score: ${v.newScore})`)
        .join('\n');
        const reporterMessage = data.reporter
        ? `${data.reporter.username}: +10 points (New score: ${data.reporter.newScore})`
        : 'Unknown: No points awarded (missing reporter data)';

        Alert.alert(
        'Report Resolved',
        `Successfully resolved the report!\n\nParticipating Volunteers:\n${volunteerMessage}\n\nReporter:\n${reporterMessage}`,
        [{ text: 'OK', onPress: () => console.log('Resolution alert dismissed') }]
        );

        setVolunteerReports((prevReports) =>
        prevReports.map((r) =>
            r._id === report._id
            ? { ...r, resolved: true, participatingVolunteers: data.participatingVolunteers }
            : r
        )
        );

        await fetchEvents();
    } catch (error) {
        console.error('Error resolving report:', error);
        Alert.alert(
        'Error',
        error.message || 'Failed to resolve report. Please try again.',
        [{ text: 'OK' }]
        );
    }
    };
    //function to fetch events
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
                console.log("Wrong turn detected. Recalculating route...");
                //trigger rerouting
                setForceReroute(true);
            }
        } catch (error) {
            console.error("Error checking route deviation:", error);
        }
    };


    // ---------------
    // 1) confirmPresence: calls the backend to subtract/add points
    // ---------------
    const confirmPresence = async (eventId, present) => {
    try {
        const response = await axios.put(`${URL}/api/events/${eventId}/confirmPresence`, { present });
        console.log('[INFO] Confirm presence response:', response.data);
        if (response.data.deleted) {
        setEvents((prevEvents) => prevEvents.filter((ev) => ev._id !== eventId));
        } else {
        fetchEvents(); // Refresh events to update points
        }
    } catch (e) {
        console.error('[ERROR] Error in confirmPresence:', e.response?.data || e.message);
        Alert.alert('Error', 'Failed to confirm presence. Please try again.');
    }
    };

    // ---------------
    // 2) handleUserLocationChange: asks if the report is still ongoing
    // ---------------
    const handleUserLocationChange = (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;

        // Update origin if following user location
        if (followsUserLocation) {
            setOrigin({ latitude, longitude });
        }

        // Only ask about "normal" reports if navigating
        if (isNavigating) {
            events.forEach(ev => {
                if (ev.category === 'normal' && !promptedEvents.current.has(ev._id)) {
                    const distKm = calculateDistance(
                        latitude, longitude,
                        ev.location.latitude,
                        ev.location.longitude
                    );
                    if (distKm < 0.05) { // Within 50 meters
                        promptedEvents.current.add(ev._id);
                        Alert.alert(
                            'Is it still there?',
                            `Is the ${ev.type} still there?`,
                            [
                                { text: 'No', onPress: () => confirmPresence(ev._id, false) },
                                { text: 'Yes', onPress: () => confirmPresence(ev._id, true) },
                            ]
                        );
                    }
                }
            });
        }
    };

    //function to fetch the hidemarker choice every time map is focused
    useFocusEffect(
        React.useCallback(() => {
            const getHideMarkers = async () => {
                try {
                    const hideMarkers = await AsyncStorage.getItem('hideMarkers');
                    if (hideMarkers !== null) {
                        setIsHideMarkers(JSON.parse(hideMarkers));
                    }
                } catch (error) {
                    console.error('Error loading settings:', error);
                }
            };

            getHideMarkers();
        }, [])
    );

    //check if token exists
    useEffect(() => {
        (async () => {
            const token = await isLoggedIn();
            if (!token) {
                setIsCheckingToken(false);
            }
        })();
    }, []);

    //add useEffect to update isStepsBar state
    useEffect(() => {
        setIsStepsBar(instructions.length > 0 || showAllSteps);
    }, [instructions, showAllSteps]);

    //fetch search history when component mounts
    useEffect(() => {
        const loadHistory = async () => {
            const history = await fetchSearchHistory();
            setSearchHistory(history);
        };
        loadHistory();
    }, []);

    useEffect(() => {
        const handleGoToLocation = async () => {
            if (from === 'EventDetails' && event) {
                console.log('User came from EventDetails');
                console.log(event);

                //check if the event is still active (could modify later depending on how events are resolved)
                try {
                    const response = await axios.get(`${URL}/api/events/${event._id}/findIfEventActive`);
                    if (!response.data.resolved) {
                        console.log('Event is still active:', response.data);
                    } else {
                        console.warn('Event is resolved.');
                        Alert.alert('Notice', 'This event is no longer active.');
                    }
                } catch (error) {
                    if (error.response?.status === 404) {
                        console.warn('Event not found (404):', error.response.data);
                        Alert.alert('Notice', 'This event no longer exists.');
                    } else {
                        console.error('Error checking if event is active:', error);
                        Alert.alert('Error', 'Could not verify event status.');
                    }
                    return;
                };

                //update the origin in order to the other useEffect to work (responsible for steps bar showing up + finding correcting routes)
                await handleRecenter(setOrigin, setMapRegion);
                //set the destination
                setDestination({
                    latitude: event.location.latitude,
                    longitude: event.location.longitude,
                });

                //usestate variable just to know whether the volunteer is navigating to an event or not, we could use it to change
                //the number of ongoing volunteers in case he cancelled the navigation or if he has arrived, additionally to increment the arrivedVolunteers field
                setIsVolunteerOnWay(true);
                incrementOnWayVolunteers(event._id); //increment the number of ongoing volunteers
                //start navigation to the event location
                handleStartNavigation();
            }
        };
        handleGoToLocation();
    }, [event, from]);

    //set the steps of the first leg of the first route
    //avoid tolls documentation: https://developers.google.com/maps/documentation/directions/get-directions#avoid
    //fetch directions for a new destination or forced reroute
    useEffect(() => {
        console.log("test");
        console.log(`origin: ${origin}`);
        console.log(`destination: ${destination}`);
        if (!origin || !destination) return;
        console.log("test2");
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
    }, [destination, forceReroute, eventRoute]); //include forceReroute to allow re-fetch

    useEffect(() => {
        if (!destination) {
            //clear route data when destination is removed (cancel navigation)
            if (isVolunteerOnWay) {
                decrementOnWayVolunteers(event._id); //decrement the number of ongoing volunteers
                setIsVolunteerOnWay(false);
            }
            setRouteCoordinates([]);
            setIsRerouting(false);
        }
    }, [destination]);

    // Add this function to handle volunteer arrival
    const handleVolunteerArrival = async (eventId) => {
        try {
            const response = await fetch(`${URL}/api/events/${eventId}/arrive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                console.error('Failed to mark volunteer as arrived');
            }
        } catch (error) {
            console.error('Error marking volunteer as arrived:', error);
        }
    };

    // Modify the location tracking useEffect to check for event arrival
    useEffect(() => {
    if (!origin || !instructions.length || !destination) return;

    let subscription = null;
    

    const setupLocationTracking = async () => {
        try {
            subscription = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 1000,
                distanceInterval: 5,
            }, location => {
                // Skip low-accuracy updates
                if (location.coords.accuracy > 20) {
                    console.log('Skipping low accuracy location update:', location.coords.accuracy);
                    return;
                }
                const currLoc = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };
                setOrigin(currLoc);

                // Check if we're near any active events
                if (isVolunteerUser && volunteerReports.length > 0) {
                    volunteerReports.forEach(report => {
                        if (!report.resolved) {
                            const distance = calculateDistance(
                                currLoc.latitude,
                                currLoc.longitude,
                                report.location.latitude,
                                report.location.longitude
                            );
                            if (distance <= 0.05) { // Within 50 meters for events
                                console.log('Volunteer arrived at event:', report._id);
                                handleVolunteerArrival(report._id);
                            }
                        }
                    });
                }

                // Calculate distance to destination in meters
                const distanceToDestination = calculateDistance(
                    currLoc.latitude,
                    currLoc.longitude,
                    destination.latitude,
                    destination.longitude
                ) * 1000; // Convert km to meters

                // Check if user is within 100 meters of the destination
                if (distanceToDestination < 100 && !hasShownArrivalAlert.current) {
                    console.log('You have reached your destination.');
                    Speech.speak('You have arrived at your destination.');
                    
                    // Show on-screen alert
                    Alert.alert(
                        'Arrival',
                        'You have arrived at your destination.',
                        [{ text: 'OK', onPress: () => console.log('Arrival alert dismissed') }]
                    );
                    hasShownArrivalAlert.current = true; // Prevent multiple alerts

                    // Reset navigation states
                    setInstructions([]);
                    setDestination(null);
                    setIsNavigating(false);
                    setFollowsUserLocation(false);
                    setCurrentStepIndex(0);
                    setRouteCoordinates([]);

                    // Reset camera to neutral state
                    if (mapRef.current) {
                        mapRef.current.animateCamera({
                            center: currLoc,
                            heading: 0,
                            pitch: 0,
                            zoom: 16,
                            duration: 700
                        });
                        lastCamera.current = {
                            center: currLoc,
                            heading: 0,
                            pitch: 0,
                            zoom: 16
                        };
                    }

                    // Handle volunteer event arrival
                    if (isVolunteerOnWay && event?._id) {
                        console.log("Incrementing arrived volunteer");
                        incrementArrivedVolunteers(event._id);
                        decrementOnWayVolunteers(event._id);
                        setIsVolunteerOnWay(false);
                    }

                    return; // Exit the location update callback
                }

                // Reset alert flag if navigation restarts
                if (hasShownArrivalAlert.current && instructions.length > 0) {
                    hasShownArrivalAlert.current = false;
                }

                // Calculate distance to next step in meters
                const dLat = (instructions[currentStepIndex].endLocation.lat - currLoc.latitude) * 111000;
                const dLon = (instructions[currentStepIndex].endLocation.lng - currLoc.longitude) * 111000 * Math.cos(currLoc.latitude * Math.PI / 180);
                const distanceToNextStep = Math.sqrt(dLat * dLat + dLon * dLon);

                // Only check for off-route if not very close to the next step
                if (distanceToNextStep > 30) {
                    const offRouteByStep = distanceToNextStep > 150;
                    let offRouteByRoute = false;

                    if (routeCoordinates.length) {
                        const distanceFromRoute = calculateDistanceToRoute(currLoc, routeCoordinates);
                        offRouteByRoute = distanceFromRoute > 100;
                    }

                    const now = Date.now();
                    // Only reroute if significantly off route and haven't rerouted recently
                    if ((offRouteByStep || offRouteByRoute) && !isRerouting && now - lastRerouteTime.current > 30000) {
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
}, [instructions, volunteerReports, isVolunteerUser, destination, event, isVolunteerOnWay]);

    //handling the recenter button outside of navigation mode
    useEffect(() => {
        let watchSub = null; //holds the GPS subscription

        const startTracking = async () => {
            //asks for location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            //start GPS tracking with balanced settings (not too aggressive)
            watchSub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    timeInterval: 3000,                    //max update rate: every 3 seconds
                    distanceInterval: 10,                  //only update if moved 10 meters
                },
                location => {
                    //this function is called whenever location changes
                    const coords = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };
                    setOrigin(coords); //update your state with current position
                }
            );
        };

        startTracking(); //launch tracking on mount

        //clean up when screen unmounts
        return () => {
            if (watchSub) watchSub.remove();
        };
    }, []);

    //unified heading tracking using Location.watchHeadingAsync for both Android and iOS
    useEffect(() => {
        let headingSubscription = null;
        let lastUpdateTime = Date.now();
        let lastHeading = userHeading;

        const setupHeadingTracking = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Location permission required for navigation');
                    return;
                }
                headingSubscription = await Location.watchHeadingAsync(headingData => {
                    const now = Date.now();
                    const newHeading = headingData.trueHeading || headingData.magHeading;
                    const diff = ((newHeading - lastHeading + 540) % 360) - 180;
                    const timeDiff = now - lastUpdateTime;
                    const threshold = timeDiff > 1000 ? 4 : 7;
                    if (Math.abs(diff) > threshold) {
                        const smoothedHeading = (lastHeading + diff * 0.25 + 360) % 360;
                        setUserHeading(smoothedHeading);
                        lastHeading = smoothedHeading;
                        lastUpdateTime = now;
                        if (followsUserLocation && mapRef.current && origin && timeDiff > 250) {
                            const cameraConfig = Platform.OS === 'ios'
                                ? { center: origin, heading: smoothedHeading, pitch: 0, altitude: lastCamera.current.altitude || 1000, duration: 300 }
                                : { center: origin, heading: smoothedHeading, pitch: 0, zoom: lastCamera.current.zoom || 20, duration: 300 };
                            mapRef.current.animateCamera(cameraConfig);
                            lastCamera.current = cameraConfig;
                        }
                    }
                });
            } catch (error) {
                console.error('Error setting up heading tracking:', error);
            }
        };

        if (isNavigating) setupHeadingTracking();
        return () => {
            if (headingSubscription && headingSubscription.remove) headingSubscription.remove();
        };
    }, [isNavigating, followsUserLocation, origin]);

    useEffect(() => {
        if (destination && instructions.length > 0) {
            // Only start navigation once
            if (!isNavigating) handleStartNavigation();
        } else if (isNavigating) {
            // Reset navigation-related state
            setIsNavigating(false);
            setFollowsUserLocation(false);
            promptedEvents.current.clear(); // Clear prompted events
            fetchEvents(); // Refresh events to remove irrelevant ones
        }
    }, [destination, instructions, isNavigating]);

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

    useEffect(() => {
        const checkUserType = async () => {
            const token = await isLoggedIn();
            if (!token) {
                setIsCheckingToken(false);
                setIsVolunteerUser(false);
                return;
            }
            const volunteerStatus = await isVolunteer();
            setIsVolunteerUser(volunteerStatus === true);
            setIsCheckingToken(false);
        };
        checkUserType();
    }, []);

    //optimized refresh mechanism for volunteer dashboard
    useEffect(() => {
    let socket;

    const setupSocket = () => {
        console.log('[SOCKET] Attempting to connect to:', URL);
        socket = io(URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        });

        socket.on('connect', () => {
        console.log('[SOCKET] Connected successfully');
        });

        socket.on('connect_error', (error) => {
        console.error('[SOCKET] Connection error:', error);
        });

        socket.on('test', (data) => {
        console.log('[SOCKET] Test event received:', data);
        });

        socket.on('newEvent', async () => {
        console.log('[SOCKET] Received newEvent');
        await fetchEvents();
        if (isVolunteerUser) {
            await fetchVolunteerReports(setVolunteerReports);
        }
        });

        socket.on('updateReports', async () => {
        console.log('[SOCKET] Received updateReports');
        await fetchEvents();
        if (isVolunteerUser) {
            await fetchVolunteerReports(setVolunteerReports);
        }
        });

        socket.on('eventResolved', async (data) => {
        console.log('[SOCKET] Event resolved:', data);
        setVolunteerReports((prevReports) =>
            prevReports.filter((report) => report._id !== data.eventId)
        );
        await fetchEvents();
        if (isVolunteerUser) {
            await fetchVolunteerReports(setVolunteerReports);
        }
        });

        socket.on('eventDeleted', (data) => {
        console.log('[SOCKET] Event deleted:', data);
        setEvents((prevEvents) => prevEvents.filter((ev) => ev._id !== data.eventId));
        });

        socket.on('cityAlert', (alert) => {
        console.log('[SOCKET] Received city alert:', alert);
        const alertWithId = { ...alert, id: `${alert.city}-${Date.now()}` };
        setCityAlerts((prev) => {
            console.log('[SOCKET] Current alerts:', prev);
            console.log('[SOCKET] Adding new alert:', alertWithId);
            const newAlerts = [...prev, alertWithId];

            if (mapRef.current && newAlerts.length > 0) {
            const coordinates = newAlerts.map((alert) => ({
                latitude: alert.lat,
                longitude: alert.lon,
            }));
            if (origin) {
                coordinates.push(origin);
            }
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
            }

            return newAlerts;
        });
        setTimeout(() => {
            setCityAlerts((prev) => {
            console.log('[SOCKET] Removing alert:', alertWithId.id);
            return prev.filter((a) => a.id !== alertWithId.id);
            });
        }, 60000);
        });

        socket.on('disconnect', (reason) => {
        console.log('[SOCKET] Disconnected:', reason);
        });

        return socket;
    };

    socket = setupSocket();

    return () => {
        if (socket) {
        console.log('[SOCKET] Cleaning up socket connection');
        socket.disconnect();
        }
    };
    }, []);

    const handleVolunteerPanel = () => {
        setShowReportPanel(false); //close report panel first
        setShowVolunteerPanel(prev => !prev);
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

    useEffect(() => {
        if (destination && instructions.length > 0) {
            // only start navigation once
            if (!isNavigating) handleStartNavigation();
        } else {
            // only reset when currently navigating
            if (isNavigating) {
                setIsNavigating(false);
                setFollowsUserLocation(false);
            }
        }
    }, [destination, instructions, isNavigating]);

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

    //useEffect to fetch events when origin changes
    useEffect(() => {
        fetchEvents();
    }, [origin]);

    //periodic refresh for events when volunteer panel is visible
    useEffect(() => {
        let interval;
        if (isVolunteerUser && showVolunteerPanel) {
            //initial fetch
            fetchEvents();
            fetchVolunteerReports(setVolunteerReports);

            //set up interval for periodic refresh
            interval = setInterval(() => {
                fetchEvents();
                fetchVolunteerReports(setVolunteerReports);
            }, 60000); //refresh every minute
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isVolunteerUser, showVolunteerPanel]);

    // Add useEffect for pulsing animation
    useEffect(() => {
        const pulse = Animated.sequence([
            Animated.timing(pulseAnim, {
                toValue: 1.3,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]);

        Animated.loop(pulse).start();
    }, []);

    //conditional rendering: block app if location permission is not granted
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
                setIsInternationalSearch={setIsInternationalSearch}
            />

            {/* 🗺️ Map View */}
            {mapRegion && (
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
                rotateEnabled={true}
                zoomEnabled={true}
                pitchEnabled={true}   // Keeps inclination
                onUserLocationChange={handleUserLocationChange}

                onRegionChangeComplete={(region) => {
                setMapRegion(region);
                }}
                onPanDrag={() => {
                isUserInteracting.current = true;
                }}
                onRegionChange={(region) => {
                if (isUserInteracting.current) {
                    lastCamera.current = {
                    center: { latitude: region.latitude, longitude: region.longitude },
                    heading: region.heading,
                    pitch: region.pitch,
                    zoom: region.zoom
                    };
                }
                }}
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
                            onReady={() => {
                                //avoid zoom out; start navigation with fixed camera
                                handleStartNavigation();
                            }}
                        />
                    )}

                    {/* show events markers */}
                    {!isHideMarkers && events.length > 0 && events.map((event, index) => {
                        if (event.resolved) return null; //skip resolved events
                        return (
                            <Marker
                                key={event._id || index}
                                coordinate={{
                                    latitude: event.location.latitude,
                                    longitude: event.location.longitude
                                }}
                                title={event.type}
                                description={`Distance: ${event.distance.toFixed(2)} km`}
                            >
                                <Image
                                    source={getEventIcon(event.type)}
                                    style={{ width: 35, height: 35 }}
                                    resizeMode="contain"
                                />
                            </Marker>
                        );
                    })}

                    {/*Heading arrow on the user location */}
                    {isNavigating && origin && (
                        <Marker
                            key="navigation-arrow"
                            coordinate={origin}
                            anchor={{ x: 0.5, y: 0.5 }}
                            flat={true}
                            rotation={userHeading}
                        >
                            <MaterialIcons name="navigation" size={36} color="#1976D2" />
                        </Marker>
                    )}

                    {!isHideMarkers && cityAlerts.map((alert) => (
                        <React.Fragment key={`alert-${alert.id}`}>
                            <Circle
                                center={{ latitude: alert.lat, longitude: alert.lon }}
                                radius={5000} // adjust as needed for city size
                                fillColor="rgba(255,0,0,0.3)"
                                strokeColor="red"
                                strokeWidth={2}
                            />
                            <Marker
                                coordinate={{ latitude: alert.lat, longitude: alert.lon }}
                                title={alert.city}
                                description="Alert Area"
                            />
                        </React.Fragment>
                    ))}
                </MapView>
            )}

            {/* ☰ Menu Button */}
            {!isMenuVisible && (
                <TouchableOpacity
                    style={isDarkMode ? styles.menuDark : styles.menu}
                    onPress={handleMenu}
                >
                    <Entypo
                        name="menu"
                        size={24}
                        style={isDarkMode ? styles.menuIconDark : styles.menuIconLight}
                    />
                </TouchableOpacity>
            )}

            {/* 🔄 Recenter Button */}
            {!isMenuVisible && (
                <TouchableOpacity
                    style={isDarkMode ? styles.recenterButtonDark : styles.recenterButton}
                    onPress={async () => {
                        let coords = origin;
                        if (!coords) {
                            const location = await Location.getCurrentPositionAsync({});
                            coords = {
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            };
                            setOrigin(coords);
                        }

                        if (coords && mapRef.current) {
                            mapRef.current.animateCamera({
                                center: coords,
                                zoom: 15,
                                duration: 700,
                            });
                        }
                    }}
                >
                    <MaterialIcons
                        name="my-location"
                        size={24}
                        style={isDarkMode ? styles.recenterIconDark : styles.recenterIconLight}
                    />
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
                setSearchHistory={setSearchHistory}
            />

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
                <TouchableOpacity
                    style={
                        !isStepsBar
                            ? (isDarkMode ? styles.addEventButtonDark : styles.addEventButton)
                            : (showAllSteps
                                ? (isDarkMode ? styles.addEventButtonFullStepsBarDark : styles.addEventButtonFullStepsBar)
                                : (isDarkMode ? styles.addEventButtonStepsBarDark : styles.addEventButtonStepsBar)
                            )
                    }
                    onPress={handleAddEvent}
                >
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
                    showAllSteps={showAllSteps}
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
            {isVolunteerUser && !isMenuVisible && !isCheckingToken && (
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
                        showAllSteps={showAllSteps}
                    />
                    )}

            {/* Add compass button */}
            { !showReportPanel && (
            <TouchableOpacity 
                style={isDarkMode ? styles.compassButtonDark : styles.compassButton}
                onPress={handleCompassPress}
            >
                <MaterialCommunityIcons 
                    name="compass" 
                    size={24} 
                    color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
            </TouchableOpacity>
            )}
        </View>
    );

};

export default NavigationPage;