import { View, Text, Image, TouchableOpacity } from 'react-native'
import * as WebBrowser from 'expo-web-browser'

export const FilePreview = ({ fileType, fileUrl }) => {
  if (!fileUrl || !fileType) return null

  if (fileType.startsWith('image/')) {
    return (
      <View className="mt-4 items-center">
        <Text className="text-lg font-semibold mb-2">Image Preview:</Text>
        <Image source={{ uri: fileUrl }} className="w-64 h-64 rounded-lg border" resizeMode="contain" />
      </View>
    )
  }

  if (fileType === 'application/pdf') {
    return (
      <View className="mt-4 items-center">
        <Text className="text-lg font-semibold mb-2">PDF Preview:</Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg"
          onPress={() => WebBrowser.openBrowserAsync(fileUrl)}
        >
          <Text className="text-white font-semibold">Open PDF</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return null
}
