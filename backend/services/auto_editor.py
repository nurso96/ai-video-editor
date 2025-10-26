"""
Auto-Editing Engine
Takes multiple video clips and assembles them into a complete video with:
- Transitions
- Captions
- Music/SFX sync
- Effects
"""

from __future__ import annotations

import logging
import subprocess
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from backend.config import get_settings

LOGGER = logging.getLogger(__name__)


@dataclass
class VideoClip:
    """Represents a video clip with metadata."""

    path: Path
    start_time: float = 0.0  # Trim start
    end_time: Optional[float] = None  # Trim end (None = full duration)
    duration: Optional[float] = None  # Actual duration after trim
    effects: List[str] = None  # Effects to apply


@dataclass
class Caption:
    """Represents a caption/subtitle."""

    text: str
    start: float  # Seconds from video start
    end: float  # Seconds from video start
    position: str = "bottom"  # bottom, top, center
    style: str = "default"  # default, bold, outlined


@dataclass
class AudioTrack:
    """Represents an audio track (music or SFX)."""

    path: Path
    start: float = 0.0  # When to start in video timeline
    volume: float = 1.0  # 0.0 to 1.0
    fade_in: float = 0.0  # Fade in duration in seconds
    fade_out: float = 0.0  # Fade out duration in seconds


@dataclass
class EditingPlan:
    """Complete video editing plan."""

    clips: List[VideoClip]
    captions: List[Caption] = None
    music: Optional[AudioTrack] = None
    sfx: List[AudioTrack] = None
    transitions: str = "fade"  # fade, cut, dissolve, wipe
    output_resolution: str = "1080x1920"  # 9:16 for shorts
    output_fps: int = 30


