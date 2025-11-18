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

// Analyze wound endpoint
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    console.log('Received analyze request');

    if (!req.file && !req.body.imageData) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert image to base64
    let base64Image;
    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
    } else {
      // Handle base64 from camera capture
      base64Image = req.body.imageData.split(',')[1];
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

async function analyzeWound(imageUrl) {
  const prompt = `You are an expert medical AI assistant specializing in wound assessment. Analyze this wound image and provide a detailed clinical assessment in JSON format.

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "location": "Anatomical location of the wound",
  "etiology": "Primary wound etiology/cause",
  "severity": "mild/moderate/severe",
  "confidence": "high/medium/low",
  "alternativeDiagnoses": [
    {
      "etiology": "Alternative diagnosis 1",
      "likelihood": "high/medium/low",
      "reasoning": "Clinical reasoning for this diagnosis"
    },
    {
      "etiology": "Alternative diagnosis 2",
      "likelihood": "high/medium/low",
      "reasoning": "Clinical reasoning for this diagnosis"
    }
  ],
  "treatment": {
    "wound_care": "Specific wound care recommendations",
    "dressing": "Recommended dressing type and frequency",
    "medications": "Suggested medications if applicable",
    "monitoring": "What to monitor",
    "referral": "When to seek specialist care"
  }
}

Provide at least 2-3 alternative diagnoses ranked by likelihood. Be specific, clinical, and evidence-based in your assessment.`;

  let response;
  try {
    console.log('Calling OpenAI API with model: gpt-4o');
    response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
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
    throw apiError;
  }

  const content = response.choices[0].message.content;
  console.log('OpenAI response content:', content.substring(0, 200) + '...');

  // Extract JSON from the response
  let analysis;
  try {
    analysis = JSON.parse(content);
  } catch (e) {
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
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  return analysis;
}

// Export for Vercel serverless
module.exports = app;
