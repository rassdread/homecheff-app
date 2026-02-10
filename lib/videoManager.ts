/**
 * Global Video Manager
 * Ensures only one video plays with sound at a time across all components
 */

class VideoManager {
  private allVideos: Set<HTMLVideoElement> = new Set();
  private currentlyPlayingVideo: HTMLVideoElement | null = null;

  /**
   * Register a video element
   */
  register(video: HTMLVideoElement) {
    this.allVideos.add(video);
  }

  /**
   * Unregister a video element
   */
  unregister(video: HTMLVideoElement) {
    this.allVideos.delete(video);
    if (this.currentlyPlayingVideo === video) {
      this.currentlyPlayingVideo = null;
    }
  }

  /**
   * Stop all videos except the specified one
   * If a video is provided, it will be the only one playing
   * If null is provided, all videos will be stopped
   */
  stopAllExcept(exceptVideo: HTMLVideoElement | null) {
    this.allVideos.forEach((video) => {
      if (video && video !== exceptVideo) {
        // Pause and reset all other videos
        video.pause();
        video.currentTime = 0;
      }
    });
    this.currentlyPlayingVideo = exceptVideo;
  }

  /**
   * Start playing a video (stops all others first)
   */
  playVideo(video: HTMLVideoElement) {
    // Stop all other videos first
    this.stopAllExcept(video);
    
    // Play the requested video
    if (video && video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay might be blocked - this is normal
        });
      }
    }
  }

  /**
   * Get the currently playing video
   */
  getCurrentlyPlaying(): HTMLVideoElement | null {
    return this.currentlyPlayingVideo;
  }

  /**
   * Check if a video is currently playing
   */
  isPlaying(video: HTMLVideoElement): boolean {
    return this.currentlyPlayingVideo === video && !video.paused;
  }
}

// Singleton instance
export const videoManager = new VideoManager();







