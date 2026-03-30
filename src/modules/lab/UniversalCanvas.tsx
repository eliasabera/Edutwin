import React, { useState, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import { WebView } from "react-native-webview";
import { COLORS } from "../../../shared/constants/colors";
import SliderControl from "./controls/SliderControl";
import { BOYLES_LAW_HTML } from "./canvas-logic/ChemistryLogic";

export default function UniversalCanvas() {
  const webviewRef = useRef<WebView>(null);

  // State for controls
  const [volume, setVolume] = useState(60);
  const [temp, setTemp] = useState(300);

  // State for data coming FROM the canvas
  const [pressure, setPressure] = useState(1.0);

  // Send updates to HTML
  const handleVolumeChange = (val: number) => {
    setVolume(val);
    const script = `
      document.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({ type: 'UPDATE_VOLUME', value: ${val} })
      }));
    `;
    webviewRef.current?.injectJavaScript(script);
  };

  const handleTempChange = (val: number) => {
    setTemp(val);
    const script = `
      document.dispatchEvent(new MessageEvent('message', {
        data: JSON.stringify({ type: 'UPDATE_TEMP', value: ${val} })
      }));
    `;
    webviewRef.current?.injectJavaScript(script);
  };

  // Receive updates FROM HTML
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "STATS") {
        setPressure(data.pressure);
      }
    } catch (e) {
      // Ignore
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. THE 3D WORLD */}
      <View style={styles.canvasContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: BOYLES_LAW_HTML }}
          onMessage={handleMessage}
          style={{ backgroundColor: "#0a0a1a", flex: 1 }}
          // ✅ CRITICAL FIXES FOR TOUCH GESTURES:
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false} // Disable scrolling so OrbitControls works
          overScrollMode="never" // Disable Android overscroll glow
          bounces={false} // Disable iOS bounce
        />

        {/* Overlay Stats */}
        <View style={styles.statsOverlay}>
          <Text style={styles.statLabel}>Pressure</Text>
          <Text style={styles.statValue}>{pressure.toFixed(2)} atm</Text>
        </View>
      </View>

      {/* 2. THE CONTROL PANEL (Native UI) */}
      <View style={styles.controlsPanel}>
        <Text style={styles.panelTitle}>Experiment Controls</Text>

        <SliderControl
          label="Piston Volume"
          value={volume}
          min={20}
          max={100}
          unit="%"
          onValueChange={handleVolumeChange}
        />

        <SliderControl
          label="Temperature"
          value={temp}
          min={200}
          max={500}
          unit="K"
          onValueChange={handleTempChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  canvasContainer: { flex: 2, position: "relative" },

  statsOverlay: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  statLabel: { color: COLORS.textLight, fontSize: 12 },
  statValue: { color: COLORS.secondary, fontSize: 24, fontWeight: "bold" },

  controlsPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 20,
  },
});
