import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const SignInPage = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = () => {
        if (email === '' || password === '') {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Mock Sign-In Logic
        if (email === 'test@example.com' && password === 'password123') {
            Alert.alert('Success', 'You are signed in!');
            navigation.navigate('HomePage'); // Replace 'HomePage' with your actual navigation target
        } else {
            Alert.alert('Error', 'Invalid credentials');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Sign In</Text>

            <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('SignupPage')}>
                    <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 30,
        color: '#007AFF',
    },
    input: {
        width: '100%',
        maxWidth: 400,
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderColor: '#ccc',
        borderWidth: 1,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        color: '#333',
    },
    signInButton: {
        backgroundColor: '#007AFF',
        width: '100%',
        maxWidth: 400,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
        color: '#333',
    },
    signUpText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#007AFF',
    },
});

export default SignInPage;
