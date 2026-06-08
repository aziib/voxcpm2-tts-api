import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, Wand2, UploadCloud, Play, Loader2, Music, Trash2 } from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

type Voice = {
  id: string;
  name: string;
  file_path: string;
};

function App() {
  const [activeTab, setActiveTab] = useState<'inference' | 'design' | 'add'>('inference');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Form states
  const [text, setText] = useState('VoxCPM2 is a creative multilingual TTS model from ModelBest, designed to generate highly realistic speech.');
  const [voiceId, setVoiceId] = useState('');
  const [controlInstruction, setControlInstruction] = useState('');
  const [promptText, setPromptText] = useState('');
  const [cfgValue, setCfgValue] = useState(2.0);
  const [ditSteps, setDitSteps] = useState(10);
  const [ultimateCloning, setUltimateCloning] = useState(false);

  // Add Voice states
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceFile, setNewVoiceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/voices`);
      setVoices(res.data);
      if (res.data.length > 0 && !voiceId) {
        setVoiceId(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAudioUrl(null);

    const payload = {
      text,
      voice_id: activeTab === 'design' ? null : voiceId,
      control_instruction: ultimateCloning && activeTab !== 'design' ? '' : controlInstruction,
      cfg_value: cfgValue,
      dit_steps: ditSteps,
      prompt_text: ultimateCloning && activeTab !== 'design' ? promptText : '',
      do_normalize: true,
      denoise: true
    };

    try {
      const response = await axios.post(`${API_BASE}/generate`, payload, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      setAudioUrl(url);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate audio. Make sure the API is running and model is loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoiceFile || !newVoiceName) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', newVoiceFile);
    formData.append('name', newVoiceName);

    try {
      await axios.post(`${API_BASE}/voices`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewVoiceName('');
      setNewVoiceFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchVoices();
      setActiveTab('inference');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload voice.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVoice = async (voiceIdToDelete: string) => {
    if (!window.confirm("Are you sure you want to delete this voice?")) return;
    
    try {
      await axios.delete(`${API_BASE}/voices/${voiceIdToDelete}`);
      if (voiceId === voiceIdToDelete) {
        setVoiceId('');
      }
      await fetchVoices();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete voice.');
    }
  };

  const renderSliders = () => (
    <div className="grid-2">
      <div className="form-group">
        <label className="form-label">CFG Scale (Guidance)</label>
        <div className="slider-container">
          <input
            type="range"
            min="1.0" max="3.0" step="0.1"
            value={cfgValue}
            onChange={(e) => setCfgValue(parseFloat(e.target.value))}
            className="slider-input"
          />
          <span className="slider-value">{cfgValue.toFixed(1)}</span>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">LocDiT Flow Steps</label>
        <div className="slider-container">
          <input
            type="range"
            min="1" max="50" step="1"
            value={ditSteps}
            onChange={(e) => setDitSteps(parseInt(e.target.value))}
            className="slider-input"
          />
          <span className="slider-value">{ditSteps}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title">VoxCPM Studio</h1>
        <p className="header-subtitle">Advanced Multilingual TTS Agent</p>
      </header>

      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'inference' ? 'active' : ''}`}
          onClick={() => setActiveTab('inference')}
        >
          <Mic size={18} /> Inference
        </button>
        <button 
          className={`tab-btn ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          <Wand2 size={18} /> Voice Design
        </button>
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <UploadCloud size={18} /> Manage Voices
        </button>
      </div>

      <main>
        {activeTab === 'add' && (
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Manage Voices</h2>
              <p className="panel-description">Upload and manage your reference voices. No transcription is performed during upload to save VRAM.</p>
            </div>
            
            <form onSubmit={handleAddVoice} style={{marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)'}}>
              <h3 className="form-label" style={{fontSize: '1.2rem', marginBottom: '1rem'}}>Add New Voice</h3>
              <div className="form-group">
                <label className="form-label">Voice Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Deep Male Voice, Emma, Default"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audio File (.wav, .mp3)</label>
                <div 
                  className="file-upload"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="file-upload-icon" />
                  <p>{newVoiceFile ? newVoiceFile.name : 'Click to select audio file'}</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setNewVoiceFile(e.target.files?.[0] || null)}
                    accept="audio/*"
                    style={{ display: 'none' }}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={uploading || !newVoiceFile || !newVoiceName}>
                {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : 'Save Voice'}
              </button>
            </form>

            <div>
              <h3 className="form-label" style={{fontSize: '1.2rem', marginBottom: '1rem'}}>Available Voices</h3>
              {voices.length === 0 ? (
                <p style={{color: 'var(--text-muted)'}}>No voices added yet.</p>
              ) : (
                <div className="voice-list">
                  {voices.map(v => (
                    <div key={v.id} className="voice-item">
                      <div className="voice-item-info">
                        <span className="voice-item-name"><Music size={14} style={{display:'inline', marginRight: '8px', color: 'var(--accent-primary)'}}/> {v.name}</span>
                        <span className="voice-item-id">ID: {v.id}</span>
                      </div>
                      <button 
                        className="btn-icon-danger" 
                        onClick={() => handleDeleteVoice(v.id)}
                        title="Delete Voice"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'inference' && (
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Voice Cloning</h2>
              <p className="panel-description">Clone an existing voice and control the delivery style.</p>
            </div>

            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label className="form-label">Select Voice</label>
                {voices.length === 0 ? (
                  <div style={{color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '1rem'}}>
                    No voices found. Please add a voice first.
                  </div>
                ) : (
                  <select 
                    className="form-select"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    required
                  >
                    {voices.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="toggle-container">
                  <input 
                    type="checkbox" 
                    checked={ultimateCloning}
                    onChange={(e) => setUltimateCloning(e.target.checked)}
                  />
                  <div className="toggle-switch"></div>
                  <span className="form-label" style={{marginBottom: 0}}>Ultimate Cloning Mode (Disables Control Instruction)</span>
                </label>
              </div>

              {ultimateCloning ? (
                <div className="form-group">
                  <label className="form-label">Reference Transcript <span className="optional">(Type exactly what is said in reference)</span></label>
                  <textarea
                    className="form-textarea"
                    placeholder="Enter the transcript of the reference audio..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={2}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Control Instruction <span className="optional">(Optional)</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Speaks slowly with a melancholic tone"
                    value={controlInstruction}
                    onChange={(e) => setControlInstruction(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Target Text</label>
                <textarea
                  className="form-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
              </div>

              {renderSliders()}

              <button type="submit" className="btn btn-primary" disabled={loading || voices.length === 0}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Generating Speech...</> : <><Play size={18} /> Generate</>}
              </button>
            </form>

            {audioUrl && (
              <div className="audio-player-container">
                <h4>Generation Complete!</h4>
                <audio controls src={audioUrl} autoPlay />
              </div>
            )}
          </div>
        )}

        {activeTab === 'design' && (
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Voice Design</h2>
              <p className="panel-description">Create a unique voice from scratch using just a text description.</p>
            </div>

            <form onSubmit={handleGenerate}>
              <div className="form-group">
                <label className="form-label">Control Instruction <span className="optional">(Required)</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. A young girl with a soft, sweet voice. Speaks slowly with a melancholic tone."
                  value={controlInstruction}
                  onChange={(e) => setControlInstruction(e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Target Text</label>
                <textarea
                  className="form-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
              </div>

              {renderSliders()}

              <button type="submit" className="btn btn-primary" disabled={loading || !controlInstruction}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Generating Speech...</> : <><Play size={18} /> Generate</>}
              </button>
            </form>

            {audioUrl && (
              <div className="audio-player-container">
                <h4>Generation Complete!</h4>
                <audio controls src={audioUrl} autoPlay />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
