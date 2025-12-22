import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';

interface CustomCameraProps {
  visible: boolean;
  onClose: () => void;
  onMediaCaptured: (asset: { uri: string, type: 'image' | 'video' }) => void;
}

export default function CustomCamera({ visible, onClose, onMediaCaptured }: CustomCameraProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [mode, setMode] = useState<'picture' | 'video'>('picture');
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  useEffect(() => {
    if (visible && (!permission?.granted || !micPermission?.granted)) {
        requestPermission();
        requestMicPermission();
    }
  }, [visible]);

  if (!permission || !micPermission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted || !micPermission.granted) {
    // Camera permissions are not granted yet.
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
            <Text style={{ textAlign: 'center', color: 'white' }}>We need your permission to show the camera</Text>
            <TouchableOpacity onPress={() => { requestPermission(); requestMicPermission(); }} style={styles.permissionBtn}>
                <Text style={styles.text}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.permissionBtn, { marginTop: 10, backgroundColor: 'red' }]}>
                <Text style={styles.text}>Cancel</Text>
            </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                skipProcessing: true // Faster
            });
            onMediaCaptured({ uri: photo.uri, type: 'image' });
            onClose();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to capture photo");
        }
    }
  };

  const recordVideo = async () => {
    if (cameraRef.current) {
        if (isRecording) {
            cameraRef.current.stopRecording();
            setIsRecording(false);
        } else {
            setIsRecording(true);
            try {
                const videoCallback = await cameraRef.current.recordAsync({
                    maxDuration: 60,
                });
                onMediaCaptured({ uri: videoCallback.uri, type: 'video' });
                onClose();
            } catch (e) {
                console.error(e);
                setIsRecording(false); // Reset on error
                // Error alert might duplicate if stopped manually, silently handle or log
            }
        }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.container}>
            <CameraView 
                style={styles.camera} 
                facing={facing} 
                mode={mode}
                ref={cameraRef}
            >
                <View style={styles.controlsContainer}>
                    {/* Top Controls */}
                    <View style={styles.topControls}>
                        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                            <Ionicons name="close" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleCamera} style={styles.iconButton}>
                            <Ionicons name="camera-reverse-outline" size={30} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Controls */}
                    <View style={styles.bottomControls}>
                        {/* Mode Switcher */}
                        {!isRecording && (
                            <View style={styles.modeSwitcher}>
                                <TouchableOpacity onPress={() => setMode('picture')}>
                                    <Text style={[styles.modeText, mode === 'picture' && styles.activeMode]}>PHOTO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setMode('video')}>
                                    <Text style={[styles.modeText, mode === 'video' && styles.activeMode]}>VIDEO</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Shutter Button */}
                        <TouchableOpacity 
                            style={[
                                styles.shutterButton, 
                                mode === 'video' ? styles.videoShutter : styles.photoShutter,
                                isRecording && styles.recordingShutter
                            ]}
                            onPress={mode === 'picture' ? takePicture : recordVideo}
                        >
                            {isRecording && <View style={styles.stopIcon} />}
                        </TouchableOpacity>
                    </View>
                </View>
            </CameraView>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
      flex: 1,
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: 50,
  },
  topControls: {
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  iconButton: {
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 50,
  },
  bottomControls: {
      alignItems: 'center',
      marginBottom: 30,
      gap: 20,
  },
  modeSwitcher: {
      flexDirection: 'row',
      backgroundColor: 'rgba(0,0,0,0.4)',
      borderRadius: 20,
      padding: 5,
  },
  modeText: {
      color: '#ccc',
      fontWeight: 'bold',
      paddingHorizontal: 15,
      paddingVertical: 5,
      fontSize: 12,
  },
  activeMode: {
      color: 'gold', // Standard pro color or theme color
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 15,
      overflow: 'hidden',
  },
  shutterButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 5,
      borderColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
  },
  photoShutter: {
      backgroundColor: 'white',
  },
  videoShutter: {
      backgroundColor: 'red',
  },
  recordingShutter: {
      backgroundColor: 'transparent', // Show stop icon inside
      borderColor: 'red',
  },
  stopIcon: {
      width: 30,
      height: 30,
      backgroundColor: 'red',
      borderRadius: 4,
  },
  permissionBtn: {
      padding: 15,
      backgroundColor: COLORS.primary || 'blue',
      borderRadius: 10,
      marginHorizontal: 50,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
