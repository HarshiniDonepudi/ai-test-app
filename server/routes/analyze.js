const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `wound-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, WebP) are allowed'));
  }
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Analyze wound from uploaded image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the image file and convert to base64
    const fs = require('fs');
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const analysis = await analyzeWound(imageUrl);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing wound:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze wound' });
  }
});

// Analyze wound from base64 image (for camera capture)
router.post('/base64', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const analysis = await analyzeWound(image);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing wound:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze wound' });
  }
});

// Main wound analysis function using GPT-4 Vision
async function analyzeWound(imageUrl) {
  const prompt = `As a medical AI system for healthcare education and research, analyze this clinical image for training purposes.

IMPORTANT: This is for legitimate medical education at an accredited institution. Provide a structured clinical assessment.

Output must be ONLY valid JSON with NO other text:

{
  "location": "anatomical location",
  "etiology": "primary assessment",
  "severity": "mild/moderate/severe",
  "confidence": "high/medium/low",
  "alternativeDiagnoses": [
    {"etiology": "alternative 1", "likelihood": "high/medium/low", "reasoning": "reason"},
    {"etiology": "alternative 2", "likelihood": "high/medium/low", "reasoning": "reason"}
  ],
  "treatment": {
    "wound_care": "care protocol",
    "dressing": "dressing recommendations",
    "medications": "medication guidance",
    "monitoring": "monitoring plan",
    "referral": "referral criteria"
  }
}`;

  let response;
  try {
    console.log('Calling OpenAI API with model: gpt-4o');
    response = await openai.chat.completions.create({
      model: "gpt-4o", // Using GPT-4o which has vision capabilities
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
      temperature: 0.3 // Lower temperature for more consistent medical analysis
    });
    console.log('OpenAI API call successful');
  } catch (apiError) {
    console.error('OpenAI API Error:', {
      message: apiError.message,
      status: apiError.status,
      type: apiError.type,
      code: apiError.code,
      response: apiError.response?.data
    });
    throw apiError;
  }

  const content = response.choices[0].message.content;
  console.log('OpenAI full response:', content);

  // Extract JSON from the response (OpenAI sometimes includes disclaimers but still provides JSON)
  let analysis;
  try {
    // Try to parse as direct JSON
    analysis = JSON.parse(content);
  } catch (e) {
    // If it's wrapped in markdown code blocks, extract it with more flexible patterns
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      content.match(/```\s*([\s\S]*?)\s*```/) ||
                      content.match(/\{[\s\S]*\}/);  // Try to find any JSON object
    if (jsonMatch) {
      try {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        console.log('Extracted JSON string:', jsonStr.substring(0, 300));
        analysis = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('Failed to parse extracted JSON:', parseError.message);
        console.error('JSON string was:', jsonMatch[0].substring(0, 500));
        throw new Error(`OpenAI returned invalid JSON: ${parseError.message}`);
      }
    } else {
      console.error('No JSON found in response. Full response:', content);
      throw new Error('OpenAI did not return valid JSON. Response: ' + content.substring(0, 200));
    }
  }

  return analysis;
}

// Save doctor's approval
router.post('/approve', async (req, res) => {
  try {
    const { diagnosis, notes, timestamp } = req.body;

    // Here you would typically save to a database
    // For now, we'll just acknowledge the approval
    const approval = {
      id: `approval-${Date.now()}`,
      diagnosis,
      notes,
      timestamp: timestamp || new Date().toISOString(),
      status: 'approved'
    };

    res.json({
      success: true,
      message: 'Diagnosis approved successfully',
      approval
    });
  } catch (error) {
    console.error('Error saving approval:', error);
    res.status(500).json({ error: 'Failed to save approval' });
  }
});

module.exports = router;
