# AI Models Directory

This directory contains the AI model files used by the SEO Agent.

## Required Model

The application uses **Qwen 2.5 3B Instruct** model in GGUF format.

### Download Instructions

1. **Model Name:** `qwen2.5-3b-instruct-q4_k_m.gguf`
2. **Size:** ~2 GB
3. **Download Link:** [Hugging Face - Qwen 2.5 3B Instruct GGUF](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF)

### Installation Steps

1. Download the model file from Hugging Face
2. Place the file in this `models/` directory
3. Verify the file name matches: `qwen2.5-3b-instruct-q4_k_m.gguf`

### File Structure

```
models/
├── README.md (this file)
└── qwen2.5-3b-instruct-q4_k_m.gguf (download required)
```

## Important Notes

- **DO NOT commit model files to Git** - They are too large (2GB+)
- The `.gitignore` file already excludes `*.gguf` files
- Each developer must download the model separately
- The AI server will not start without this model file

## Running the AI Server

After downloading the model, start the AI server:

```powershell
# Activate virtual environment
.venv\Scripts\Activate.ps1

# Run the server
python -m llama_cpp.server --model models\qwen2.5-3b-instruct-q4_k_m.gguf --host 127.0.0.1 --port 38474 --n_ctx 2048 --n_threads 6
```

## Alternative Models

You can use other GGUF models by:
1. Placing them in this directory
2. Updating the `--model` parameter in the server command
3. Ensuring they are compatible with `llama-cpp-python`

---

**Model Info:**
- Model: Qwen 2.5 3B Instruct
- Format: GGUF (Q4_K_M quantization)
- Purpose: Local SEO content generation and keyword suggestions
- License: Check Hugging Face for license details
