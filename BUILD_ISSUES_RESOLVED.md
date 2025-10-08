# 构建问题解决记录
# Build Issues Resolved

## 📅 2025-10-08

### ❌ 问题 1: CMake Clean 失败

**错误信息**:
```
CMake Error: add_subdirectory given source which is not an existing directory
ninja: error: rebuilding 'build.ninja': subcommand failed
```

**原因**: 
- 执行 `gradlew clean` 后，删除了 CMake 需要的 codegen 目录
- CMake 缓存损坏

**解决方案**:
```bash
# 1. 删除损坏的 CMake 缓存
rm -rf android/.cxx android/app/.cxx

# 2. 重新运行 prebuild 生成必要文件
npx expo prebuild --clean

# 3. 直接构建（不要用 clean）
cd android && ./gradlew assembleRelease
```

**教训**: ⚠️ **不要在 Expo 项目中使用 `gradlew clean`**，会删除自动生成的文件。

---

### ❌ 问题 2: AndroidX 依赖冲突 (再次出现)

**错误信息**:
```
Duplicate class android.support.v4.app.INotificationSideChannel 
found in modules androidx.core:core:1.16.0 and com.android.support:support-compat:28.0.0
```

**原因**: 
- `npx expo prebuild --clean` 重新生成了原生代码
- 重置了 `gradle.properties`，移除了 `android.enableJetifier=true`

**解决方案**:
```properties
# android/gradle.properties
android.useAndroidX=true
android.enableJetifier=true  # ← 重新添加
```

**教训**: ⚠️ 每次运行 `prebuild --clean` 后，需要重新配置 `gradle.properties`

---

## ✅ 最终构建成功

### 构建命令
```bash
cd android && ./gradlew assembleRelease --no-daemon
```

### 构建结果
- ✅ **状态**: BUILD SUCCESSFUL
- ⏱️ **时间**: 4分32秒
- 📦 **任务**: 699 actionable tasks (387 executed, 312 up-to-date)
- 📍 **APK 位置**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔧 正确的构建流程

### 方法 1: 正常增量构建（推荐）

```bash
# 直接构建，不要 clean
cd android
./gradlew assembleRelease
```

### 方法 2: 完全重新构建

```bash
# 1. 删除 CMake 缓存（而不是用 gradlew clean）
rm -rf android/.cxx android/app/.cxx

# 2. 重新 prebuild
npx expo prebuild --clean

# 3. 重新配置 gradle.properties
echo "android.enableJetifier=true" >> android/gradle.properties

# 4. 构建
cd android && ./gradlew assembleRelease
```

### 方法 3: 使用 Expo 构建

```bash
# 开发构建
npx expo run:android --variant release

# EAS 云端构建（最可靠）
eas build -p android --profile production
```

---

## 📝 重要配置文件

### 1. `android/gradle.properties`

**必须包含**:
```properties
android.useAndroidX=true
android.enableJetifier=true  # ← 关键！
```

### 2. `android/local.properties`

**必须包含**:
```properties
sdk.dir=/home/meson/Android/Sdk
```

---

## 🚫 避免的错误

### ❌ 不要做

1. **不要使用 `gradlew clean`**
   ```bash
   # ❌ 错误
   cd android && ./gradlew clean
   ```
   
   **原因**: 会删除自动生成的 codegen 文件

2. **不要忘记重新配置 gradle.properties**
   ```bash
   # ❌ 错误
   npx expo prebuild --clean
   cd android && ./gradlew assembleRelease  # 会失败
   ```
   
   **正确**:
   ```bash
   npx expo prebuild --clean
   # 重新添加 jetifier
   echo "android.enableJetifier=true" >> android/gradle.properties
   cd android && ./gradlew assembleRelease
   ```

### ✅ 应该做

1. **使用增量构建**
   ```bash
   cd android && ./gradlew assembleRelease
   ```

2. **如果需要清理，删除特定目录**
   ```bash
   rm -rf android/.cxx android/app/.cxx
   rm -rf android/app/build
   ```

3. **确保配置文件完整**
   ```bash
   # 检查 jetifier
   grep "enableJetifier" android/gradle.properties
   
   # 检查 SDK 路径
   grep "sdk.dir" android/local.properties
   ```

---

## 🎯 快速问题排查

### 问题: CMake 错误

**检查**:
```bash
# 1. 删除缓存
rm -rf android/.cxx android/app/.cxx

# 2. 重新 prebuild
npx expo prebuild --clean
```

### 问题: 依赖冲突

**检查**:
```bash
# 确认 jetifier 已启用
grep "enableJetifier" android/gradle.properties

# 如果没有，添加它
echo "android.enableJetifier=true" >> android/gradle.properties
```

### 问题: SDK 未找到

**检查**:
```bash
# 检查 SDK 路径
cat android/local.properties

# 如果为空，添加路径
echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
```

---

## 📚 相关文档

- [ANDROID_SDK_SETUP_SUCCESS.md](./ANDROID_SDK_SETUP_SUCCESS.md) - SDK 配置成功记录
- [BUILD_APK_GUIDE.md](./BUILD_APK_GUIDE.md) - 完整构建指南
- [NOTIFICATION_FIX.md](./NOTIFICATION_FIX.md) - 通知问题修复

---

## 🎉 总结

| 问题 | 解决方案 | 状态 |
|------|----------|------|
| CMake clean 失败 | 使用 `rm -rf .cxx` + `prebuild` | ✅ 已解决 |
| AndroidX 依赖冲突 | 启用 `android.enableJetifier=true` | ✅ 已解决 |
| 通知频繁发送 | 添加防抖机制 | ✅ 已解决 |
| APK 构建成功 | 使用正确的构建流程 | ✅ 完成 |

**当前 APK**: `android/app/build/outputs/apk/release/app-release.apk` (81MB)

---

**最后更新**: 2025-10-08  
**状态**: ✅ 所有问题已解决，构建成功
