import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { styles } from '../styles/MapPageStyle';
import { handleReport } from '../services/driveHelpers';

const ReportPanel = ({ setShowReportPanel, setVolunteerReports, showAllSteps }) => {
    if (showAllSteps) return null;

    const reportOptions = [
        { icon: require('../assets/traffic-jam.png'), label: 'Traffic Jam' },
        { icon: require('../assets/police.png'), label: 'Police' },
        { icon: require('../assets/accident.png'), label: 'Accident' },
        { icon: require('../assets/hazard.png'), label: 'Hazard' },
        { icon: require('../assets/injured.png'), label: 'Injured' },
        { icon: require('../assets/fire.png'), label: 'Fire' },
    ];

    return (
        <View style={styles.reportPanel}>
            <Text style={styles.reportTitle}>Report</Text>
            <TouchableOpacity onPress={() => setShowReportPanel(false)}>
                <Text style={styles.closeReportPanelButton}>✕</Text>
            </TouchableOpacity>
            <ScrollView style={styles.reportGrid}>
                {reportOptions.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.reportItem}
                        onPress={() => handleReport(item.label, setShowReportPanel, setVolunteerReports)}
                    >
                        <Image source={item.icon} style={styles.reportIcon} />
                        <Text style={styles.reportLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default ReportPanel;
