# GEMINI_API_KEY Setup Instructions

## Problem
The AI Product Manager is working but needs the GEMINI_API_KEY environment variable to be configured.

## Solution

### Step 1: Get Your Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Add to Environment Variables
Open your `.env` file in the `/Users/ismadbek/Desktop/ShopFlow/` directory and add:

```bash
# Gemini API
GEMINI_API_KEY=your_actual_api_key_here
```

### Step 3: Restart the Backend Server
After adding the API key, restart the backend server:

```bash
# Kill current server
pkill -f "nest start"

# Start server again
npm start
```

## Complete .env Example
Your `.env` file should look like this:

```bash
# Postgres connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopflow
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Gemini API
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

## Verification
After setup, you should be able to:
1. Upload an image with handwritten product list
2. Click "Analyze" button
3. See AI-detected products in the table
4. Edit and confirm products
5. Create products in database

## Troubleshooting
- If you get "GEMINI_API_KEY not configured", double-check the .env file
- Make sure there are no spaces around the = sign
- Restart the server after changing .env
- Verify your Gemini API key is valid and active
