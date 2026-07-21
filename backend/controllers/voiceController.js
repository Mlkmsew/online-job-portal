// ============================================
// Voice Controller - Placeholder STT/TTS and Transcripts
// Implementations should be wired to real providers (Cloud Speech, Whisper, TTS)
// ============================================
const { asyncHandler } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');

// POST /api/voice/tts -> { text }
exports.textToSpeech = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new AppError('Text is required for TTS', 400);

  // Placeholder: return a data URL hint (frontend should integrate a real provider)
  const pseudoAudio = `data:audio/wav;base64,${Buffer.from('tts-placeholder:' + text).toString('base64')}`;
  res.status(200).json({ success: true, audioUrl: pseudoAudio, message: 'TTS placeholder generated.' });
});

// POST /api/voice/stt -> form-data file upload
exports.speechToText = asyncHandler(async (req, res) => {
  // This is a stub. Real implementation should accept multipart file and call a speech-to-text service.
  // If running tests without file, return a helpful message.
  res.status(200).json({ success: true, text: 'Transcription not implemented on this environment (placeholder).' });
});

// POST /api/voice/transcripts -> save transcript for given interview or message
exports.saveTranscript = asyncHandler(async (req, res) => {
  const { interviewId, transcript } = req.body;
  if (!interviewId || !transcript) throw new AppError('interviewId and transcript required', 400);

  // Placeholder: In production, persist to DB and link to interview/message
  res.status(201).json({ success: true, message: 'Transcript saved (placeholder).', data: { interviewId } });
});

module.exports = exports;
