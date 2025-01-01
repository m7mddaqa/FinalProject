import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { styles } from '../styles/MapPageStyle.js';

const googleMapsApiKey = "AIzaSyCCT2D-T-WTgVT8_PRyNyZgf2Fe5abpHnA";

const NavigationPage = () => {
    const [origin, setOrigin] = useState(null); //user's realtime location
    const [destination, setDestination] = useState({
        latitude: 31.312653,
        longitude: 35.263273,
    });
    const [instructions, setInstructions] = useState([]);
    const [currentStep, setCurrentStep] = useState({}); //current step with detailed information
    const [showFullSteps, setShowFullSteps] = useState(false); //toggle for full steps view

    //helper function to calculate distance between two coordinates
    const calculateDistance = (coord1, coord2) => {
        const R = 6371e3; //earth radius in meters
        //convert lats from degrees to radians (sin and cos use radians in JS not degrees), formula: Radians = Degrees*Pi/180
        const lat1 = (coord1.latitude * Math.PI) / 180;
        const lat2 = (coord2.latitude * Math.PI) / 180;
        const deltaLat = lat2 - lat1; //the difference between the 2 lats in radians
        const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180; //the difference between the 2 longs in radians
        //Haversine formula:
        const a =
            Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; //distance in meters
    };

    //real-time location tracking
    useEffect(() => {
        const startLocationUpdates = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied'); //todo: test what happens if denied access
                return;
            }

            //timeinterval is only supported on android as of now
            //first argument: options, second argument: locationcallback which consists of a locationObject which consists of coords
            Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000, // Update every 5 seconds
                    distanceInterval: 10, // Update every 10 meters
                },
                (location) => {
                    const currentLocation = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    };

                    //check if user is near the destination
                    const distanceToDestination = calculateDistance(currentLocation, destination);
                    if (distanceToDestination <= 50) {
                        console.log('User has reached the destination. Navigation complete.');
                        return; //stop recalculations
                    }

                    //check if user has deviated from the route
                    if (currentStep?.instruction) {
                        const stepLocation = currentStep.location; //compare against the current step
                        const distanceToStep = calculateDistance(currentLocation, stepLocation);

                        if (distanceToStep > 50) {
                            console.log('User has deviated from the route. Recalculating...');
                            setOrigin(currentLocation); //update origin to current location and recalculate route
                        }
                    }
                }
            );
        };
        startLocationUpdates();
    }, [origin, currentStep]);

    //fetch updated directions
    useEffect(() => {
        const fetchDirections = async () => {
            if (!origin) return;

            const originStr = `${origin.latitude},${origin.longitude}`;
            const destinationStr = `${destination.latitude},${destination.longitude}`;
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${googleMapsApiKey}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.routes.length) {
                    const steps = data.routes[0].legs[0].steps.map((step) => ({
                        instruction: step.html_instructions.replace(/<[^>]*>?/gm, ''), //Strip HTML tags
                        distance: step.distance.text, //e.g., "500 m"
                        duration: step.duration.text, //e.g., "1 min"
                        location: step.end_location, //End location of the step
                    }));
                    setInstructions(steps);

                    //update the current step
                    if (steps.length > 0) {
                        setCurrentStep(steps[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching directions:', error);
            }
        };

        fetchDirections();
    }, [origin]);

    return (
        <View style={styles.container}>
            {origin && (
                <MapView
                    style={styles.map}
                    region={{
                        latitude: origin.latitude,
                        longitude: origin.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    showsUserLocation={true}
                    followsUserLocation={true}
                >
                    <Marker coordinate={destination} title="Tel Aviv" />
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={googleMapsApiKey}
                        strokeWidth={4}
                        strokeColor="blue"
                        onReady={(result) => {
                            console.log(`Distance: ${result.distance} km`);
                            console.log(`Duration: ${result.duration} min`);
                        }}
                    />
                </MapView>
            )}
            <View style={styles.instructions}>
                <Text style={styles.heading}>Current Step:</Text>
                {currentStep ? (
                    <Text style={styles.currentStep}>
                        {currentStep.instruction} for {currentStep.distance} ({currentStep.duration})
                    </Text>
                ) : (
                    <Text style={styles.currentStep}>Fetching current step...</Text>
                )}
                <TouchableOpacity onPress={() => setShowFullSteps(!showFullSteps)}>
                    <Text style={styles.toggleText}>
                        {showFullSteps ? 'Hide Full Steps' : 'Show Full Steps'}
                    </Text>
                </TouchableOpacity>
                {showFullSteps && (
                    <View style={styles.fullStepsContainer}>
                        {instructions.map((step, index) => (
                            <Text key={index} style={styles.fullStep}>
                                {index + 1}. {step.instruction} for {step.distance} ({step.duration})
                            </Text>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};


export default NavigationPage;
