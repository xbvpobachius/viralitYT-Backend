import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleContinue = () => {
    if (acceptedTerms && acceptedPrivacy) {
      navigation.navigate('Login' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Welcome Text */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>BIENVENIDOS!</Text>
            <View style={styles.waveLine} />
          </View>

          {/* Logo/App Name */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>VIRALIT</Text>
          </View>

          {/* Thank you message */}
          <Text style={styles.thankYouText}>GRACIAS!</Text>

          {/* Terms Checkboxes */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>TERMINOS SERVICIO</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
            >
              <View style={[styles.checkbox, acceptedPrivacy && styles.checkboxChecked]}>
                {acceptedPrivacy && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>TERMINOS PRIV</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!acceptedTerms || !acceptedPrivacy) && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!acceptedTerms || !acceptedPrivacy}
          >
            <Text style={styles.continueButtonText}>CONTINUAR</Text>
          </TouchableOpacity>

          {/* Optional label */}
          <Text style={styles.optionalLabel}>ONBDAND OPCIONAL</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 1,
  },
  waveLine: {
    width: 120,
    height: 4,
    backgroundColor: '#E50914',
    borderRadius: 2,
  },
  logoContainer: {
    marginVertical: 40,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    color: '#E50914',
    letterSpacing: 4,
  },
  thankYouText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 48,
  },
  termsContainer: {
    width: '100%',
    marginBottom: 40,
    gap: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#E50914',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  optionalLabel: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
});