class AutoEditor:
    """
    Automatic video editor using FFmpeg.
    Assembles multiple clips into a final video.
    """

    def __init__(self):
        self.settings = get_settings()
        self.temp_dir = self.settings.media_root / "temp"
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def get_video_duration(self, video_path: Path) -> float:
        """Get duration of a video file in seconds."""
        try:
            result = subprocess.run(
                [
                    "ffprobe",
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration",
                    "-of",
                    "default=noprint_wrappers=1:nokey=1",
                    str(video_path),
                ],
                capture_output=True,
                text=True,
                check=True,
            )
            return float(result.stdout.strip())
        except Exception as e:
            LOGGER.error(f"Failed to get duration for {video_path}: {e}")
            return 0.0

    def create_caption_file(self, captions: List[Caption]) -> Path:
        """Create an ASS subtitle file for captions."""
        # ASS (Advanced SubStation Alpha) format for styled captions
        ass_content = """[Script Info]
Title: AI Video Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,60,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,10,10,50,1
Style: Bold,Arial,70,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,0,2,10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

        for caption in captions:
            # Convert seconds to ASS time format (h:mm:ss.cc)
            start_time = self._format_ass_time(caption.start)
            end_time = self._format_ass_time(caption.end)

            # Determine style and alignment based on position
            style = "Bold" if caption.style == "bold" else "Default"
            alignment = 2  # Bottom center

            if caption.position == "top":
                alignment = 8  # Top center
            elif caption.position == "center":
                alignment = 5  # Middle center

            # Add caption event
            ass_content += f"Dialogue: 0,{start_time},{end_time},{style},,0,0,0,,{caption.text}\n"

        # Save to temp file
        caption_file = self.temp_dir / f"captions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.ass"
        caption_file.write_text(ass_content, encoding="utf-8")

        return caption_file

    def _format_ass_time(self, seconds: float) -> str:
        """Convert seconds to ASS time format (h:mm:ss.cc)."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centiseconds = int((seconds % 1) * 100)
        return f"{hours}:{minutes:02d}:{secs:02d}.{centiseconds:02d}"

    def concatenate_clips_with_transitions(
        self, clips: List[VideoClip], transition: str = "fade", transition_duration: float = 0.5
    ) -> Path:
        """
        Concatenate video clips with transitions.

        Args:
            clips: List of video clips
            transition: Type of transition (fade, dissolve, cut)
            transition_duration: Duration of transition in seconds

        Returns:
            Path to concatenated video
        """
        if not clips:
            raise ValueError("No clips provided")

        # Create concat file for FFmpeg
        concat_file = self.temp_dir / f"concat_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"

        with open(concat_file, "w") as f:
            for clip in clips:
                f.write(f"file '{clip.path.absolute()}'\n")

        output_file = self.temp_dir / f"concatenated_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"

        if transition == "cut":
            # Simple concatenation without transitions
            cmd = [
                "ffmpeg",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_file),
                "-c",
                "copy",
                str(output_file),
            ]
        else:
            # With crossfade/dissolve transitions
            # Build complex filter graph
            filter_complex = self._build_transition_filter(clips, transition, transition_duration)

            cmd = []
            for clip in clips:
                cmd.extend(["-i", str(clip.path)])

            cmd.extend(
                [
                    "-filter_complex",
                    filter_complex,
                    "-c:v",
                    "libx264",
                    "-preset",
                    "medium",
                    "-crf",
                    "23",
                    str(output_file),
                ]
            )

        LOGGER.info(f"Concatenating {len(clips)} clips with {transition} transition")
        subprocess.run(cmd, check=True, capture_output=True)

        return output_file

    def _build_transition_filter(self, clips: List[VideoClip], transition: str, duration: float) -> str:
        """Build FFmpeg filter graph for transitions."""
        if len(clips) == 1:
            return "[0:v]null[v]"

        # For crossfade/dissolve between clips
        filters = []
        labels = []

        for i in range(len(clips)):
            # Get duration of each clip
            clip_duration = clips[i].duration or self.get_video_duration(clips[i].path)

            if i == 0:
                # First clip
                filters.append(f"[0:v]setpts=PTS-STARTPTS[v0]")
                labels.append("v0")
            else:
                # Subsequent clips with crossfade
                offset = sum(
                    (clips[j].duration or self.get_video_duration(clips[j].path)) - duration for j in range(i)
                )

                filters.append(f"[{i}:v]setpts=PTS-STARTPTS+{offset}/TB[v{i}]")

                # Crossfade between previous and current
                prev_label = labels[-1]
                filters.append(
                    f"[{prev_label}][v{i}]xfade=transition=fade:duration={duration}:offset={offset}[v{i}out]"
                )
                labels.append(f"v{i}out")

        filter_str = ";".join(filters)
        final_label = labels[-1]
        return f"{filter_str};[{final_label}]null[v]"

    def add_captions(self, video_path: Path, captions: List[Caption]) -> Path:
        """Add captions/subtitles to video."""
        if not captions:
            return video_path

        caption_file = self.create_caption_file(captions)
        output_file = self.temp_dir / f"with_captions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"

        cmd = [
            "ffmpeg",
            "-i",
            str(video_path),
            "-vf",
            f"ass={caption_file}",
            "-c:a",
            "copy",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "23",
            str(output_file),
        ]

        LOGGER.info(f"Adding {len(captions)} captions to video")
        subprocess.run(cmd, check=True, capture_output=True)

        return output_file

    def add_audio(
        self, video_path: Path, music: Optional[AudioTrack] = None, sfx: Optional[List[AudioTrack]] = None
    ) -> Path:
        """Add background music and sound effects."""
        if not music and not sfx:
            return video_path

        output_file = self.temp_dir / f"with_audio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"

        # Build filter graph for audio mixing
        filter_parts = ["[0:a]volume=1.0[original]"]  # Original video audio
        mix_inputs = ["[original]"]

        input_files = [str(video_path)]
        audio_index = 1

        if music:
            input_files.append(str(music.path))
            filter_parts.append(
                f"[{audio_index}:a]volume={music.volume},afade=t=in:d={music.fade_in}:curve=log,"
                f"afade=t=out:d={music.fade_out}:curve=log[music]"
            )
            mix_inputs.append("[music]")
            audio_index += 1

        if sfx:
            for i, sfx_track in enumerate(sfx):
                input_files.append(str(sfx_track.path))
                filter_parts.append(
                    f"[{audio_index}:a]volume={sfx_track.volume},adelay={int(sfx_track.start * 1000)}|"
                    f"{int(sfx_track.start * 1000)}[sfx{i}]"
                )
                mix_inputs.append(f"[sfx{i}]")
                audio_index += 1

        # Mix all audio tracks
        mix_str = "".join(mix_inputs)
        filter_parts.append(f"{mix_str}amix=inputs={len(mix_inputs)}:duration=first:dropout_transition=2[a]")

        filter_complex = ";".join(filter_parts)

        cmd = []
        for input_file in input_files:
            cmd.extend(["-i", input_file])

        cmd.extend(
            ["-filter_complex", filter_complex, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-shortest", str(output_file)]
        )

        LOGGER.info(f"Adding audio: music={music is not None}, sfx={len(sfx) if sfx else 0}")
        subprocess.run(cmd, check=True, capture_output=True)

        return output_file

    def apply_effects(self, video_path: Path, effects: List[str]) -> Path:
        """Apply video effects (zoom, slowmo, etc.)."""
        if not effects:
            return video_path

        output_file = self.temp_dir / f"with_effects_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"

        # Build filter chain
        filters = []

        for effect in effects:
            if effect == "zoom":
                # Zoom in effect
                filters.append("zoompan=z='min(zoom+0.0015,1.5)':d=125:s=1080x1920")
            elif effect == "slowmo":
                # Slow motion
                filters.append("setpts=2*PTS")
            elif effect == "shake":
                # Camera shake
                filters.append("crop=iw-20:ih-20:(in-20)/2+((in-20)/2)*sin(n/10):(ih-20)/2")
            elif effect == "vignette":
                # Vignette darkening
                filters.append("vignette=PI/4")

        if not filters:
            return video_path

        filter_str = ",".join(filters)

        cmd = [
            "ffmpeg",
            "-i",
            str(video_path),
            "-vf",
            filter_str,
            "-c:a",
            "copy",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "23",
            str(output_file),
        ]

        LOGGER.info(f"Applying effects: {effects}")
        subprocess.run(cmd, check=True, capture_output=True)

        return output_file

    def resize_for_platform(self, video_path: Path, platform: str = "tiktok") -> Path:
        """Resize video for specific platform requirements."""
        output_file = self.temp_dir / f"resized_{platform}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"

        # Platform-specific resolutions
        resolutions = {
            "tiktok": "1080x1920",  # 9:16
            "youtube_shorts": "1080x1920",  # 9:16
            "instagram_reels": "1080x1920",  # 9:16
            "youtube": "1920x1080",  # 16:9
        }

        resolution = resolutions.get(platform, "1080x1920")
        width, height = resolution.split("x")

        cmd = [
            "ffmpeg",
            "-i",
            str(video_path),
            "-vf",
            f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black",
            "-c:a",
            "copy",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "23",
            str(output_file),
        ]

        LOGGER.info(f"Resizing for {platform}: {resolution}")
        subprocess.run(cmd, check=True, capture_output=True)

        return output_file

    def edit_video(self, plan: EditingPlan) -> Path:
        """
        Execute complete video editing plan.

        This is the main entry point that orchestrates all editing steps.

        Args:
            plan: EditingPlan with all editing instructions

        Returns:
            Path to final edited video
        """
        LOGGER.info(f"Starting video editing with {len(plan.clips)} clips")

        # Step 1: Fill in clip durations
        for clip in plan.clips:
            if clip.duration is None:
                clip.duration = self.get_video_duration(clip.path)

        # Step 2: Concatenate clips with transitions
        video = self.concatenate_clips_with_transitions(plan.clips, plan.transitions)

        # Step 3: Apply effects if any
        all_effects = []
        for clip in plan.clips:
            if clip.effects:
                all_effects.extend(clip.effects)

        if all_effects:
            video = self.apply_effects(video, list(set(all_effects)))  # Unique effects

        # Step 4: Add captions
        if plan.captions:
            video = self.add_captions(video, plan.captions)

        # Step 5: Add music and SFX
        if plan.music or plan.sfx:
            video = self.add_audio(video, plan.music, plan.sfx)

        # Step 6: Resize for platform
        if plan.output_resolution:
            # Determine platform from resolution
            if "1920" in plan.output_resolution and "1080" in plan.output_resolution:
                video = self.resize_for_platform(video, "tiktok")

        # Step 7: Move to final directory
        final_dir = self.settings.final_dir
        final_dir.mkdir(parents=True, exist_ok=True)

        final_path = final_dir / f"edited_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        subprocess.run(["cp", str(video), str(final_path)], check=True)

        LOGGER.info(f"Video editing complete: {final_path}")

        return final_path


# Singleton instance
_editor: Optional[AutoEditor] = None


def get_auto_editor() -> AutoEditor:
    """Get or create AutoEditor instance."""
    global _editor
    if _editor is None:
        _editor = AutoEditor()
    return _editor
