# VoxCPM2 TTS API

VoxCPM2 TTS API is a standalone, tokenizer-free text-to-speech API powered by VoxCPM. It features a high-performance FastAPI backend, zero-shot voice cloning without transcription, and a modern React frontend for seamless voice library management and inference.

![Screenshot](screenshot.png)

## Features

- **FastAPI Backend:** Fast, asynchronous, and reliable TTS generation API.
- **Zero-Shot Voice Cloning:** Clone any voice using a short reference audio clip, no ASR transcription required.
- **Voice Design:** Create unique voices from scratch by describing them in text (e.g. "Speaks slowly with a melancholic tone").
- **Modern React Frontend:** A sleek web interface to manage your voice library and generate speech with real-time audio playback.
- **Voice Library Management:** Easily upload, list, and delete voice references directly from the browser.

## Requirements

- **Python 3.10+** (Recommended to use [uv](https://github.com/astral-sh/uv) for dependency management)
- **Node.js 18+** (For running the frontend)

## Installation & Setup

### 1. API Setup (using uv)

First, navigate to the root directory and install the Python dependencies using `uv`:

\`\`\`bash
# Install dependencies using uv and generate uv.lock
uv lock
uv sync

# Alternatively, if you want to run the provided script
run_api.bat
\`\`\`

The API server will start on \`http://0.0.0.0:8000\`.

### 2. Frontend Setup (using npm)

Navigate to the `frontend` folder and install the dependencies:

\`\`\`bash
cd frontend
npm install

# Start the frontend development server
npm run dev
\`\`\`

The frontend will usually start on \`http://localhost:5173\`.

## Voice Library Management

You can manage your voices directly through the frontend's **"Manage Voices"** tab.
- **Add a Voice:** Upload a `.wav` or `.mp3` file and give it a name. The API saves the audio file without running any transcription, saving VRAM and processing time.
- **Delete a Voice:** Remove a voice you no longer need.
- **Use a Voice:** Select the voice in the Inference tab to clone it instantly.

## API Documentation

For detailed information on the available REST endpoints, see the [API Documentation](api_docs.md).

## Credits

This API is powered by the [VoxCPM](https://github.com/OpenBMB/VoxCPM) project by OpenBMB. 

## License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for more details.

## Support Me

If you find this project useful, consider supporting my work!

- **Ko-fi:** [https://ko-fi.com/megaaziib](https://ko-fi.com/megaaziib)
- **Solana / USDC / USDT (Solana Network):** 
  \`9rupbyrM19RaVbHmJ4fusozux6P9t72GoYB7Sdy4Nmks\`
