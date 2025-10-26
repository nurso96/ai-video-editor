#!/usr/bin/env python3
"""
Auto-Editing Pipeline Test
Tests the complete auto-editing functionality including:
- Clip concatenation with transitions
- Caption overlays
- Background music
- Sound effects
- Platform-specific formatting
"""

from pathlib import Path
import httpx
import json

# Configuration
API_BASE = "http://localhost:8000/api"
MEDIA_DIR = Path(__file__).parent / "media"


def test_auto_edit_full_features():
    """Test the full auto-edit endpoint with all features."""
    print("🎬 Testing Auto-Edit Pipeline - Full Features")
    print("=" * 60)

    # Check if we have sample clips
    final_dir = MEDIA_DIR / "final"
    clips = list(final_dir.glob("*.mp4")) if final_dir.exists() else []

    if len(clips) < 2:
        print("⚠️  Need at least 2 video clips in media/final/")
        print("   Creating test data structure...")
        print("\n📋 SETUP NEEDED:")
        print("   1. Place 2+ video clips in: media/final/")
        print("   2. (Optional) Add background music in: media/sfx/")
        print("   3. Run this test again")
        return

    print(f"✅ Found {len(clips)} clips")
    for i, clip in enumerate(clips[:3]):  # Use first 3 clips
        print(f"   - Clip {i+1}: {clip.name}")

    # Build request payload
    request_data = {
        "clips": [
            {
                "path": str(clips[0].absolute()),
                "start_time": 0.0,
                "effects": ["zoom"]  # Add zoom effect to first clip
            },
            {
                "path": str(clips[1].absolute()),
                "start_time": 0.0,
            }
        ],
        "captions": [
            {
                "text": "🚀 AI-Generated Video!",
                "start": 0.5,
                "end": 2.0,
                "position": "bottom",
                "style": "bold"
            },
            {
                "text": "Made with Auto-Editing Pipeline",
                "start": 3.0,
                "end": 5.0,
                "position": "bottom",
                "style": "default"
            }
        ],
        "transitions": "fade",
        "output_resolution": "1080x1920",  # TikTok/YouTube Shorts format
        "output_fps": 30
    }

    # Check for background music
    sfx_dir = MEDIA_DIR / "sfx"
    if sfx_dir.exists():
        music_files = list(sfx_dir.glob("*.mp3")) + list(sfx_dir.glob("*.wav"))
        if music_files:
            print(f"🎵 Adding background music: {music_files[0].name}")
            request_data["music"] = {
                "path": str(music_files[0].absolute()),
                "start": 0.0,
                "volume": 0.3,
                "fade_in": 1.0,
                "fade_out": 2.0
            }

    print("\n📤 Sending request to /api/auto-edit/edit...")
    print(f"   Transitions: {request_data['transitions']}")
    print(f"   Captions: {len(request_data['captions'])}")
    print(f"   Resolution: {request_data['output_resolution']}")

    try:
        with httpx.Client(timeout=300.0) as client:  # 5 min timeout for video processing
            response = client.post(
                f"{API_BASE}/auto-edit/edit",
                json=request_data
            )

            if response.status_code == 200:
                result = response.json()
                print("\n✅ SUCCESS! Video edited successfully")
                print(f"   Output path: {result['output_path']}")
                print(f"   Output URL: {result['output_url']}")
                print(f"   Duration: {result['duration']:.2f}s")
                print(f"\n🎉 Open in browser: http://localhost:8000{result['output_url']}")
                return True
            else:
                print(f"\n❌ Request failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False

    except httpx.ConnectError:
        print("\n❌ Connection failed - is the backend running?")
        print("   Run: uvicorn backend.app:app --reload")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def test_quick_edit():
    """Test the quick-edit endpoint for simple concatenation."""
    print("\n\n🚀 Testing Quick-Edit - Simple Concatenation")
    print("=" * 60)

    final_dir = MEDIA_DIR / "final"
    clips = list(final_dir.glob("*.mp4")) if final_dir.exists() else []

    if len(clips) < 2:
        print("⚠️  Need at least 2 video clips in media/final/")
        return

    clip_paths = [str(clip.absolute()) for clip in clips[:2]]

    print(f"✅ Using {len(clip_paths)} clips")

    try:
        with httpx.Client(timeout=300.0) as client:
            response = client.post(
                f"{API_BASE}/auto-edit/quick-edit",
                params={
                    "add_captions": True,
                    "add_music": False,
                    "platform": "tiktok"
                },
                json=clip_paths
            )

            if response.status_code == 200:
                result = response.json()
                print("\n✅ Quick edit successful!")
                print(f"   Output path: {result['output_path']}")
                print(f"   Output URL: {result['output_url']}")
                return True
            else:
                print(f"\n❌ Request failed: {response.status_code}")
                print(f"   Error: {response.text}")
                return False

    except httpx.ConnectError:
        print("\n❌ Connection failed - is the backend running?")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


def check_backend_health():
    """Check if backend is running and healthy."""
    print("🏥 Checking backend health...")
    try:
        with httpx.Client() as client:
            response = client.get(f"{API_BASE}/healthz")
            if response.status_code == 200:
                health = response.json()
                print(f"✅ Backend healthy: {health['status']}")
                print(f"   Redis: {'✅' if health['redis'] else '❌'}")
                return True
            else:
                print(f"❌ Backend unhealthy: {response.status_code}")
                return False
    except httpx.ConnectError:
        print("❌ Backend not running")
        print("\n📋 To start backend:")
        print("   cd /home/nick/ai-video-editor")
        print("   ./scripts/dev_all.sh")
        print("   OR")
        print("   uvicorn backend.app:app --reload")
        return False


def main():
    """Run all tests."""
    print("\n" + "🎥" * 30)
    print("AUTO-EDITING PIPELINE TEST SUITE")
    print("🎥" * 30 + "\n")

    # Check backend
    if not check_backend_health():
        return

    # Run tests
    test_auto_edit_full_features()
    # test_quick_edit()  # Uncomment to test quick-edit

    print("\n" + "=" * 60)
    print("✅ Testing complete!")
    print("\n📖 Next steps:")
    print("   1. Check the generated video in media/final/")
    print("   2. Test other features (music, SFX, effects)")
    print("   3. Try the quick-edit endpoint")
    print("   4. Integrate with frontend")


if __name__ == "__main__":
    main()
