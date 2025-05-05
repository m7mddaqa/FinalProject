import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { styles } from '../styles/MapPageStyle';
import { handleReport } from '../services/driveHelpers';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ReportPanel = ({ setShowReportPanel, setVolunteerReports, showAllSteps }) => {
    const navigation = useNavigation();
    const { isDarkMode } = useTheme();
    
    if (showAllSteps) return null;

    const reportOptions = [
        //https://www.flaticon.com/
        { icon: require('../assets/traffic-jam.png'), label: 'Traffic Jam' },
        { icon: require('../assets/police.png'), label: 'Police' },
        { icon: require('../assets/accident.png'), label: 'Accident' },
        { icon: require('../assets/injured.png'), label: 'Injured' },
        { icon: require('../assets/fire.png'), label: 'Fire' },
        { icon: require('../assets/rocket.png'), label: 'Rockets' },
        { icon: require('../assets/earthquake.png'), label: 'Earthquake' },
        { icon: require('../assets/danger.png'), label: 'Danger' },
        { icon: require('../assets/flood.png'), label: 'Flood' },
        { icon: require('../assets/unsafeBuilding.png'), label: 'Unsafe Building' },
        ];

    const handleReportPress = (reportType) => {
        Alert.alert(
            'Add Details',
            'Would you like to add an image or description to your report?',
            [
                {
                    text: 'Report Without Details',
                    onPress: () => {
                        handleReport(reportType, setShowReportPanel, setVolunteerReports);
                        setShowReportPanel(false);
                    },
                    style: 'cancel',
                },
                {
                    text: 'Add Details',
                    onPress: () => {
                        setShowReportPanel(false);
                        navigation.navigate('ReportDetails', { reportType });
                    },
                },
                {
                    text: 'Cancel',
                    onPress: () => console.log('report cancel Pressed'),
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    };

    //possible delete?
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            //reset any necessary state when returning to this screen
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <View style={isDarkMode ? styles.reportPanelDark : styles.reportPanel}>
            <Text style={isDarkMode ? styles.reportTitleDark : styles.reportTitle}>Report</Text>
            <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowReportPanel(false)}
            >
                <Ionicons name="close" style={isDarkMode ? styles.closeButtonIconDark : styles.closeButtonIcon} />
            </TouchableOpacity>
            <ScrollView style={styles.reportGrid}>
                {reportOptions.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={isDarkMode ? styles.reportItemDark : styles.reportItem}
                        onPress={() => handleReportPress(item.label)}
                    >
                        <Image source={item.icon} style={styles.reportIcon} />
                        <Text style={isDarkMode ? styles.reportLabelDark : styles.reportLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default ReportPanel;
