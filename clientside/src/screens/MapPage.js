import React, { useState, useEffect } from 'react'; //importing React and necessary hooks
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native'; //importing React Native components
import MapView, { Marker } from 'react-native-maps'; //importing MapView and Marker for maps
import MapViewDirections from 'react-native-maps-directions'; //importing MapViewDirections for route calculation
import * as Location from 'expo-location'; //importing Expo location services
import AsyncStorage from '@react-native-async-storage/async-storage'; //importing AsyncStorage for persistent data
import { useNavigation } from '@react-navigation/native'; //importing navigation hook
import { styles } from '../styles/MapPageStyle.js'; //importing custom styles
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; //recenter icon
import Entypo from '@expo/vector-icons/Entypo'; //menu icon
import Ionicons from '@expo/vector-icons/Ionicons'; //menu options icons
import Fontisto from '@expo/vector-icons/Fontisto'; //close button icon
import ProfilePage from './ProfilePage'; //importing ProfilePage component

const googleMapsApiKey = "APIKEY"; //Google Maps API Key

const NavigationPage = (props) => {
    const [origin, setOrigin] = useState(null); //state for user's current location
    const [destination, setDestination] = useState({ //destination coordinates
        latitude: 31.312653,
        longitude: 35.263273,
    });
    const [instructions, setInstructions] = useState([]); //state for navigation instructions
    const [currentStep, setCurrentStep] = useState(null); //state for the current step in directions
    const [isLoggedIn, setIsLoggedIn] = useState(false); //state to check user login status
    const [mapRegion, setMapRegion] = useState({
        latitude: 31.312653,
        longitude: 35.263273,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });


    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const slideAnim = useState(new Animated.Value(Dimensions.get('window').height + 50))[0];

    const calculateDistance = (coord1, coord2) => { //function to calculate distance between two coordinates
        const R = 6371e3; //radius of the Earth in meters
        const lat1 = (coord1.latitude * Math.PI) / 180; //latitude of first coordinate in radians
        const lat2 = (coord2.latitude * Math.PI) / 180; //latitude of second coordinate in radians
        const deltaLat = lat2 - lat1; //difference in latitude
        const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180; //difference in longitude
        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2); //haversine formula
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); //angular distance in radians

        return R * c; //distance in meters
    };




    const handleMenu = () => {
        if (isMenuVisible) {
            Animated.timing(slideAnim, {
                toValue: Dimensions.get('screen').height + 50, // Push it further off-screen
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIsMenuVisible(false));
        } else {
            setIsMenuVisible(true);
            Animated.timing(slideAnim, {
                toValue: Dimensions.get('screen').height * 0.1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };


    const handleRecenter = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Permission to access location was denied');
            return;
        }





        let location = await Location.getCurrentPositionAsync({});
        setOrigin({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });
        setMapRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        });
    };

    useEffect(() => { //check if user is logged in
        const checkToken = async () => {
            const token = await AsyncStorage.getItem('token'); //retrieve token from storage
            setIsLoggedIn(!!token); //set login status
            if (!token) {
                props.navigation.replace('Home'); //navigate to Home if not logged in
            }
        };

        checkToken(); //call the function
    }, []); //empty dependency array means it runs once

    useEffect(() => { //update user's location in real-time
        let watcher = null; //variable to hold location watcher

        const startLocationUpdates = async () => { //start location updates
            const { status } = await Location.requestForegroundPermissionsAsync(); //request location permissions
            if (status !== 'granted') { //check if permission is granted
                console.log('Permission to access location was denied'); //log error
                return; //exit function
            }

            watcher = await Location.watchPositionAsync( //start watching position
                {
                    accuracy: Location.Accuracy.High, //set accuracy to high
                    timeInterval: 5000, //update every 5 seconds
                    distanceInterval: 10, //or when moved 10 meters
                },
                (location) => { //callback with location
                    const currentLocation = { //extract current location
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };

                    const distanceToDestination = calculateDistance(currentLocation, destination); //calculate distance to destination
                    if (distanceToDestination <= 50) { //if close to destination
                        console.log('User has reached the destination. Stopping updates.'); //log message
                        watcher && watcher.remove(); //stop updates
                        return; //exit function
                    }

                    setOrigin(currentLocation); //update origin state
                }
            );
        };

        if (isLoggedIn) startLocationUpdates(); //start updates if logged in

        return () => { //cleanup function
            watcher && watcher.remove(); //stop watcher
        };
    }, [isLoggedIn]); //run when login status changes

    useEffect(() => { //fetch directions when origin changes
        const fetchDirections = async () => {
            if (!origin) return; //if origin is null, exit

            const originStr = `${origin.latitude},${origin.longitude}`; //format origin string
            const destinationStr = `${destination.latitude},${destination.longitude}`; //format destination string
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${googleMapsApiKey}`; //build API URL

            try {
                const response = await fetch(url); //fetch directions
                const data = await response.json(); //parse response

                if (data.routes && data.routes.length > 0) { //check if routes exist
                    const steps = data.routes[0].legs[0].steps.map((step) => ({ //map steps
                        instruction: step.html_instructions.replace(/<[^>]*>?/gm, ''), //remove HTML tags
                        distance: step.distance.text, //step distance
                        duration: step.duration.text, //step duration
                        location: { //step end location
                            latitude: step.end_location.lat,
                            longitude: step.end_location.lng,
                        },
                    }));
                    setInstructions(steps); //update instructions
                    setCurrentStep(steps[0]); //set first step
                } else {
                    console.error('No routes found or invalid response:', data); //log error
                }
            } catch (error) {
                console.error('Error fetching directions:', error); //log fetch error
            }
        };

        if (isLoggedIn) fetchDirections(); //fetch directions if logged in
    }, [origin, isLoggedIn]); //run when origin or login status changes

    useEffect(() => {
        if (origin) {
            setMapRegion({
                latitude: origin.latitude,
                longitude: origin.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        }
    }, [origin]);

    return (
        <View style={styles.container}>
            {isLoggedIn && ( //show content if logged in
                <>
                    {origin && ( //show map if origin is available
                        <MapView
                            style={styles.map} //apply map styles
                            region={mapRegion}
                            showsUserLocation={true} //show user's location
                            showsMyLocationButton={false} //show location button
                        >
                            {origin && <Marker coordinate={origin} />}
                            {/*marker at destination*/}
                            <Marker coordinate={destination} title="Destination" />
                            <MapViewDirections
                                origin={origin} //starting point
                                destination={destination} //ending point
                                apikey={googleMapsApiKey} //Google Maps API Key
                                strokeWidth={4} //line width
                                strokeColor="blue" //line color
                                onReady={(result) => { //callback when ready
                                    console.log(`Distance: ${result.distance} km`); //log distance
                                    console.log(`Duration: ${result.duration} min`); //log duration
                                }}
                                onError={(errorMessage) => { //callback on error
                                    console.error('Directions Error:', errorMessage); //log error
                                }}
                            />
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
                                <TouchableOpacity onPress={() => props.navigation.navigate('ProfilePage')}>
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

                        <TouchableOpacity style={styles.menuItem}>
                            <Ionicons name="power-outline" size={24} color="white" />
                            <Text style={styles.menuItemText}>Shut off</Text>
                        </TouchableOpacity>
                    </Animated.View>


                    {!isMenuVisible && (
                        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
                            <MaterialIcons name="gps-fixed" size={24} color="black" />
                        </TouchableOpacity>
                    )}

                    {/* Current Step at the Bottom */}
                    {currentStep && !isMenuVisible && ( //show current step if available
                        <View style={styles.instructions}>
                            {/*step heading*/}
                            <Text style={styles.heading}>Current Step:</Text>
                            <Text style={styles.currentStep}>
                                {/*step details*/}
                                {currentStep.instruction} for {currentStep.distance} ({currentStep.duration})
                            </Text>
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

export default NavigationPage; //export component