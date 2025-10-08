package com.meson.mesonradio

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

/**
 * React Native 模組 - 前台服務控制
 */
class AudioForegroundServiceModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String {
        return "AudioForegroundService"
    }
    
    @ReactMethod
    fun startService(stationName: String, promise: Promise) {
        try {
            AudioForegroundService.startService(reactApplicationContext, stationName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_SERVICE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            AudioForegroundService.stopService(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_SERVICE_ERROR", e.message, e)
        }
    }
    
    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            promise.resolve(AudioForegroundService.isRunning())
        } catch (e: Exception) {
            promise.reject("CHECK_SERVICE_ERROR", e.message, e)
        }
    }
}

