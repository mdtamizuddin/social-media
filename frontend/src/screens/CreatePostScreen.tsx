import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { Colors } from '../theme/colors';

const CREATE_POST_MUTATION = gql`
  mutation CreatePost($caption: String!, $media: [String!]!) {
    createPost(caption: $caption, media: $media) {
      _id
      caption
      mediaUrls
      reactionCount
      commentCount
      createdAt
      authorId {
        _id
        username
        displayName
        avatarUrl
      }
    }
  }
`;

export const CreatePostScreen = ({ navigation }: any) => {
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [createPost, { loading }] = useMutation(CREATE_POST_MUTATION, {
    refetchQueries: ['HomeFeed'],
    onCompleted: () => {
      Alert.alert('Success', 'Post created successfully!');
      navigation.goBack();
    },
    onError: (err) => {
      Alert.alert('Post Failed', err.message);
    },
  });

  const selectImage = async (useCamera: boolean) => {
    try {
      let permissionResult;
      if (useCamera) {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access media is required.');
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 || null);
      }
    } catch (error) {
      Alert.alert('Error picking image', 'An error occurred while picking an image.');
    }
  };

  const handlePost = () => {
    if (!caption.trim() && !imageBase64) {
      Alert.alert('Empty Post', 'Please write a caption or add an image.');
      return;
    }

    const mediaList = imageBase64 ? [imageBase64] : [];
    createPost({
      variables: {
        caption: caption.trim(),
        media: mediaList,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Post Form */}
        <View style={styles.formContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="What's on your mind?..."
            placeholderTextColor={Colors.textDim}
            multiline
            numberOfLines={5}
            value={caption}
            onChangeText={setCaption}
            maxLength={500}
          />

          {imageUri && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
                }}
              >
                <Text style={styles.removeImageText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Media Attach Options */}
          <View style={styles.mediaButtonsRow}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => selectImage(false)}
            >
              <Text style={styles.mediaButtonText}>🖼️ Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => selectImage(true)}
            >
              <Text style={styles.mediaButtonText}>📸 Camera</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.postButton}
            onPress={handlePost}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.postButtonText}>Share Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    padding: 16,
    flexGrow: 1,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  captionInput: {
    backgroundColor: Colors.surfaceCard,
    color: Colors.text,
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mediaButton: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  mediaButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  postButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  postButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
