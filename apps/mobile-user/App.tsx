import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';

const WEBSITE_URL = 'https://app-dqs7nnc9k54x.vercel.app';

export default function App() {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: WEBSITE_URL }}
        style={styles.webview}
        onLoad={() => setLoading(false)}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" />
          </View>
        )}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
      />
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
        </View>
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
});
