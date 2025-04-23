import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '../styles/MapPageStyle';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const VolunteerPanel = ({setShowVolunteerPanel, volunteerReports, handleResolveReport, isMenuVisible, showAllSteps }) => {
    const navigation = useNavigation();
    const { isDarkMode } = useTheme();
    if (isMenuVisible || showAllSteps) return null;

    //sort reports by distance
    const sortedReports = [...volunteerReports].sort((a, b) => a.distance - b.distance);

    const getEventColor = (type) => {
        switch (type.toLowerCase()) {
            case 'fire':
                return isDarkMode ? '#FF453A' : '#FF3B30';
            case 'flood':
                return isDarkMode ? '#0A84FF' : '#007AFF';
            case 'earthquake':
                return isDarkMode ? '#FF9F0A' : '#FF9500';
            case 'medical':
                return isDarkMode ? '#32D74B' : '#34C759';
            case 'security':
                return isDarkMode ? '#BF5AF2' : '#AF52DE';
            default:
                return isDarkMode ? '#0A84FF' : '#007AFF';
        }
    };

    return (
        <View style={isDarkMode ? styles.volunteerPanelDark : styles.volunteerPanel}>
            <Text style={isDarkMode ? styles.volunteerTitleDark : styles.volunteerTitle}>Volunteer Dashboard</Text>
            <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowVolunteerPanel(false)}
            >
                <Ionicons name="close" style={isDarkMode ? styles.closeButtonIconDark : styles.closeButtonIcon} />
            </TouchableOpacity>
            <ScrollView style={styles.volunteerReportsList}>
                {sortedReports.length === 0 && (
                    <Text style={isDarkMode ? styles.noReportsTextDark : styles.noReportsText}>No reports available</Text>
                )}
                {sortedReports.map((report) => (
                    <View 
                        key={report._id} 
                        style={[
                            isDarkMode ? styles.volunteerReportItemDark : styles.volunteerReportItem,
                            { borderLeftColor: getEventColor(report.type) }
                        ]}
                    >
                        <Text style={[
                            isDarkMode ? styles.volunteerReportTypeDark : styles.volunteerReportType,
                            { color: getEventColor(report.type) }
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
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.checkDetailsButton, { backgroundColor: getEventColor(report.type) }]}
                                onPress={() => navigation.navigate('EventDetails', { event: report })}
                            >
                                <Text style={styles.checkDetailsButtonText}>Check Details</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={isDarkMode ? styles.resolveButtonDark : styles.resolveButton}
                                onPress={() => handleResolveReport(report._id)}
                            >
                                <Text style={isDarkMode ? styles.resolveButtonTextDark : styles.resolveButtonText}>Mark as Resolved</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default VolunteerPanel;
