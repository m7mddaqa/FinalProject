import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { URL } from '@env';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { isLoggedIn } from '../services/getToken';

const CreatedEventsScreen = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCreatedEvents = async () => {
    try {
      const tokenData = await isLoggedIn();
      if (!tokenData) {
        setError('Please log in to view your created events');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${URL}/api/events/user`, {
        headers: { Authorization: `Bearer ${tokenData.token}` }
      });
      setCreatedEvents(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching created events:', err);
      setError('Failed to load events');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatedEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCreatedEvents().finally(() => setRefreshing(false));
  }, []);

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

  const renderBadge = (resolved) => (
    <View style={[styles.badge, { backgroundColor: resolved ? '#32D74B' : '#007AFF' }]}> 
      <Text style={styles.badgeText}>{resolved ? 'Resolved' : 'Active'}</Text>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, isDarkMode && styles.cardDark, { borderLeftColor: getEventColor(item.type), borderLeftWidth: 4 }]}
      onPress={() => navigation.navigate('ResolvedEventDetails', { event: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark, { color: getEventColor(item.type) }]}>{item.type}</Text>
        <Text style={[styles.cardText, isDarkMode && styles.cardTextDark]}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      {renderBadge(item.resolved)}
      <Text style={[styles.cardText, isDarkMode && styles.cardTextDark]}>
        Location: {item.location?.latitude?.toFixed(4)}, {item.location?.longitude?.toFixed(4)}
      </Text>
      {item.description && (
        <Text
          style={[styles.cardDescription, isDarkMode && styles.cardDescriptionDark]}
          numberOfLines={2}
        >
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <ActivityIndicator size="large" color="#067ef5" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.header}>
        <MaterialIcons
          name="arrow-back"
          size={24}
          color={isDarkMode ? '#FFFFFF' : '#000000'}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <Text style={[styles.title, isDarkMode ? styles.titleDark : null]}>
          Created Events
        </Text>
      </View>
      <FlatList
        data={createdEvents}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: isDarkMode ? '#ccc' : '#333' }]}>You haven’t created any events yet.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: { marginRight: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  titleDark: { color: '#FFFFFF' },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  cardDark: { backgroundColor: '#1e1e1e' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  cardTitleDark: { color: '#fff' },
  cardText: { fontSize: 14, color: '#666' },
  cardTextDark: { color: '#ccc' },
  cardDescription: { fontSize: 14, color: '#444', marginTop: 4 },
  cardDescriptionDark: { color: '#bbb' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginVertical: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default CreatedEventsScreen;
