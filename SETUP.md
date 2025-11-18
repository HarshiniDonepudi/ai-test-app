# Quick Setup Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you'll need it in the next step)

**Note**: You need GPT-4 Vision access. Make sure your OpenAI account has access to `gpt-4o` or `gpt-4-vision-preview` models.

### Step 2: Configure Environment Variables

1. Open the `.env` file in the project root
2. Replace `your_openai_api_key_here` with your actual API key:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   PORT=5000
   ```
3. Save the file

### Step 3: Run the Application

Open a terminal in the project directory and run:

```bash
npm run dev
```

This will start:
- Backend API server on http://localhost:5000
- Frontend React app on http://localhost:3000

### Step 4: Use the Application

1. Open your browser to http://localhost:3000
2. Upload a wound image or use your camera to capture one
3. Click "Analyze Wound"
4. Review the AI-generated diagnosis
5. Expand "Alternative Diagnoses" to see other possibilities
6. Read treatment recommendations
7. Approve the diagnosis with optional notes

## 📱 Testing on Mobile

To test the camera feature on your mobile device:

1. Make sure your computer and phone are on the same network
2. Find your computer's IP address:
   - Mac: System Preferences → Network
   - Windows: `ipconfig` in Command Prompt
   - Linux: `ip addr` or `ifconfig`
3. Open `http://YOUR_IP_ADDRESS:3000` on your phone
4. The camera feature will work natively on mobile browsers

## 🔧 Troubleshooting

### "Failed to analyze wound"
- Check that your OpenAI API key is valid
- Ensure you have GPT-4 Vision access on your OpenAI account
- Check your internet connection
- Verify the OpenAI API is not experiencing downtime

### Camera not working
- Allow camera permissions in your browser
- Camera feature works best on HTTPS (use in production)
- Try using the file upload feature instead

### Port already in use
- Change the PORT in `.env` to a different number (e.g., 5001)
- Kill any process using port 5000: `lsof -ti:5000 | xargs kill -9` (Mac/Linux)

### React app won't start
- Delete `client/node_modules` and run `npm run install-all` again
- Clear npm cache: `npm cache clean --force`

## 🌐 Deploying to Production

### Quick Deploy to Heroku (Recommended for beginners)

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login:
   ```bash
   heroku login
   ```
3. Create app:
   ```bash
   heroku create wound-analysis-app
   ```
4. Set your OpenAI API key:
   ```bash
   heroku config:set OPENAI_API_KEY=your_key_here
   ```
5. Deploy:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```
6. Open your app:
   ```bash
   heroku open
   ```

### Deploy to Vercel (Best for frontend-focused deployment)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Run:
   ```bash
   vercel
   ```
3. Set environment variables in Vercel dashboard
4. Your app is live!

## 🔐 Security Notes

- Never commit your `.env` file to version control
- In production, implement HIPAA-compliant security measures
- Use HTTPS in production (required for camera access)
- Implement user authentication for real medical use
- Add rate limiting to prevent API abuse
- Consider encrypting stored data

## 📊 Cost Estimation

GPT-4 Vision API costs (as of 2024):
- ~$0.01-0.03 per image analysis
- Actual cost depends on image size and response length

For 100 analyses per day: ~$1-3/day or $30-90/month

## 🎯 Next Steps

Once the basic app is running:

1. **Add Authentication**: Implement user login/signup
2. **Database**: Connect to MongoDB or PostgreSQL for storing records
3. **iOS App**: Use React Native or Swift to build native iOS version
4. **Advanced Features**:
   - Wound tracking over time
   - Comparison between visits
   - PDF report generation
   - Integration with EHR systems

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Heroku Deployment Guide](https://devcenter.heroku.com/articles/deploying-nodejs)

## 💡 Tips

- Test with various wound images to improve accuracy
- Add custom prompts to fine-tune AI responses
- Monitor API usage in OpenAI dashboard
- Keep your API keys secure at all times
- Consider upgrading to GPT-5.1 when available (minimal code changes needed)

---

Need help? Check the README.md for more detailed information.
