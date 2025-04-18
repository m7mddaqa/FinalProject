
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from '../styles/MapPageStyle';

const VolunteerPanel = ({ volunteerReports, handleResolveReport }) => {
    return (
        <View style={styles.volunteerPanel}>
            <Text style={styles.volunteerTitle}>Volunteer Dashboard</Text>
            <ScrollView style={styles.volunteerReportsList}>
                {volunteerReports.map((report) => (
                    <View key={report._id} style={styles.volunteerReportItem}>
                        <Text style={styles.volunteerReportType}>{report.type}</Text>
                        <Text style={styles.volunteerReportLocation}>
                            Location: {report.location.latitude.toFixed(4)}, {report.location.longitude.toFixed(4)}
                        </Text>
                        <Text style={styles.volunteerReportTime}>
                            Reported: {new Date(report.createdAt).toLocaleString()}
                        </Text>
                        <TouchableOpacity
                            style={styles.resolveButton}
                            onPress={() => handleResolveReport(report._id)}
                        >
                            <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default VolunteerPanel;
