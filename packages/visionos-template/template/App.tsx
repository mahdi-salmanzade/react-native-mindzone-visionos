/**
 * Sample React Native App
 * @format
 */

import * as React from 'react';
import {
  View,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
} from 'react-native';

function App(): React.ReactNode {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = {
    backgroundColor: isDarkMode ? '#181818' : '#ffffff',
    color: isDarkMode ? '#ffffff' : '#181818',
  };

  return (
    <View style={[styles.container, colors]}>
      {/* visionOS has no status bar; rendering one only logs a warning. */}
      {!Platform.isVision && (
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      )}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <Text
          accessibilityRole="header"
          testID="welcome-title"
          style={[styles.title, colors]}>
          Hello, World!
        </Text>
        <Text style={[styles.instructions, colors]}>
          Edit App.tsx to get started.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {flexGrow: 1, justifyContent: 'center', padding: 32},
  title: {fontSize: 32, fontWeight: '600'},
  instructions: {fontSize: 18, marginTop: 16},
});

export default App;
