import React, { useState, useEffect } from 'react';
import { Button, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { styles } from '../styles/LoginPageStyle.js';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfilePage = ({ navigation }) => {
    return(
    <View style={styles.container}>
        <Text style={styles.text}>Profile</Text>
        <View style={styles.buttonView}>
            <Button title="Go back to the home page" color='#067ef5' onPress={() => navigation.navigate('Home')} />
        </View>
    </View>
    );
}

export default ProfilePage;