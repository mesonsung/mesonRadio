package com.meson.mesonradio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * 音頻前台服務 - 確保鎖屏後應用不被系統殺掉
 * Audio Foreground Service - Prevents system from killing the app after screen lock
 */
class AudioForegroundService : Service() {
    
    private var wakeLock: PowerManager.WakeLock? = null
    private val CHANNEL_ID = "audio_foreground_service"
    private val NOTIFICATION_ID = 1001
    
    companion object {
        private var isServiceRunning = false
        
        fun startService(context: Context, stationName: String) {
            if (!isServiceRunning) {
                val intent = Intent(context, AudioForegroundService::class.java)
                intent.putExtra("STATION_NAME", stationName)
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
                isServiceRunning = true
            }
        }
        
        fun stopService(context: Context) {
            if (isServiceRunning) {
                val intent = Intent(context, AudioForegroundService::class.java)
                context.stopService(intent)
                isServiceRunning = false
            }
        }
        
        fun isRunning(): Boolean {
            return isServiceRunning
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        
        // 創建通知頻道
        createNotificationChannel()
        
        // 獲取 WakeLock（防止 CPU 休眠）
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "mesonRadio::AudioWakeLock"
        )
        wakeLock?.acquire(10*60*60*1000L) // 10小時
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val stationName = intent?.getStringExtra("STATION_NAME") ?: "mesonRadio"
        
        // 創建通知
        val notification = createNotification(stationName)
        
        // 啟動前台服務（關鍵！）
        startForeground(NOTIFICATION_ID, notification)
        
        // START_STICKY: 服務被殺掉後自動重啟
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // 釋放 WakeLock
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        
        isServiceRunning = false
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "背景播放",  // 簡短名稱
                NotificationManager.IMPORTANCE_MIN  // 最低重要性 - 不會發出聲音、不震動、不彈出
            ).apply {
                description = "保持音頻播放運行"
                setShowBadge(false)  // 不顯示角標
                enableLights(false)  // 不閃燈
                enableVibration(false)  // 不震動
                setSound(null, null)  // 不發出聲音
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(stationName: String): Notification {
        // 點擊通知返回應用
        val intent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🎵 $stationName")  // 電台名稱作為標題，更簡潔
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setOngoing(true) // 持續通知（前台服務必須）
            .setPriority(NotificationCompat.PRIORITY_MIN)  // 最低優先級 - 最不顯眼
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setShowWhen(false)  // 不顯示時間
            .setSound(null)  // 靜音
            .setVibrate(null)  // 不震動
            .setOnlyAlertOnce(true)  // 只提醒一次
            .setSilent(true)  // 完全靜音
            .build()
    }
}

