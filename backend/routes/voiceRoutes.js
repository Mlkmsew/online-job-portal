const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { textToSpeech, speechToText, saveTranscript } = require('../controllers/voiceController');
const { protect, requireEmailVerified } = require('../middleware/auth');

// Public TTS for basic usage (could be protected)
router.post('/tts', protect, requireEmailVerified, textToSpeech);

// STT - accept audio file
router.post('/stt', protect, requireEmailVerified, upload.single('audio'), speechToText);

// Save transcript (e.g., interview transcript)
router.post('/transcripts', protect, requireEmailVerified, saveTranscript);

module.exports = router;
