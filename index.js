// @flow
/**
 * Handles HTTP background file uploads from an iOS or Android device.
 */
import { NativeModules, DeviceEventEmitter } from 'react-native'

export type UploadEvent = 'progress' | 'error' | 'completed' | 'cancelled'

export type StartUploadArgs = {
  url: string,
  path: string,
  headers?: Object
}

const NativeModule = NativeModules.VydiaRNFileUploader || NativeModules.RNFileUploader // iOS is VydiaRNFileUploader and Android is NativeModules 
const eventPrefix = 'RNFileUploader-'

// for IOS, register event listeners or else they don't fire on DeviceEventEmitter
if (NativeModules.VydiaRNFileUploader) {
  NativeModule.addListener(eventPrefix + 'progress')
  NativeModule.addListener(eventPrefix + 'error')
  NativeModule.addListener(eventPrefix + 'completed')
}

/*
Gets file information for the path specified.
Example valid path is:
  Android: '/storage/extSdCard/DCIM/Camera/20161116_074726.mp4'
  iOS: 'file:///var/mobile/Containers/Data/Application/3C8A0EFB-A316-45C0-A30A-761BF8CCF2F8/tmp/trim.A5F76017-14E9-4890-907E-36A045AF9436.MOV;

Returns an object:
  If the file exists: {extension: "mp4", size: "3804316", exists: true, mimeType: "video/mp4", name: "20161116_074726.mp4"}
  If the file doesn't exist: {exists: false} and might possibly include name or extension

The promise should never be rejected.
*/
export const getFileInfo = (path: string): Promise<Object> => {
  return NativeModule.getFileInfo(path)
  .then(data => {
    if (data.size) {  // size comes back as a string on android so we convert it here.  if it's already a number this won't hurt anything
      data.size = +data.size
    }
    return data
  })
}

/*
Starts uploading a file to an HTTP endpoint.  
Options object:
{
  url: string.  url to post to.
  path: string.  path to the file on the device
  headers: hash of name/value header pairs
}

Returns a promise with the string ID of the upload.  Will reject if there is a connection problem, the file doesn't exist, or there is some other problem.

It is recommended to add listeners in the .then of this promise.

*/
export const startUpload = (options: StartUploadArgs): Promise<string> => NativeModule.startUpload(options)

/*
Listens for the given event on the given upload ID (resolved from startUpload).  
If you don't supply a value for uploadId, the event will fire for all uploads.
Events (id is always the upload ID):
  progress - { id: string, progress: int (0-100) }
  error - { id: string, error: string }
  completed - { id: string }
*/
export const addListener = (eventType: UploadEvent, uploadId: string, listener: Function) => {
  return DeviceEventEmitter.addListener(eventPrefix + eventType, (data) => {
    if (!uploadId || !data || !data.id || data.id === uploadId) {
      listener(data)
    }
  })
}

export default { startUpload, addListener, getFileInfo }
