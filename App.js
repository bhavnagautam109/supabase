import 'react-native-get-random-values'
import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Animated,
  Image,
  ScrollView,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { v4 as uuidv4 } from 'uuid'
import * as FileSystem from 'expo-file-system'
import * as WebBrowser from 'expo-web-browser'
import { getFileBuffer } from './getFileBuffer'
import { supabase } from './supabase'
import { isValidFile } from './utils/fileValidation'

const { width, height } = Dimensions.get('window')

const FilePreview = ({ fileType, fileUrl }) => {
  if (!fileUrl || !fileType) return null

  if (fileType.startsWith('image/')) {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Image Preview:</Text>
        <View style={styles.imageContainer}>
          <Image source={{ uri: fileUrl }} style={styles.previewImage} resizeMode="contain" />
        </View>
      </View>
    )
  }

  if (fileType === 'application/pdf') {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>PDF Preview:</Text>
        <TouchableOpacity
          style={styles.pdfButton}
          onPress={() => WebBrowser.openBrowserAsync(fileUrl)} // this is open 
          activeOpacity={0.8}
        >
          <Text style={styles.pdfButtonText}>📄 Open PDF</Text> 
        </TouchableOpacity>
      </View>
    )
  }

  return null
}

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null)
  const [uploadedFileType, setUploadedFileType] = useState(null)
  const [uploadProgress] = useState(new Animated.Value(0))

  const pickDocument = async () => {
    try {
      setUploadError(null)
      setUploadedFileUrl(null)
      setUploadedFileType(null)
      setSelectedFile(null)

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'application/pdf'],
        copyToCacheDirectory: true,
      })

      if (result.canceled) {
        setUploadError('No file selected.')
        return
      }

      const fileAsset = result.assets[0]
      const { isValid, errorMessage } = isValidFile(fileAsset)

      if (!isValid) {
        setUploadError(errorMessage)
        return
      }

      setSelectedFile(result)
      await uploadFile(fileAsset)
    } catch (error) {
      console.error('Error picking document:', error)
      setUploadError(`Error picking file: ${error.message}`)
    }
  }

  const uploadFile = async (fileAsset) => {
    setUploading(true)
    setUploadError(null)

    // Animate progress bar
    Animated.timing(uploadProgress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start()

    try {
      if (!fileAsset.uri || !fileAsset.mimeType) {
        throw new Error('File URI or MIME type is missing.')
      }

      const fileExtension = fileAsset.mimeType.split('/')[1] || 'bin'
      const fileName = `${uuidv4()}.${fileExtension}`
      const filePath = `uploads/${fileName}`

      const fileBuffer = await getFileBuffer(fileAsset.uri)

      const { error } = await supabase.storage
        .from('uploads')
        .upload(filePath, fileBuffer, {
          contentType: fileAsset.mimeType,
          upsert: false,
        })

      if (error) {
        throw error
      }

      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      if (publicUrlData?.publicUrl) {
        setUploadedFileUrl(publicUrlData.publicUrl)
        setUploadedFileType(fileAsset.mimeType)
      } else {
        throw new Error('Could not get public URL for the uploaded file.')
      }

      Alert.alert('Success', 'File uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      uploadProgress.setValue(0)
    }
  }

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('image')) return '🖼️'
    if (mimeType?.includes('pdf')) return '📄'
    return '📁'
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>📁 File Uploader</Text>
          <Text style={styles.subtitle}>Upload your documents securely</Text>
        </View>

        {/* Upload Area */}
        <View style={styles.uploadArea}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              uploading && styles.uploadButtonDisabled
            ]}
            onPress={pickDocument}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.uploadIcon}>☁️</Text>
              <Text style={styles.buttonText}>
                {uploading ? 'Uploading...' : 'Select File'}
              </Text>
              <Text style={styles.buttonSubtext}>
                PNG, JPEG, or PDF files  
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* File Info */}
        {selectedFile?.assets?.length > 0 && (
          <View style={styles.fileInfo}>
            <View style={styles.fileCard}>
              <Text style={styles.fileIcon}>
                {getFileIcon(selectedFile.assets[0].mimeType)}
              </Text>
              <View style={styles.fileDetails}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {selectedFile.assets[0].name}
                </Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.assets[0].size / (1024 * 1024)).toFixed(2)} MB
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Upload Progress */}
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: uploadProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.loadingText}>Uploading your file...</Text>
            </View>
          </View>
        )}

        {/* Error Message */}
        {uploadError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{uploadError}</Text>
          </View>
        )}

        {/* Success State */}
        {uploadedFileUrl && !uploading && (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>File uploaded successfully!</Text>
          </View>
        )}

        {/* File Preview */}
        <ScrollView contentContainerStyle={{paddingBottom:'19%'}}>

        <FilePreview fileType={uploadedFileType} fileUrl={uploadedFileUrl} />
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  uploadArea: {
    marginBottom: 30,
  },
  uploadButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 4,
    shadowOpacity: 0.2,
  },
  buttonContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#D1FAE5',
  },
  fileInfo: {
    marginBottom: 20,
  },
  fileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  successContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  successIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  // FilePreview styles
  previewContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  imageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewImage: {
    width: 256,
    height: 256,
    borderRadius: 8,
  },
  pdfButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
})