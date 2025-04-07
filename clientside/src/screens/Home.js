import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { styles } from '../styles/Home.js';

const Home = (props) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.brand}>SafeSpot</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => props.navigation.navigate('LoginPage')}
                >
                    <Text style={styles.buttonText}>Login to an existing account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => props.navigation.navigate('SignupPage')}
                >
                    <Text style={styles.buttonText}>Don't have an account? Signup now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => props.navigation.navigate('MapPage')}
                >
                    <Text style={styles.buttonText}>Check the map now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => props.navigation.navigate('ProfilePage')}
                >
                    <Text style={styles.buttonText}>Check your profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Home;
