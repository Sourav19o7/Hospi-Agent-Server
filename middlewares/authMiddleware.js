const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware to protect routes - verifies JWT token and sets user in request
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from Supabase
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, created_at, avatar_url')
        .eq('id', decoded.id)
        .single();
        
      if (error || !user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }
      // Set user in request object
      req.user = user;
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
  
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * Middleware to check if user has admin role
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};

module.exports = { protect, admin };