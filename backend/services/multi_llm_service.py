"""
Multi-LLM Chat Service using Hugging Face Models
Supports: Llama 3.2, Mistral, Qwen, etc.
"""

from __future__ import annotations

import logging
import os
from typing import Dict, List, Optional

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

from backend.config import get_settings

LOGGER = logging.getLogger(__name__)


class MultiLLMService:
    """
    Orchestrates multiple LLMs for different tasks:
    - Planner: Creates video production plans
    - Scripter: Writes scripts and dialogue
    - Editor: Suggests edits and improvements
    """

    def __init__(self):
        self.settings = get_settings()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Model cache
        self._models: Dict[str, any] = {}
        self._tokenizers: Dict[str, any] = {}
        self._pipelines: Dict[str, any] = {}

        # Default models (can be overridden via env vars)
        self.planner_model = os.getenv("HF_PLANNER_MODEL", "meta-llama/Llama-3.2-3B-Instruct")
        self.chat_model = os.getenv("HF_CHAT_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")
        self.editor_model = os.getenv("HF_EDITOR_MODEL", "Qwen/Qwen2.5-7B-Instruct")

    def _load_model(self, model_name: str, task: str = "text-generation"):
        """Load a Hugging Face model with caching."""
        if model_name in self._pipelines:
            LOGGER.info(f"Using cached pipeline for {model_name}")
            return self._pipelines[model_name]

        LOGGER.info(f"Loading {model_name} on {self.device}...")

        try:
            # For smaller models or CPU, use pipeline directly
            if "1B" in model_name or "3B" in model_name or self.device == "cpu":
                pipe = pipeline(
                    task,
                    model=model_name,
                    device=0 if self.device == "cuda" else -1,
                    torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                )
                self._pipelines[model_name] = pipe
                return pipe

            # For larger models, load with optimizations
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16,
                device_map="auto",  # Automatically split across GPUs
                low_cpu_mem_usage=True,
            )

            self._models[model_name] = model
            self._tokenizers[model_name] = tokenizer

            # Create pipeline
            pipe = pipeline(
                task,
                model=model,
                tokenizer=tokenizer,
                device=0 if self.device == "cuda" else -1,
            )
            self._pipelines[model_name] = pipe
            return pipe

        except Exception as e:
            LOGGER.error(f"Failed to load {model_name}: {e}")
            # Fallback to smallest model
            LOGGER.warning("Falling back to distilgpt2")
            pipe = pipeline(task, model="distilgpt2", device=-1)
            self._pipelines[model_name] = pipe
            return pipe

    def chat(self, user_message: str, mode: str = "general", history: Optional[List[Dict]] = None) -> str:
        """
        Chat with appropriate LLM based on mode.

        Args:
            user_message: User's input message
            mode: "general", "planner", "editor", "scripter"
            history: Chat history for context

        Returns:
            AI response
        """
        # Select model based on mode
        model_map = {
            "planner": self.planner_model,
            "editor": self.editor_model,
            "scripter": self.chat_model,
            "general": self.chat_model,
        }
        model_name = model_map.get(mode, self.chat_model)

        # Load model
        pipe = self._load_model(model_name)

        # Build conversation
        messages = history or []
        messages.append({"role": "user", "content": user_message})

        # Generate response
        try:
            output = pipe(
                messages,
                max_new_tokens=512,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                return_full_text=False,
            )

            # Extract response
            if isinstance(output, list) and len(output) > 0:
                response = output[0].get("generated_text", "")
                if isinstance(response, list) and len(response) > 0:
                    # Handle chat format
                    response = response[-1].get("content", str(response))
                return str(response).strip()
            return str(output).strip()

        except Exception as e:
            LOGGER.error(f"Generation failed: {e}")
            return f"Error: {str(e)}"

    def create_video_plan(self, user_prompt: str) -> Dict:
        """
        Create a detailed video production plan.

        Args:
            user_prompt: User's video idea

        Returns:
            Structured production plan
        """
        system_prompt = """You are a video production AI. Given a video idea, create a detailed production plan in JSON format.

Include:
- title: catchy title
- duration: total duration in seconds
- style: comedy/educational/both
- scenes: array of scene objects with:
  - scene_id: number
  - duration: seconds
  - type: intro/main/outro
  - visual: description of what to show
  - voiceover: what the narrator says
  - effects: array of effect names

Example output:
{
  "title": "Cats Learn Python",
  "duration": 45,
  "style": "comedy + educational",
  "scenes": [
    {
      "scene_id": 1,
      "duration": 8,
      "type": "intro",
      "visual": "Cartoon cat at laptop",
      "voiceover": "Meet Whiskers, a cat who wants to code!",
      "effects": ["zoom_in"]
    }
  ]
}

Now create a plan for this idea:"""

        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        response = self.chat(full_prompt, mode="planner")

        # Try to extract JSON from response
        import json
        import re

        try:
            # Look for JSON in the response
            json_match = re.search(r"\{[\s\S]*\}", response)
            if json_match:
                return json.loads(json_match.group())
        except Exception as e:
            LOGGER.warning(f"Could not parse JSON from response: {e}")

        # Return structured fallback
        return {
            "title": "Untitled Video",
            "duration": 30,
            "style": "general",
            "scenes": [{"scene_id": 1, "duration": 30, "visual": user_prompt, "voiceover": response}],
        }

    def suggest_edits(self, video_description: str, current_edits: str) -> str:
        """
        Suggest improvements to video edits.

        Args:
            video_description: What the video is about
            current_edits: Current editing timeline/plan

        Returns:
            Edit suggestions
        """
        prompt = f"""As a video editing AI, suggest improvements for this video:

Video: {video_description}
Current edits: {current_edits}

Provide specific suggestions for:
1. Timing and pacing
2. Transitions and effects
3. Caption placement
4. Music/SFX sync

Keep suggestions concise and actionable."""

        return self.chat(prompt, mode="editor")


# Singleton instance
_service: Optional[MultiLLMService] = None


def get_multi_llm_service() -> MultiLLMService:
    """Get or create MultiLLMService instance."""
    global _service
    if _service is None:
        _service = MultiLLMService()
    return _service
