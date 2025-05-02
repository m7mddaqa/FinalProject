import * as Speech from 'expo-speech';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React from 'react';
import { Animated, Dimensions, BackHandler, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { URL } from '@env';

//cancel the ride and reset the state
export const cancelRide = (setDestination, setInstructions, setCurrentStepIndex, setShowAllSteps, exit = false) => {
    setDestination(null);
    setInstructions([]);
    setCurrentStepIndex(0);
    setShowAllSteps(false);
    Speech.speak("Navigation cancelled");
    if (exit) {
        BackHandler.exitApp();
    }
};

//get direction icon from the maneuver
export const getManeuverIcon = (maneuver) => {
    switch (maneuver) {
        case 'turn-left':
            return <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />;
        case 'turn-right':
            return <MaterialCommunityIcons name="arrow-right" size={24} color="#333" />;
        case 'straight':
            return <MaterialCommunityIcons name="arrow-up" size={24} color="#333" />;
        case 'slight-left':
            return <MaterialCommunityIcons name="arrow-top-left" size={24} color="#333" />;
        case 'slight-right':
            return <MaterialCommunityIcons name="arrow-top-right" size={24} color="#333" />;
        case 'merge':
            return <MaterialCommunityIcons name="merge" size={24} color="#333" />;
        case 'fork-left':
        case 'fork-right':
            return <MaterialCommunityIcons name="arrow-split-vertical" size={24} color="#333" />;
        case 'ramp-left':
            return <MaterialCommunityIcons name="arrow-left-bottom" size={24} color="#333" />;
        case 'ramp-right':
            return <MaterialCommunityIcons name="arrow-right-bottom" size={24} color="#333" />;
        case 'uturn-left':
            return <MaterialCommunityIcons name="u-turn-left" size={24} color="#333" />;
        case 'uturn-right':
            return <MaterialCommunityIcons name="u-turn-right" size={24} color="#333" />;
        case 'roundabout-left':
            return <MaterialCommunityIcons name="rotate-left" size={24} color="#333" />;
        case 'roundabout-right':
            return <MaterialCommunityIcons name="rotate-right" size={24} color="#333" />;
        case 'ferry':
            return <MaterialCommunityIcons name="ferry" size={24} color="#333" />;
        case 'depart':
            return <MaterialCommunityIcons name="car" size={24} color="#333" />;
        case 'end':
            return <MaterialCommunityIcons name="flag-checkered" size={24} color="#333" />;
        default:
            return <MaterialCommunityIcons name="arrow-up" size={24} color="#333" />;
    }
};

// get direction text from the maneuver
export const getManeuverText = (maneuver, originalText) => {
    if (!maneuver) return 'Continue straight';

    //handle the first step (depart) differently
    if (maneuver === 'depart') {
        return 'Start driving';
    }

    switch (maneuver) {
        case 'turn-right':
            return 'Turn right';
        case 'turn-left':
            return 'Turn left';
        case 'straight':
            return 'Continue straight';
        case 'merge':
            return 'Merge onto';
        case 'fork-right':
            return 'Take the right fork';
        case 'fork-left':
            return 'Take the left fork';
        case 'ramp-right':
            return 'Take the ramp on the right';
        case 'ramp-left':
            return 'Take the ramp on the left';
        case 'uturn':
            return 'Make a U-turn';
        case 'roundabout':
            return 'Enter the roundabout';
        default:
            return originalText || 'Continue straight';
    }
};

//opening menu function + animation
export const handleMenuToggle = (isMenuVisible, slideAnim, setIsMenuVisible) => {
    if (isMenuVisible) {
        Animated.timing(slideAnim, {
            toValue: Dimensions.get('screen').height + 50,
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

//recenter the map to the user's location
export const handleRecenter = async (setOrigin, setMapRegion) => {
    try {
        const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 0,
            distanceInterval: 0
        });
        
        const newRegion = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        };

        setOrigin({
            latitude: coords.latitude,
            longitude: coords.longitude,
        });
        setMapRegion(newRegion);
    } catch (error) {
        console.error('Error getting location:', error);
    }
};

//add this function to calculate ETA
export const calculateETA = (steps, currentIndex) => {
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

//calculate shortest distance from a point to the route polyline (in meters)
export const calculateDistanceToRoute = (point, routeCoords) => {
    if (!routeCoords || routeCoords.length < 2) return Infinity;
    const rad = Math.PI / 180;
    const latFactor = 111000; //meters per degree latitude
    const lonFactor = Math.cos(point.latitude * rad) * latFactor;
    let minDist = Infinity;
    for (let i = 0; i < routeCoords.length - 1; i++) {
        const p1 = routeCoords[i];
        const p2 = routeCoords[i + 1];
        //convert lat/lon to x,y coordinates in meters
        const x1 = p1.longitude * lonFactor;
        const y1 = p1.latitude * latFactor;
        const x2 = p2.longitude * lonFactor;
        const y2 = p2.latitude * latFactor;
        const x0 = point.longitude * lonFactor;
        const y0 = point.latitude * latFactor;
        const vx = x2 - x1;
        const vy = y2 - y1;
        const wx = x0 - x1;
        const wy = y0 - y1;
        const c1 = vx * wx + vy * wy;
        const c2 = vx * vx + vy * vy;
        let dist;
        if (c1 <= 0) {
            //closest to p1
            dist = Math.sqrt(wx * wx + wy * wy);
        } else if (c1 >= c2) {
            //closest to p2
            const dx = x0 - x2;
            const dy = y0 - y2;
            dist = Math.sqrt(dx * dx + dy * dy);
        } else {
            //closest to projection on segment
            const b = c1 / c2;
            const projx = x1 + b * vx;
            const projy = y1 + b * vy;
            const dx = x0 - projx;
            const dy = y0 - projy;
            dist = Math.sqrt(dx * dx + dy * dy);
        }
        if (dist < minDist) {
            minDist = dist;
        }
    }
    return minDist;
};

export const fetchVolunteerReports = async (setVolunteerReports) => {
    try {
        console.log('Attempting to fetch reports...');
        const token = await AsyncStorage.getItem('token');
        console.log('Token exists:', !!token);

        // Get current location
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const response = await axios.get(`${URL}/api/events?latitude=${latitude}&longitude=${longitude}`, {
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

export const handleReport = async (reportType, setShowReportPanel, setVolunteerReports, description = '', image = null) => {
    try {
        const location = await Location.getCurrentPositionAsync({});
        if (!location) {
            Alert.alert('Error', 'Could not get your location');
            return;
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) {
            Alert.alert('Error', 'Please log in to submit a report');
            return;
        }

        const formData = new FormData();
        formData.append('type', reportType);
        formData.append('location[latitude]', location.coords.latitude.toString());
        formData.append('location[longitude]', location.coords.longitude.toString());
        formData.append('description', description);

        if (image) {
            //create a proper file object for upload
            const file = {
                uri: image.uri,
                type: image.type || 'image/jpeg',
                name: image.name || `report_image_${Date.now()}.jpg`
            };
            formData.append('image', file);
        }

        console.log('Submitting report with form data:', {
            type: reportType,
            location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            },
            description,
            hasImage: !!image
        });

        const response = await fetch(`${URL}/api/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error response:', errorData);
            throw new Error(errorData.error || 'Failed to submit report');
        }

        const result = await response.json();
        console.log('Report submitted successfully:', result);
        
        //only update UI state if the setters are provided
        if (setShowReportPanel) {
            setShowReportPanel(false);
        }
        
        if (setVolunteerReports) {
            setVolunteerReports(prev => [...prev, result]);
        }

        return result;
    } catch (error) {
        console.error('Error submitting report:', error);
        Alert.alert('Error', error.message || 'Failed to submit report. Please try again.');
        throw error;
    }
};

//function to save search to history
export const saveSearchToHistory = async (query, location, setSearchHistory) => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            return;
        }

        const response = await axios.post(
            `${URL}/search-history`,
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
            //update local search history state
            const updatedHistory = await fetchSearchHistory();
            //remove duplicates and sort by timestamp
            const uniqueHistory = updatedHistory.reduce((acc, current) => {
                const x = acc.find(item => item.searchQuery === current.searchQuery);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    //if duplicate found, keep the one with the most recent timestamp
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

//function to fetch search history
export const fetchSearchHistory = async () => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            return [];
        }

        const response = await axios.get(
            `${URL}/search-history`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 200) {
            //remove duplicates and sort by timestamp
            const uniqueHistory = response.data.reduce((acc, current) => {
                const x = acc.find(item => item.searchQuery === current.searchQuery);
                if (!x) {
                    return acc.concat([current]);
                } else {
                    //if duplicate found, keep the one with the most recent timestamp
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

//custom render function for search history items
export const renderHistoryItem = (item) => ({
    description: item.searchQuery,
    geometry: {
        location: {
            lat: item.location.latitude,
            lng: item.location.longitude
        }
    }
});


    //function to increment the number of ongoing volunteers to an event
export  const incrementOnWayVolunteers = async (eventId) => {
        console.log('Incrementing for event:', eventId);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.put(`${URL}/api/events/${eventId}/incrementOnWayVolunteers`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(`Success status: ${response.status}`);
            console.log('Volunteer added successfully!');
        } catch (error) {
            if (error.response) {
                console.log(`Error status: ${error.response.status}`);
                console.log(`Error message: ${error.response.data?.error}`);
            } else {
                console.error('Unexpected error:', error.message);
            }
        }
    };
    
    //function to decrement the number of ongoing volunteers to an event
export const decrementOnWayVolunteers = async (eventId) => {
    console.log('Decrement for event:', eventId);
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.put(`${URL}/api/events/${eventId}/decrementOnWayVolunteers`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(`Success status: ${response.status}`);
        console.log('Volunteer removed successfully!');
    } catch (error) {
        if (error.response) {
            console.log(`Error status: ${error.response.status}`);
            console.log(`Error message: ${error.response.data?.error}`);
        } else {
            console.error('Unexpected error:', error.message);
        }
    }
    };

    //function to increment the number of arrived volunteers to an event
export const incrementArrivedVolunteers = async (eventId) => {
    console.log('Incrementing for event:', eventId);
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.put(`${URL}/api/events/${eventId}/incrementArrivedVolunteers`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(`Success status: ${response.status}`);
        console.log('Volunteer added successfully!');
    } catch (error) {
        if (error.response) {
            console.log(`Error status: ${error.response.status}`);
            console.log(`Error message: ${error.response.data?.error}`);
        } else {
            console.error('Unexpected error:', error.message);
        }
    }
};

//compute bearing between two coords
export const calculateBearing = (from, to) => {
    const toRad = d => d * Math.PI / 180;
    const toDeg = r => r * 180 / Math.PI;
    const lat1 = toRad(from.latitude), lat2 = toRad(to.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

//function to get the icon for the event type on map as marker
export const getEventIcon = (type) => {
    switch (type.toLowerCase()) {
        case 'traffic jam': return require('../assets/traffic-jam.png');
        case 'police': return require('../assets/police.png');
        case 'accident': return require('../assets/accident.png');
        case 'injured': return require('../assets/injured.png');
        case 'fire': return require('../assets/fire.png');
        case 'rockets': return require('../assets/rocket.png');
        case 'earthquake': return require('../assets/earthquake.png');
        case 'flood': return require('../assets/flood.png');
        case 'unsafe building': return require('../assets/unsafeBuilding.png');
    }
};
