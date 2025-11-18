const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for memory storage (Vercel doesn't support disk storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const apiKeyPrefix = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'NOT SET';
  res.json({
    status: 'OK',
    message: 'Wound Analysis API is running',
    hasApiKey,
    apiKeyPrefix
  });
});

// Analyze wound endpoint - handles both upload and base64
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    console.log('Received analyze request');

    if (!req.file && !req.body.image && !req.body.imageData) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert image to base64
    let base64Image;
    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
    } else if (req.body.image) {
      // Handle base64 from camera capture
      base64Image = req.body.image.split(',')[1] || req.body.image;
    } else if (req.body.imageData) {
      base64Image = req.body.imageData.split(',')[1] || req.body.imageData;
    }

    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    // Call OpenAI API
    const analysis = await analyzeWound(imageUrl);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing wound:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze wound'
    });
  }
});

// Support both /upload and /base64 routes for backward compatibility
app.post('/api/analyze/upload', upload.single('image'), async (req, res) => {
  try {
    console.log('Received upload analyze request');

    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    const analysis = await analyzeWound(imageUrl);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing wound:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze wound'
    });
  }
});

app.post('/api/analyze/base64', async (req, res) => {
  try {
    console.log('Received base64 analyze request');

    if (!req.body.image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const base64Image = req.body.image.split(',')[1] || req.body.image;
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    const analysis = await analyzeWound(imageUrl);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error analyzing wound:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze wound'
    });
  }
});

async function analyzeWound(imageUrl) {
  let response;
  try {
    console.log('Calling OpenAI API with model: gpt-5.1');

    response = await openai.chat.completions.create({
      model: "gpt-5.1",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that analyzes images and returns structured, NON-DIAGNOSTIC, " +
            "purely educational observations. You do NOT provide medical advice, diagnosis, or " +
            "treatment recommendations. You only describe what is visible and offer high-level, " +
            "generic considerations. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and provide a structured, non-diagnostic observation.
Return ONLY valid JSON with this structure:

{
  "location": "describe the visual location or area shown",
  "primaryObservation": "primary visual observation (descriptive, non-diagnostic)",
  "severity": "mild/moderate/severe",
  "confidence": "high/medium/low",
  "alternativeExplanations": [
    {
      "description": "alternative visual explanation 1 (non-diagnostic)",
      "likelihood": "high/medium/low",
      "reasoning": "reasoning for this explanation"
    },
    {
      "description": "alternative visual explanation 2 (non-diagnostic)",
      "likelihood": "high/medium/low",
      "reasoning": "reasoning for this explanation"
    }
  ],
  "careConsiderations": {
    "self_care": "very general, non-personalized self-care ideas if appropriate (e.g. keep area clean, avoid friction). Do NOT mention specific drugs, dosages, or instructions.",
    "monitoring": "what visual changes to pay attention to (e.g. increasing redness, swelling, discharge).",
    "when_to_seek_care": "high-level guidance on when to contact a healthcare professional (e.g. if symptoms worsen or do not improve)."
  }
}

Important:
- Do NOT provide a medical diagnosis.
- Do NOT mention specific prescription medications or dosing.
- Do NOT give individualized medical instructions.
- Return ONLY JSON, no extra text.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });
    console.log('OpenAI API call successful');
  } catch (apiError) {
    console.error('OpenAI API Error:', {
      message: apiError.message,
      status: apiError.status,
      type: apiError.type,
      code: apiError.code
    });

    // If content moderation error, throw a more helpful message
    if (apiError.message && apiError.message.toLowerCase().includes("can't assist")) {
      throw new Error('Image analysis unavailable. The image may contain content that cannot be processed. Please try a different image or consult a healthcare professional directly.');
    }

    throw apiError;
  }

  const content = response.choices[0].message.content;
  console.log('OpenAI response content:', content.substring(0, 200) + '...');

  // Check if response is a refusal
  if (content && (content.toLowerCase().includes("i'm sorry") || content.toLowerCase().includes("i cannot") || content.toLowerCase().includes("can't assist"))) {
    console.error('OpenAI refused to process the request:', content);
    throw new Error('Image analysis unavailable. Please try a different image or consult a healthcare professional directly.');
  }

  // Parse JSON response
  let analysis;
  try {
    analysis = JSON.parse(content);
  } catch (e) {
    // Fallback parsing for edge cases
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      content.match(/```\s*([\s\S]*?)\s*```/) ||
                      content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse extracted JSON:', jsonMatch[0].substring(0, 200));
        throw new Error('Failed to parse AI response as JSON');
      }
    } else {
      console.error('No JSON found in response:', content);
      throw new Error('OpenAI did not return valid JSON. Response: ' + content.substring(0, 200));
    }
  }

  // Map new schema to old schema for frontend compatibility
  const mappedAnalysis = {
    location: analysis.location,
    etiology: analysis.primaryObservation || analysis.etiology,
    severity: analysis.severity,
    confidence: analysis.confidence,
    alternativeDiagnoses: (analysis.alternativeExplanations || analysis.alternativeDiagnoses || []).map(alt => ({
      etiology: alt.description || alt.etiology,
      likelihood: alt.likelihood,
      reasoning: alt.reasoning
    })),
    treatment: {
      wound_care: analysis.careConsiderations?.self_care || analysis.treatment?.wound_care || '',
      dressing: analysis.treatment?.dressing || 'Keep area covered as needed',
      medications: analysis.treatment?.medications || 'Consult healthcare provider for recommendations',
      monitoring: analysis.careConsiderations?.monitoring || analysis.treatment?.monitoring || '',
      referral: analysis.careConsiderations?.when_to_seek_care || analysis.treatment?.referral || ''
    }
  };

  return mappedAnalysis;
}

// Export for Vercel serverless
module.exports = app;
