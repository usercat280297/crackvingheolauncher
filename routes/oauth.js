const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check if OAuth credentials are configured
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
const hasGitHubCredentials = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

console.log('🔐 OAuth Configuration:');
console.log('   Google:', hasGoogleCredentials ? '✅ Enabled' : '❌ Disabled (missing credentials)');
console.log('   GitHub:', hasGitHubCredentials ? '✅ Enabled' : '❌ Disabled (missing credentials)');

// Configure Google OAuth only if credentials exist
if (hasGoogleCredentials) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));

  router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  }));

  router.get('/google/callback', 
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      const userData = {
        id: req.user._id,
        name: req.user.name || req.user.username,
        email: req.user.email,
        avatar: req.user.avatar
      };
      
      // Redirect to custom protocol for Electron app
      const redirectUrl = `gamelauncher://oauth?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      window.location.href = redirectUrl;
    }
  );
} else {
  router.get('/google', (req, res) => {
    res.status(503).json({ 
      error: 'Google OAuth not configured',
      message: 'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env'
    });
  });
  
  router.get('/google/callback', (req, res) => {
    res.status(503).json({ error: 'Google OAuth not configured' });
  });
}

// Configure GitHub OAuth only if credentials exist
if (hasGitHubCredentials) {
  const GitHubStrategy = require('passport-github2').Strategy;
  
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/github/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });
        
        if (!user) {
          user = await User.create({
            githubId: profile.id,
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
            avatar: profile.photos?.[0]?.value
          });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));

  router.get('/github', passport.authenticate('github', { 
    scope: ['user:email'] 
  }));

  router.get('/github/callback',
    passport.authenticate('github', { session: false, failureRedirect: '/login' }),
    (req, res) => {
      const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      const userData = {
        id: req.user._id,
        name: req.user.name || req.user.username,
        email: req.user.email,
        avatar: req.user.avatar
      };
      
      // Redirect to custom protocol for Electron app
      const redirectUrl = `gamelauncher://oauth?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
      
      res.send(`
        <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-center: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #24292e 0%, #000 100%);
              }
              .container {
                text-align: center;
                background: white;
                padding: 3rem;
                border-radius: 1rem;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              }
              h1 { color: #24292e; margin-bottom: 1rem; }
              p { color: #666; margin-bottom: 2rem; }
              .spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #24292e;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Authentication Successful!</h1>
              <p>Redirecting you back to the launcher...</p>
              <div class="spinner"></div>
            </div>
            <script>
              setTimeout(() => {
                window.location.href = '${redirectUrl}';
              }, 1500);
            </script>
          </body>
        </html>
      `);
    }
  );
} else {
  router.get('/github', (req, res) => {
    res.status(503).json({ 
      error: 'GitHub OAuth not configured',
      message: 'Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env'
    });
  });
  
  router.get('/github/callback', (req, res) => {
    res.status(503).json({ error: 'GitHub OAuth not configured' });
  });
}

if (hasGoogleCredentials || hasGitHubCredentials) {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

router.get('/steam', (req, res) => {
  res.status(501).json({ message: 'Steam login coming soon' });
});

router.get('/status', (req, res) => {
  res.json({
    google: hasGoogleCredentials,
    github: hasGitHubCredentials,
    steam: false
  });
});

module.exports = router;