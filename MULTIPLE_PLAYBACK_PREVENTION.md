# Multiple Playback Instance Prevention - Summary

## Problem
When users rapidly clicked the play button or during network retries, multiple `Audio.Sound` instances could be created simultaneously, causing:
- Multiple audio streams playing at once
- Resource leaks
- Playback control confusion
- Increased CPU and memory usage

## Solution Implemented

### 1. Dual Lock Mechanism

We implemented a two-level locking system to prevent multiple playback instances:

#### Lock 1: Play Method Lock (`playLock`)
- **Purpose**: Prevents concurrent calls to the `play()` method
- **Scope**: Protects the entire play workflow
- **Release**: Delayed by 1 second to ensure full initialization
- **Location**: `AudioPlayerService.play()`

```typescript
if (this.playLock) {
  console.log('⚠️ Play already in progress, ignoring duplicate request');
  return;
}
this.playLock = true;
```

#### Lock 2: Initialization Lock (`isInitializing`)
- **Purpose**: Prevents multiple `Audio.Sound` instances from being created simultaneously
- **Scope**: Protects sound instance creation
- **Release**: Immediate (via try-finally)
- **Location**: `AudioPlayerService.playRadioStream()`

```typescript
if (this.isInitializing) {
  console.log('⚠️ Sound initialization already in progress');
  // Wait and skip duplicate attempt
  continue;
}
this.isInitializing = true;
```

### 2. Complete Cleanup Mechanism

Ensured locks are released in all scenarios:
- Normal completion (finally blocks)
- Exceptions (catch blocks)
- User stops (stop/cleanup methods)
- Application cleanup (cleanup method)

### 3. Protection Coverage

The protection mechanism covers all entry points:
- ✅ User UI interactions (HomeScreen, StationsScreen, AIAssistantScreen)
- ✅ Automatic retry mechanism
- ✅ Health check mechanism
- ✅ Network reconnection
- ✅ Background/foreground transitions

## Code Changes Summary

### Files Modified
- `src/services/AudioPlayerService.ts`

### Changes Made

1. **Added two lock variables** (lines 39-40):
   ```typescript
   private static isInitializing: boolean = false;
   private static playLock: boolean = false;
   ```

2. **Updated `play()` method** (lines 100-142):
   - Added playLock check and acquisition
   - Added try-finally with delayed lock release
   - Added error handling for immediate lock release

3. **Updated `playRadioStream()` method** (lines 176-295):
   - Added isInitializing check and wait mechanism
   - Wrapped sound creation in try-finally
   - Added detailed logging

4. **Updated `stopInternal()` method** (lines 392-420):
   - Clears isInitializing flag
   - Ensures sound instance is cleaned up
   - Added error handling

5. **Updated `cleanup()` method** (lines 735-788):
   - Releases all locks
   - Added comprehensive logging
   - Ensures cleanup in error scenarios

## Verification

### Key Log Messages
- `🔒 Play lock acquired for station: XXX` - Lock acquired
- `🔓 Play lock released` - Lock released
- `⚠️ Play already in progress, ignoring duplicate request` - Duplicate prevented
- `🔒 Sound initialization lock acquired` - Instance creation started
- `🔓 Sound initialization lock released` - Instance creation completed
- `✅ Sound instance created successfully` - Instance ready
- `✅ Previous sound instance unloaded` - Old instance cleaned

### Testing Scenarios
1. Rapid button clicking - Should only create one instance
2. Quick station switching - Should stop old, start new
3. Network retry during operation - Should not create duplicates
4. Background/foreground transitions - Should maintain single instance

## Benefits

✅ **Prevents multiple audio streams** - Only one instance at a time
✅ **No resource leaks** - Proper cleanup guaranteed
✅ **Better user experience** - Smooth playback without overlaps
✅ **Lower resource usage** - Reduced CPU and memory consumption
✅ **Clear diagnostics** - Comprehensive logging for debugging
✅ **Robust error handling** - Locks released even on errors

## Technical Details

### Why Two Locks?

1. **playLock** (Coarse-grained):
   - Protects entire play workflow
   - Prevents user-triggered concurrency
   - 1-second delayed release ensures initialization completes

2. **isInitializing** (Fine-grained):
   - Protects Sound instance creation
   - Prevents retry-triggered concurrency
   - Immediate release (try-finally)

### Lock Release Timing

- **playLock**: 1 second delay ensures:
  - Audio.Sound fully initialized
  - Network connection established
  - Playback actually started
  - Prevents premature new play requests

- **isInitializing**: Immediate release (try-finally) because:
  - Only protects instance creation
  - Should not block retry mechanism
  - Fast fail-fast recovery

## Summary

This implementation ensures that **at most one Audio.Sound instance exists at any time**, regardless of user actions, network conditions, or system state transitions. The dual-lock mechanism provides comprehensive protection while maintaining system responsiveness and reliability.

## Documentation Files

- `防止多個播放實體說明.md` - Detailed Chinese documentation
- `測試多個播放實體防護.md` - Testing guide in Chinese
- `MULTIPLE_PLAYBACK_PREVENTION.md` - This summary in English

