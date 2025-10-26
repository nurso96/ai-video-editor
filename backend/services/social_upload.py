"""
Social Media Upload Service
Supports YouTube Shorts, TikTok, Instagram Reels
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

LOGGER = logging.getLogger(__name__)


@dataclass
class UploadResult:
    platform: str
    success: bool
    video_id: Optional[str] = None
    url: Optional[str] = None
    error: Optional[str] = None


class YouTubeShortsUploader:
    """
    Upload videos to YouTube Shorts using Google API.

    Setup:
    1. Create project at https://console.cloud.google.com/
    2. Enable YouTube Data API v3
    3. Create OAuth 2.0 credentials
    4. Download client_secret.json
    5. Set GOOGLE_CLIENT_SECRET_FILE env var
    """

    def __init__(self):
        self.credentials = None
        self.youtube = None
        self.client_secret_file = os.getenv("GOOGLE_CLIENT_SECRET_FILE", "client_secret.json")

    def authenticate(self):
        """Authenticate with Google OAuth."""
        try:
            from google.auth.transport.requests import Request
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from googleapiclient.discovery import build

            SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

            creds = None
            token_file = "youtube_token.json"

            # Load existing credentials
            if os.path.exists(token_file):
                creds = Credentials.from_authorized_user_file(token_file, SCOPES)

            # Refresh or get new credentials
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    if not os.path.exists(self.client_secret_file):
                        raise FileNotFoundError(
                            f"Client secret not found: {self.client_secret_file}. "
                            "Download from Google Cloud Console."
                        )

                    flow = InstalledAppFlow.from_client_secrets_file(self.client_secret_file, SCOPES)
                    creds = flow.run_local_server(port=0)

                # Save credentials
                with open(token_file, "w") as token:
                    token.write(creds.to_json())

            self.credentials = creds
            self.youtube = build("youtube", "v3", credentials=creds)
            LOGGER.info("YouTube authentication successful")
            return True

        except ImportError:
            LOGGER.error("Install google-api-python-client: pip install google-api-python-client google-auth-oauthlib")
            return False
        except Exception as e:
            LOGGER.error(f"YouTube authentication failed: {e}")
            return False

    def upload(
        self,
        video_path: Path,
        title: str,
        description: str,
        tags: Optional[List[str]] = None,
        category_id: str = "22",  # People & Blogs
    ) -> UploadResult:
        """
        Upload video to YouTube as a Short.

        Args:
            video_path: Path to video file
            title: Video title (max 100 chars for shorts)
            description: Video description (include #Shorts)
            tags: List of tags
            category_id: YouTube category ID

        Returns:
            UploadResult with upload status
        """
        if not self.youtube and not self.authenticate():
            return UploadResult(platform="youtube", success=False, error="Authentication failed")

        try:
            from googleapiclient.http import MediaFileUpload

            # Ensure #Shorts is in description
            if "#Shorts" not in description and "#shorts" not in description:
                description += "\n\n#Shorts"

            body = {
                "snippet": {
                    "title": title[:100],  # YouTube Shorts title limit
                    "description": description,
                    "tags": tags or [],
                    "categoryId": category_id,
                },
                "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False},
            }

            # Upload video
            media = MediaFileUpload(str(video_path), chunksize=-1, resumable=True)

            request = self.youtube.videos().insert(part="snippet,status", body=body, media_body=media)

            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    LOGGER.info(f"Upload progress: {int(status.progress() * 100)}%")

            video_id = response["id"]
            url = f"https://youtube.com/shorts/{video_id}"

            LOGGER.info(f"Upload successful: {url}")
            return UploadResult(platform="youtube", success=True, video_id=video_id, url=url)

        except Exception as e:
            LOGGER.error(f"YouTube upload failed: {e}")
            return UploadResult(platform="youtube", success=False, error=str(e))


class TikTokUploader:
    """
    Upload videos to TikTok using TikTok API.

    Setup:
    1. Apply for access: https://developers.tiktok.com/
    2. Create app and get credentials
    3. Set TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET env vars
    """

    def __init__(self):
        self.client_key = os.getenv("TIKTOK_CLIENT_KEY")
        self.client_secret = os.getenv("TIKTOK_CLIENT_SECRET")
        self.access_token = os.getenv("TIKTOK_ACCESS_TOKEN")

    def upload(
        self,
        video_path: Path,
        caption: str,
        privacy_level: str = "PUBLIC_TO_EVERYONE",
    ) -> UploadResult:
        """
        Upload video to TikTok.

        Args:
            video_path: Path to video file
            caption: Video caption/description
            privacy_level: Privacy setting

        Returns:
            UploadResult with upload status
        """
        if not self.access_token:
            LOGGER.error("TikTok access token not configured")
            return UploadResult(
                platform="tiktok",
                success=False,
                error="Missing TIKTOK_ACCESS_TOKEN. Apply at https://developers.tiktok.com/",
            )

        try:
            import requests

            # TikTok API endpoint
            url = "https://open-api.tiktok.com/share/video/upload/"

            headers = {"Authorization": f"Bearer {self.access_token}"}

            with open(video_path, "rb") as video_file:
                files = {"video": video_file}
                data = {"description": caption, "privacy_level": privacy_level}

                response = requests.post(url, headers=headers, files=files, data=data)

            if response.status_code == 200:
                result = response.json()
                video_id = result.get("data", {}).get("share_id")
                LOGGER.info(f"TikTok upload successful: {video_id}")
                return UploadResult(
                    platform="tiktok",
                    success=True,
                    video_id=video_id,
                    url=f"https://tiktok.com/@username/video/{video_id}",  # Replace with actual username
                )
            else:
                error = response.json().get("message", "Unknown error")
                LOGGER.error(f"TikTok upload failed: {error}")
                return UploadResult(platform="tiktok", success=False, error=error)

        except Exception as e:
            LOGGER.error(f"TikTok upload exception: {e}")
            return UploadResult(platform="tiktok", success=False, error=str(e))


class SocialMediaOrchestrator:
    """
    Orchestrates uploads to multiple platforms simultaneously.
    """

    def __init__(self):
        self.youtube = YouTubeShortsUploader()
        self.tiktok = TikTokUploader()

    def upload_everywhere(
        self,
        video_path: Path,
        title: str,
        description: str,
        platforms: Optional[List[str]] = None,
    ) -> Dict[str, UploadResult]:
        """
        Upload video to multiple platforms.

        Args:
            video_path: Path to video file
            title: Video title
            description: Video description
            platforms: List of platforms ("youtube", "tiktok", "instagram")
                      If None, uploads to all configured platforms

        Returns:
            Dict mapping platform name to UploadResult
        """
        if platforms is None:
            platforms = ["youtube", "tiktok"]

        results = {}

        if "youtube" in platforms:
            LOGGER.info("Uploading to YouTube Shorts...")
            results["youtube"] = self.youtube.upload(video_path, title, description)

        if "tiktok" in platforms:
            LOGGER.info("Uploading to TikTok...")
            results["tiktok"] = self.tiktok.upload(video_path, description)

        # Log summary
        successful = [p for p, r in results.items() if r.success]
        failed = [p for p, r in results.items() if not r.success]

        LOGGER.info(f"Upload complete. Success: {successful}, Failed: {failed}")

        return results


# Singleton instance
_orchestrator: Optional[SocialMediaOrchestrator] = None


def get_social_uploader() -> SocialMediaOrchestrator:
    """Get or create SocialMediaOrchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = SocialMediaOrchestrator()
    return _orchestrator
