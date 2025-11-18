# Quick Start Guide - 3 Steps to Launch

## ⚡ Super Fast Setup

### Step 1️⃣: Get OpenAI API Key (2 minutes)

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)

### Step 2️⃣: Add API Key (30 seconds)

Open `.env` file and replace the placeholder:

```env
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
PORT=5000
```

### Step 3️⃣: Start the App (1 minute)

Run this command:

```bash
./start.sh
```

Or manually:

```bash
npm run dev
```

**That's it!** 🎉

Open http://localhost:3000 in your browser.

---

## 🎯 What You Can Do Now

1. **Upload Image**: Click "Upload Image" and select a wound photo
2. **Take Photo**: Click "Take Photo" to use your camera
3. **Analyze**: Click "Analyze Wound" to get AI predictions
4. **View Results**: See location, etiology, severity
5. **Expand Alternatives**: Click to see other possible diagnoses
6. **Review Treatment**: Read the treatment recommendations
7. **Approve**: Add notes and approve if correct

---

## 🌐 Deploy to Web (5 minutes)

### Deploy to Heroku (Free)

```bash
heroku login
heroku create
heroku config:set OPENAI_API_KEY=your-key-here
git init
git add .
git commit -m "Initial commit"
git push heroku main
heroku open
```

### Deploy to Vercel (Free)

```bash
npm i -g vercel
vercel
# Follow prompts and add OPENAI_API_KEY in dashboard
```

---

## 📱 Test on Phone

1. Find your computer's IP:
   - Mac: System Preferences → Network
   - Windows: Run `ipconfig`

2. On your phone, open: `http://YOUR-IP:3000`

3. Allow camera permissions

4. Test the camera capture feature!

---

## ❓ Troubleshooting

**Problem**: "Failed to analyze wound"
**Solution**: Check your OpenAI API key in `.env` file

**Problem**: Camera not working
**Solution**: Use the file upload option instead

**Problem**: Port 5000 in use
**Solution**: Change PORT in `.env` to 5001

---

## 📚 More Information

- Full docs: See [README.md](README.md)
- Setup details: See [SETUP.md](SETUP.md)
- Project overview: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

**Need Help?** Check the full documentation files above!
