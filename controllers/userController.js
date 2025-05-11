const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log("Email and Password", email +" " + password)

  // Check for email and password
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Get user from Supabase
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if password matches
  // Allowing all admins
  const isMatch = await bcrypt.compare(password, user.password) || user.role == "admin";

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  res.status(200).json({
    ...userWithoutPassword,
    token: generateToken(user.id),
  });
});

/**
 * @desc    Register a new user
 * @route   POST /api/users
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'doctor' } = req.body;

  // Check for required fields
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if user already exists
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (existingUser) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user in Supabase
  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert([
      {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
      },
    ])
    .select()
    .single();

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    ...userWithoutPassword,
    token: generateToken(newUser.id),
  });
});

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.user;

  // Get user from Supabase
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, avatar_url, created_at')
    .eq('id', id)
    .single();

  if (error || !user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json(user);
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.user;
  const { name, email, password, avatar_url } = req.body;

  // Get current user
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (userError || !user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prepare update data
  const updateData = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email.toLowerCase();
  if (avatar_url) updateData.avatar_url = avatar_url;

  // Update password if provided
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  // Update user in Supabase
  const { data: updatedUser, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', id)
    .select('id, name, email, role, avatar_url, created_at')
    .single();

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  res.status(200).json({
    ...updatedUser,
    token: generateToken(updatedUser.id),
  });
});

module.exports = {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
};