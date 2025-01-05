import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Home = (props) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.brand}>SafeSpot</Text>

            {/* Buttons Section */}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9', // Light background
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        color: '#555',
        fontWeight: '300',
        marginBottom: 5,
    },
    brand: {
        fontSize: 36,
        color: '#b51701', // Brand color
        fontWeight: 'bold',
        marginBottom: 30,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        backgroundColor: '#067ef5', // Button color
        paddingVertical: 15,
        borderRadius: 25,
        marginVertical: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    buttonText: {
        color: '#fff', // Text color
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Home;
