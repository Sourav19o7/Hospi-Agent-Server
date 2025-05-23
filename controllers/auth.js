
const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      contactNumber,
      specialization,
      password,
      confirmPassword,
      agreeToTerms
    } = req.body;

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = No rows found, ignore this error
      throw fetchError;
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if agreed to terms
    if (!agreeToTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the terms and conditions'
      });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('doctors')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        contact_number: contactNumber,
        specialization,
        password: hashedPassword,
        agree_to_terms: agreeToTerms
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const payload = {
         id: newUser.id,
         email: newUser.email,
         firstName: newUser.first_name,
         lastName: newUser.last_name
       };
   
   const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });


    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        email: newUser.email,
        contactNumber: newUser.contact_number,
        specialization: newUser.specialization
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Fetch user by email, including password hash
    const { data: user, error } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('email', email)
      .single();
    
   
    

    if (error) {
      // If user not found or other error
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const payload = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      contactNumber: user.contact_number,
      specialization: user.specialization
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Return user info without password
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        contactNumber: user.contact_number,
        specialization: user.specialization
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};