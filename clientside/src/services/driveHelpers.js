import * as Speech from 'expo-speech';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React from 'react';
import { Animated, Dimensions, BackHandler } from 'react-native';

// cancel the ride and reset the state
export const cancelRide = (setDestination, setInstructions, setCurrentStepIndex, exit = false) => {
    setDestination(null);
    setInstructions([]);
    setCurrentStepIndex(0);
    Speech.speak("Navigation cancelled");
    if (exit) {
        BackHandler.exitApp();
    }
};

// get direction icon from the maneuver
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
    
    // Handle the first step (depart) differently
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

// recenter the map to the user's location
export const handleRecenter = async (setOrigin, setMapRegion) => {
    let loc = await Location.getLastKnownPositionAsync({});
    if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation }); // [Modified] use BestForNavigation accuracy for recenter
    }
    const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
    };
    setOrigin(coords);
    setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
};

// opening menu function + animation
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

const saveSearchToHistory = async (newSearch) => {
    try {
        const existingHistory = await AsyncStorage.getItem('searchHistory');
        let history = existingHistory ? JSON.parse(existingHistory) : [];

        // Prevent duplicates
        if (!history.includes(newSearch)) {
            history.unshift(newSearch);
            if (history.length > 5) history.pop(); // Keep max 5 items
            await AsyncStorage.setItem('searchHistory', JSON.stringify(history));
        }
    } catch (e) {
        console.error('Failed to save search history', e);
    }
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