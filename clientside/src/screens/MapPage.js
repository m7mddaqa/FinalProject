import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Keyboard, Linking, Alert, Image, ActivityIndicator } from 'react-native';
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


    // // TODO LATER: add event to the map
    // const handleReport = (type) => {
    //     switch (type) {
    //         case 'Traffic Jam':
    //             // do something
    //             break;
    //         case 'Police':
    //             // do something else
    //             break;
    //         default:
    //             console.log(`Reported: ${type}`);
    //     }
    // };

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
            //fetch directions from Google Maps API https://developers.google.com/maps/documentation/directions/get-directions
            const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${googleMapsApiKey}&region=il`);
            //turns the google res into json
            const data = await res.json();
            if (data.routes?.length) {
                // [New] store full route polyline for off-route detection
                const encodedPolyline = data.routes[0].overview_polyline?.points;
                if (encodedPolyline) {
                    const decodedPath = polyline.decode(encodedPolyline);
                    const fullRoute = decodedPath.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
                    setRouteCoordinates(fullRoute);
                }
                //mapping over the steps in the first route and leg
                const steps = data.routes[0].legs[0].steps.map(step => ({
                    instruction: step.html_instructions.replace(/<[^>]*>?/gm, ''),
                    distance: step.distance.text,
                    duration: step.duration.text,
                    //turn left right etc..
                    maneuver: step.maneuver || 'straight',
                    location: {
                        latitude: step.end_location.lat,
                        longitude: step.end_location.lng,
                    }
                }));
                setInstructions(steps);
                setCurrentStepIndex(0);
                Speech.speak(`Let's go! ${steps[0].instruction}`);
            }
            setIsRerouting(false); // [New] done recalculating, hide indicator
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
        //if instructions is empty or origin is null, return
        if (!origin || !instructions.length) return;
        //Location.watchPositionAsync(options, callback), DOC: Location.watchPositionAsync(options, callback)
        const subscription = Location.watchPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation, // [Modified] highest accuracy for navigation
            timeInterval: 1000,         // [Modified] update every 1 second
            distanceInterval: 5,        // [Modified] update every 5 meters
        }, location => {  //location is a callback function
            const currLoc = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            const step = instructions[currentStepIndex];
            setOrigin(currLoc);  //update the Origin
            // [Modified] calculate distance to next step in meters
            const dLat = (step.location.latitude - currLoc.latitude) * 111000;//coords of the difference between user current location and the step location (longitude)
            const dLon = (step.location.longitude - currLoc.longitude) * 111000 * Math.cos(currLoc.latitude * Math.PI / 180); //coords of the difference between user current location and the step location (latitude)
            const distanceToNextStep = Math.sqrt(dLat * dLat + dLon * dLon);//convert distance coords to rough meters
            if (distanceToNextStep < 30 && currentStepIndex < instructions.length - 1) {//if the user is within 30 meters of the step location and there are more steps
                // speak the next step
                const nextStep = instructions[currentStepIndex + 1];
                Speech.speak(getManeuverText(nextStep.maneuver, nextStep.instruction));
                setCurrentStepIndex(prev => prev + 1);
            } else {
                // [Enhanced] Off-route detection using next step distance and route distance
                const offRouteByStep = distanceToNextStep > 80;
                let offRouteByRoute = false;
                if (routeCoordinates.length) {
                    const distanceFromRoute = calculateDistanceToRoute(currLoc, routeCoordinates);
                    offRouteByRoute = distanceFromRoute > 50;
                }
                const now = Date.now();
                if ((offRouteByStep || offRouteByRoute) && !isRerouting && now - lastRerouteTime.current > 10000) {
                    console.log('User off route. Recalculating...');
                    Speech.speak('Recalculating...');
                    setIsRerouting(true);
                    setForceReroute(prev => !prev);
                    lastRerouteTime.current = now; // update last reroute time
                }

            }
        });
        return () => {
            subscription.then(sub => sub.remove()); //when this component unmounts or useEffect re-runs, wait for the subscription to be ready, and then call .remove() to clean it up
        };
    }, [instructions, currentStepIndex]);

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
                                Keyboard.dismiss();
                            }
                        }}
                        query={{
                            key: googleMapsApiKey,
                            language: 'en',
                            location: '31.7683,35.2137',
                            radius: 100000,
                        }}
                        styles={{
                            container: styles.searchContainer,
                            textInput: styles.searchInput,
                            listView: styles.searchList,
                        }}
                    />
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
                    <Text style={styles.heading}>Next Step:</Text>
                    <View style={styles.stepRow}>
                        {getManeuverIcon(instructions[currentStepIndex]?.maneuver)}
                        <Text style={styles.stepText}>
                            {getManeuverText(instructions[currentStepIndex]?.maneuver, instructions[currentStepIndex]?.instruction)} – {instructions[currentStepIndex]?.distance}
                        </Text>
                        {destination && !isMenuVisible && (
                            <TouchableOpacity style={styles.cancelButton} onPress={() => cancelRide(setDestination, setInstructions, setCurrentStepIndex)}>
                                <MaterialIcons name="cancel" size={24} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
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
        </View>
    );
};

export default NavigationPage;