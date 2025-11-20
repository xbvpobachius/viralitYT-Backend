import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

export default function AddChannelScreen() {
  const [selectedAPI, setSelectedAPI] = useState('YTBY');
  const [channelName, setChannelName] = useState('SPACEVIRALIT');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>AÑADIR CANAL</Text>

          {/* API Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>API:</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text style={styles.dropdownText}>{selectedAPI}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton}>
              <Text style={styles.addButtonText}>AÑADIR API</Text>
            </TouchableOpacity>
          </View>

          {/* Channel Connection */}
          <View style={styles.section}>
            <Text style={styles.label}>CANAL:</Text>
            <View style={styles.channelRow}>
              <Text style={styles.channelPath}>/{channelName}</Text>
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>CONECTAR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Channel Display */}
          <View style={styles.mainChannelContainer}>
            <Text style={styles.mainChannelText}>VIRALIT</Text>
          </View>
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
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#999999',
  },
  addButton: {
    backgroundColor: '#E50914',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelPath: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  connectButton: {
    backgroundColor: '#E50914',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  mainChannelContainer: {
    marginTop: 40,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E50914',
  },
  mainChannelText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#E50914',
    letterSpacing: 2,
  },
});

