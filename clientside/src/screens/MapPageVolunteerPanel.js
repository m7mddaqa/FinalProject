import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { styles } from '../styles/MapPageStyle';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';


const API_URL = 'http://192.168.1.233:3001'; // updated backend IP

const VolunteerPanel = ({
  setShowVolunteerPanel,
  volunteerReports,
  handleResolveReport,
  isMenuVisible,
  showAllSteps,
  reloadReports, // optional, if available
}) => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();

  // Local state to remove fake reports without reload
  const [hiddenReportIds, setHiddenReportIds] = useState([]);

  if (isMenuVisible || showAllSteps) return null;

  const sortedReports = [...volunteerReports]
    .filter(item => item.category !== 'normal' && !hiddenReportIds.includes(item._id))
    .sort((a, b) => a.distance - b.distance);

  const getEventColor = (type) => {
    switch (type.toLowerCase()) {
      case 'fire': return isDarkMode ? '#FF453A' : '#FF3B30';
      case 'flood': return isDarkMode ? '#0A84FF' : '#007AFF';
      case 'earthquake': return isDarkMode ? '#FF9F0A' : '#FF9500';
      case 'medical': return isDarkMode ? '#32D74B' : '#34C759';
      case 'security': return isDarkMode ? '#BF5AF2' : '#AF52DE';
      default: return isDarkMode ? '#0A84FF' : '#007AFF';
    }
  };

const handleMarkFake = async (event) => {
  console.log("Attempting to mark report as fake. ID:", event._id);

  try {
    const token = await AsyncStorage.getItem('token');
    console.log("Retrieved token:", token);
    if (!token) throw new Error('Token not found');

    // Get volunteer's current location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');

    const location = await Location.getCurrentPositionAsync({});
    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;

    const res = await fetch(`${API_URL}/api/events/${event._id}/markFake`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    const data = await res.json();
    console.log("Fake mark response:", data);

    if (!res.ok) throw new Error(data.error || 'Error marking as fake');

    setHiddenReportIds(prev => [...prev, event._id]);

    Alert.alert('Success', `Event marked as fake. Reporter score: ${data.reporterScore}`);
  } catch (err) {
    console.error("Error in handleMarkFake:", err.message);
    Alert.alert('Error', err.message);
  }
};


  return (
    <View style={isDarkMode ? styles.volunteerPanelDark : styles.volunteerPanel}>
      <View style={styles.volunteerHeaderRow}>
        <Text style={isDarkMode ? styles.volunteerTitleDark : styles.volunteerTitle}>Volunteer Dashboard</Text>
        <TouchableOpacity onPress={() => setShowVolunteerPanel(false)}>
          <Ionicons name="close" style={isDarkMode ? styles.closeButtonIconDark : styles.closeButtonIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.volunteerReportsList}>
        {sortedReports.length === 0 && (
          <Text style={isDarkMode ? styles.noReportsTextDark : styles.noReportsText}>
            No reports available
          </Text>
        )}

        {sortedReports.map((report) => (
          <View
            key={report._id}
            style={[
              isDarkMode ? styles.volunteerReportItemDark : styles.volunteerReportItem,
              { borderLeftColor: getEventColor(report.type) },
            ]}
          >
            <Text style={[
              isDarkMode ? styles.volunteerReportTypeDark : styles.volunteerReportType,
              { color: getEventColor(report.type) },
            ]}>
              {report.type}
            </Text>

            <Text style={isDarkMode ? styles.volunteerReportLocationDark : styles.volunteerReportLocation}>
              Location: {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
            </Text>

            <Text style={isDarkMode ? styles.volunteerReportDistanceDark : styles.volunteerReportDistance}>
              Distance: {report.distance !== undefined && report.distance !== null ? report.distance.toFixed(2) : '0.00'} km
            </Text>

            <Text style={isDarkMode ? styles.volunteerReportTimeDark : styles.volunteerReportTime}>
              Reported: {new Date(report.createdAt).toLocaleString()}
            </Text>

            {/* Make the button bar horizontally scrollable */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.checkDetailsButton, { backgroundColor: getEventColor(report.type) }]}
                  onPress={() => navigation.navigate('EventDetails', { event: report })}
                >
                  <Text style={styles.checkDetailsButtonText} numberOfLines={1} ellipsizeMode="tail">Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={isDarkMode ? styles.resolveButtonDark : styles.resolveButton}
                  onPress={() => {
                    console.log("Attempting to resolve report:", report);
                    handleResolveReport(report);
                  }}
                >
                  <Text style={isDarkMode ? styles.resolveButtonTextDark : styles.resolveButtonText} numberOfLines={1} ellipsizeMode="tail">Resolved</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={isDarkMode ? styles.fakeButtonDark : styles.fakeButton}
                  onPress={() => handleMarkFake(report)}
                >
                  <Text style={styles.resolveButtonText} numberOfLines={1} ellipsizeMode="tail">Fake</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default VolunteerPanel;
