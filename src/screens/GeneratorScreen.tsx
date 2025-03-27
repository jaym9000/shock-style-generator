import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import { useStyles } from '../contexts/StylesContext';
import { useImageGeneration } from '../hooks/useImageGeneration';

export function GeneratorScreen() {
  const { styles } = useStyles();
  const [prompt, setPrompt] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const promptInputRef = useRef<TextInput>(null);

  // Initialize the image generation hook
  const {
    generateImage,
    isGenerating,
    selectedImage,
    pickImage,
    takePhoto,
    clearSelectedImage,
  } = useImageGeneration({
    onSuccess: (imageUrl) => {
      setGeneratedImageUrl(imageUrl);
      // Clear the prompt after successful generation
      setPrompt('');
    },
  });

  // Function to handle the generate button press
  const handleGenerate = () => {
    if (!prompt.trim()) {
      Alert.alert('Missing Prompt', 'Please enter a prompt to generate an image.');
      return;
    }

    if (!selectedStyleId) {
      Alert.alert('Missing Style', 'Please select a style for your image.');
      return;
    }

    // Call the generate function from the hook
    generateImage({
      prompt,
      styleId: selectedStyleId,
    });
  };

  // Function to share the generated image
  const shareImage = async () => {
    if (!generatedImageUrl) return;

    try {
      // Download the image to a local file
      const localUri = FileSystem.documentDirectory + 'shared-image.jpg';
      await FileSystem.downloadAsync(generatedImageUrl, localUri);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing is not available on this device');
        return;
      }

      // Share the image
      await Sharing.shareAsync(localUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to share the image');
      console.error('Error sharing image:', error);
    }
  };

  // Function to reset the generator
  const resetGenerator = () => {
    setGeneratedImageUrl(null);
    setPrompt('');
    setSelectedStyleId('');
    clearSelectedImage();
    // Focus back on the prompt input
    promptInputRef.current?.focus();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Shock Style Generator</Text>

          {/* Style Selection */}
          <Text style={styles.sectionTitle}>1. Choose a Style</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.styleCards}
          >
            {styles.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  selectedStyleId === style.id && styles.selectedStyleCard,
                ]}
                onPress={() => setSelectedStyleId(style.id)}
              >
                <Image
                  source={{ uri: style.previewImage }}
                  style={styles.stylePreview}
                  contentFit="cover"
                  transition={300}
                />
                <Text style={styles.styleName}>{style.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Image Selection */}
          <Text style={styles.sectionTitle}>2. Add Image (Optional)</Text>
          <View style={styles.imageInputContainer}>
            {selectedImage ? (
              <View style={styles.selectedImageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                  contentFit="cover"
                  transition={300}
                />
                <TouchableOpacity
                  style={styles.clearImageButton}
                  onPress={clearSelectedImage}
                >
                  <Ionicons name="close-circle" size={24} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePickerButtons}>
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Ionicons name="image" size={24} color="#007AFF" />
                  <Text style={styles.imageButtonText}>Choose Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={24} color="#007AFF" />
                  <Text style={styles.imageButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Prompt Input */}
          <Text style={styles.sectionTitle}>3. Enter Your Prompt</Text>
          <TextInput
            ref={promptInputRef}
            style={styles.promptInput}
            placeholder="Describe what you want to generate..."
            placeholderTextColor="#888"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          {/* Generate Button */}
          <TouchableOpacity
            style={[styles.generateButton, (!prompt || !selectedStyleId) && styles.disabledButton]}
            onPress={handleGenerate}
            disabled={!prompt || !selectedStyleId || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.generateButtonText}>Generate Image</Text>
            )}
          </TouchableOpacity>

          {/* Generated Image Display */}
          {generatedImageUrl && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Generated Image</Text>
              <Image
                source={{ uri: generatedImageUrl }}
                style={styles.generatedImage}
                contentFit="cover"
                transition={500}
              />
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={shareImage}>
                  <Ionicons name="share-outline" size={24} color="white" />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={resetGenerator}>
                  <Ionicons name="refresh-outline" size={24} color="white" />
                  <Text style={styles.actionButtonText}>New Image</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 24,
    marginBottom: 12,
  },
  styleCards: {
    paddingVertical: 8,
  },
  styleCard: {
    width: 100,
    height: 140,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedStyleCard: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  stylePreview: {
    width: '100%',
    height: 100,
  },
  styleName: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    padding: 8,
  },
  imageInputContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 12,
    marginTop: 8,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  imageButton: {
    alignItems: 'center',
    padding: 16,
  },
  imageButtonText: {
    marginTop: 8,
    color: '#007AFF',
  },
  selectedImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  clearImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  promptInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 24,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  generatedImage: {
    width: '100%',
    height: 320,
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default GeneratorScreen;