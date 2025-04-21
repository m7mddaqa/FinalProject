import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/MapPageStyle';
import { handleReport } from '../services/driveHelpers';

const ReportPanel = ({ setShowReportPanel }) => {
    const reportOptions = [
        { icon: '🚗', label: 'Traffic Jam' },
        { icon: '👮', label: 'Police' },
        { icon: '💥', label: 'Accident' },
        { icon: '⚠️', label: 'Hazard' },
        { icon: '📷', label: 'Camera' },
        { icon: '💬', label: 'Map Chat' },
        { icon: '❌', label: 'Map Issue' },
        { icon: '⛽', label: 'Gas Prices' },
        { icon: '🚧', label: 'Closure' },
    ];

    return (
        <View style={styles.reportPanel}>
            <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>Report</Text>
                <TouchableOpacity onPress={() => setShowReportPanel(false)}>
                    <Text style={styles.closeReportPanelButton}>✕</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.reportGrid}>
                {reportOptions.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.reportItem}
                        onPress={() => handleReport(item.label, setShowReportPanel)}
                    >
                        <Text style={styles.reportIcon}>{item.icon}</Text>
                        <Text style={styles.reportLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default ReportPanel;
