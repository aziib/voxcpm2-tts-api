# VoxCPM2 TTS API Documentation

The VoxCPM2 TTS API provides a set of RESTful endpoints to manage voice references and generate text-to-speech audio using the VoxCPM model.

## Base URL
\`http://localhost:8000\`

---

## Endpoints

### 1. Health Check
Check if the API is running and responsive.
- **URL:** \`/healthz\`
- **Method:** \`GET\`
- **Response:**
  \`\`\`json
  {
    "status": "ok"
  }
  \`\`\`

---

### 2. List Voices
Retrieve a list of all uploaded voice references available for cloning.
- **URL:** \`/api/voices\`
- **Method:** \`GET\`
- **Response:**
  \`\`\`json
  [
    {
      "id": "Emma",
      "name": "Emma",
      "file_path": "voices\\Emma.wav"
    }
  ]
  \`\`\`

---

### 3. Upload a New Voice Reference
Upload a new audio file to use as a voice reference. This endpoint saves the file without running ASR transcription to save VRAM.
- **URL:** \`/api/voices\`
- **Method:** \`POST\`
- **Headers:** \`Content-Type: multipart/form-data\`
- **Parameters:**
  - \`file\` (file, required): The audio file (.wav, .mp3, .flac, .ogg).
  - \`name\` (string, required): The name of the voice.
- **Response:**
  \`\`\`json
  {
    "id": "Deep_Male_Voice",
    "name": "Deep Male Voice",
    "file_path": "voices\\Deep_Male_Voice.wav"
  }
  \`\`\`

---

### 4. Delete a Voice Reference
Delete an existing voice reference and its associated audio file from the server.
- **URL:** \`/api/voices/{voice_id}\`
- **Method:** \`DELETE\`
- **Path Parameter:**
  - \`voice_id\` (string, required): The ID of the voice to delete.
- **Response:**
  \`\`\`json
  {
    "status": "success",
    "message": "Voice Emma deleted"
  }
  \`\`\`

---

### 5. Generate TTS Audio
Generate speech from text. This endpoint supports voice cloning (by providing a \`voice_id\`) or Voice Design mode (by providing \`control_instruction\` without a \`voice_id\`).
- **URL:** \`/api/generate\`
- **Method:** \`POST\`
- **Headers:** \`Content-Type: application/json\`
- **Request Body:**
  \`\`\`json
  {
    "text": "Hello world, this is a test.",
    "voice_id": "Emma", 
    "control_instruction": "",
    "cfg_value": 2.0,
    "dit_steps": 10,
    "prompt_text": "",
    "do_normalize": true,
    "denoise": true
  }
  \`\`\`
  - \`text\` (string, required): The text you want to synthesize.
  - \`voice_id\` (string, optional): The ID of a voice to clone.
  - \`control_instruction\` (string, optional): Descriptions for Voice Design (e.g. "Speaks slowly with a melancholic tone").
  - \`cfg_value\` (float, optional): Guidance scale, defaults to 2.0.
  - \`dit_steps\` (int, optional): Flow steps, defaults to 10.
  - \`prompt_text\` (string, optional): The exact transcript of the reference audio (used for ultimate cloning).
  - \`do_normalize\` (bool, optional): Whether to normalize the audio, defaults to true.
  - \`denoise\` (bool, optional): Whether to apply denoising, defaults to true.
- **Response:**
  - **Content-Type:** \`audio/wav\`
  - **Body:** Binary WAV audio stream.
