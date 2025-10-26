# backend/test_load_ltx.py
import os, torch, time
from diffusers import LTXPipeline

os.environ.setdefault("HF_HOME", os.path.expanduser("~/hf_cache"))
os.environ.setdefault("HF_TOKEN", os.getenv("HF_TOKEN", ""))

print("Torch:", torch.__version__, "CUDA:", torch.version.cuda, "cuda_available:", torch.cuda.is_available(), "device_count:", torch.cuda.device_count())
device = "cuda" if torch.cuda.is_available() else "cpu"
model_dir = "models/LTX-Video"   # change if you use a different folder

try:
    t0 = time.time()
    pipe = LTXPipeline.from_pretrained(model_dir, torch_dtype=torch.float16)
    pipe.to(device)
    print(f"Loaded LTX pipeline to {device} in {time.time()-t0:.1f}s")
    # minimal forward with tiny settings to check memory (no weights change)
    generator = torch.Generator(device=device).manual_seed(42)
    out = pipe("test", width=360, height=640, num_frames=4, num_inference_steps=10, generator=generator)
    print("Ran quick generate ok; frames:", len(out.frames))
except Exception as e:
    print("FAILED to load/run pipeline:", e)
    raise
