# Wound Analysis System

An AI-powered medical wound assessment application that helps doctors analyze wound images, predict location/etiology/severity, and get treatment recommendations.

## Features

- 📸 **Image Upload & Camera Capture**: Upload wound images or capture them directly using device camera
- 🤖 **AI Analysis**: Uses GPT-4 Vision (OpenAI) to analyze wounds and provide detailed assessments
- 📊 **Comprehensive Diagnosis**: Provides primary diagnosis with location, etiology, and severity
- 🔄 **Alternative Predictions**: Shows expandable alternative diagnoses ranked by confidence
- ✅ **Doctor Approval**: Allows doctors to review and approve diagnoses with notes
- 💊 **Treatment Recommendations**: Displays evidence-based treatment protocols
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Frontend
- React 19
- Axios for API calls
- Modern CSS with responsive design
- Camera API for image capture

### Backend
- Node.js & Express
- OpenAI GPT-4o Vision API
- Multer for file uploads
- CORS enabled

## Prerequisites

- Node.js 16+ and npm
- OpenAI API key with GPT-4 Vision access
- Modern web browser with camera support (for photo capture feature)

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd ai-test-app
   ```

2. **Install dependencies**:
   ```bash
   npm run install-all
   ```
   This will install both server and client dependencies.

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   ```

## Development

Run both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- React frontend on `http://localhost:3000`

### Run individually:

**Backend only**:
```bash
npm run server
```

**Frontend only**:
```bash
npm run client
```

## Production Build

1. **Build the React frontend**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   NODE_ENV=production npm start
   ```

The app will serve the built React app from the backend at `http://localhost:5000`.

## Deployment

### Deploy to Heroku

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**:
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set OPENAI_API_KEY=your_openai_api_key_here
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

### Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`

### Deploy to AWS, DigitalOcean, or any VPS

1. **Set up your server** with Node.js 16+
2. **Clone the repository** on your server
3. **Install dependencies**: `npm run install-all`
4. **Build the frontend**: `npm run build`
5. **Set environment variables** in `.env`
6. **Use PM2** to run the app:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name wound-analysis
   pm2 startup
   pm2 save
   ```

## API Endpoints

### `POST /api/analyze/upload`
Analyze a wound image uploaded as multipart/form-data.

**Request**: FormData with `image` field
**Response**: JSON with wound analysis

### `POST /api/analyze/base64`
Analyze a wound image provided as base64.

**Request**:
```json
{
  "image": "data:image/jpeg;base64,..."
}
```
**Response**: JSON with wound analysis

### `POST /api/analyze/approve`
Save doctor's approval of a diagnosis.

**Request**:
```json
{
  "diagnosis": {...},
  "notes": "Doctor's notes",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Usage

1. **Upload or Capture Image**: Choose to upload a wound image or use your camera to capture one
2. **Analyze**: Click "Analyze Wound" to get AI-powered assessment
3. **Review Results**: View primary diagnosis, wound characteristics, and confidence levels
4. **Expand Alternatives**: Click to see alternative diagnoses if needed
5. **Review Treatment**: Read the treatment recommendations
6. **Approve**: Add notes and approve the diagnosis if accurate

## Important Notes

⚕️ **Medical Disclaimer**: This tool is designed for medical professional use only. AI analysis should always be verified by qualified healthcare providers. This is a clinical decision support tool, not a replacement for professional medical judgment.

🔒 **Privacy**: Wound images are processed but not stored permanently. Implement proper security measures and HIPAA compliance for production use.

🔑 **API Key**: Never commit your `.env` file. Keep your OpenAI API key secure.

## Future Enhancements

- [ ] Database integration for patient records
- [ ] User authentication and role management
- [ ] iOS native app version
- [ ] HIPAA-compliant secure storage
- [ ] Integration with EHR systems
- [ ] Multi-language support
- [ ] Wound tracking over time
- [ ] PDF report generation

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
