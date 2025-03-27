import { useState } from 'react';
import { Alert } from 'react-native';
import { useMutation } from 'react-query';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { generateImage, ImageGenerationParams } from '../api/imageGenerationApi';
import { createGenerationInstruction } from '../utils/promptModifier';

interface UseImageGenerationOptions {
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: Error) => void;
}

interface GenerationParams {
  prompt: string;
  styleId: string;
  additionalInstructions?: string;
}

export function useImageGeneration(options?: UseImageGenerationOptions) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Image mutation with react-query
  const mutation = useMutation(
    async ({ prompt, styleId, additionalInstructions }: GenerationParams) => {
      // Create the enhanced prompt with style modifiers
      const enhancedPrompt = createGenerationInstruction(
        styleId,
        prompt,
        additionalInstructions
      );

      // Prepare params for the API
      const params: ImageGenerationParams = {
        prompt: enhancedPrompt,
        style: styleId,
      };

      // If there's a selected image, add it to the params
      if (selectedImage) {
        // Convert image URI to base64
        const base64 = await FileSystem.readAsStringAsync(selectedImage, {
          encoding: FileSystem.EncodingType.Base64,
        });
        params.inputImage = `data:image/jpeg;base64,${base64}`;
      }

      // Call the API to generate the image
      return generateImage(params);
    },
    {
      onSuccess: (data) => {
        // Clear the selected image after successful generation
        setSelectedImage(null);
        
        // Call the onSuccess callback if provided
        if (options?.onSuccess) {
          options.onSuccess(data.imageUrl);
        }
      },
      onError: (error: Error) => {
        Alert.alert('Generation Failed', error.message);
        
        // Call the onError callback if provided
        if (options?.onError) {
          options.onError(error);
        }
      },
    }
  );

  // Function to pick an image from the device's library
  const pickImage = async () => {
    try {
      // Request permission to access the image library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos.'
        );
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Compress and resize the image for better performance
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setSelectedImage(manipResult.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick an image');
      console.error('Error picking image:', error);
    }
  };

  // Function to take a photo with the device's camera
  const takePhoto = async () => {
    try {
      // Request permission to access the camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera.'
        );
        return;
      }

      // Launch the camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // Compress and resize the image for better performance
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1024 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        setSelectedImage(manipResult.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take a photo');
      console.error('Error taking photo:', error);
    }
  };

  // Function to clear the selected image
  const clearSelectedImage = () => {
    setSelectedImage(null);
  };

  return {
    generateImage: mutation.mutate,
    isGenerating: mutation.isLoading,
    generatedImage: mutation.data?.imageUrl,
    error: mutation.error,
    selectedImage,
    pickImage,
    takePhoto,
    clearSelectedImage,
  };
}