import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { styles } from '../styles/MapPageStyle';
import { getManeuverIcon, getManeuverText, cancelRide } from '../services/driveHelpers';

const StepsBar = ({
  instructions,
  currentStepIndex,
  eta,
  showAllSteps,
  setShowAllSteps,
  destination,
  isMenuVisible,
  setDestination,
  setInstructions,
  setCurrentStepIndex,
}) => {
  if (instructions.length === 0 || isMenuVisible) return null;

  return (
    <View style={styles.instructionsContainer}>
      <TouchableOpacity
        style={styles.instructionsHeader}
        onPress={() => setShowAllSteps(!showAllSteps)}
      >
        <View style={styles.etaContainer}>
          <Text style={styles.etaText}>
            Arrival: {eta?.arrivalTime} ({eta?.remainingTime})
          </Text>
        </View>
        <Text style={styles.heading}>Next Step:</Text>
        <View style={styles.stepRow}>
          {getManeuverIcon(instructions[currentStepIndex]?.maneuver)}
          <Text style={styles.stepText}>
            {getManeuverText(
              instructions[currentStepIndex]?.maneuver,
              instructions[currentStepIndex]?.instruction
            )}{' '}
            in {instructions[currentStepIndex]?.distance} meters
          </Text>

          {destination && !isMenuVisible && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() =>
                cancelRide(setDestination, setInstructions, setCurrentStepIndex)
              }
            >
              <MaterialIcons name="cancel" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {showAllSteps && (
        <ScrollView
          style={styles.allStepsContainer}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {instructions.map((step, index) => (
            <View
              key={index}
              style={[
                styles.stepItem,
                index === currentStepIndex && styles.currentStepItem,
              ]}
            >
              <View style={styles.stepIconContainer}>
                {getManeuverIcon(step.maneuver)}
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepItemText}>
                  {getManeuverText(step.maneuver, step.instruction)} in {step.distance} meters
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default StepsBar;
