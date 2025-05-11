const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/supabase');

/**
 * @desc    Get all appointments
 * @route   GET /api/appointments
 * @access  Private
 */
const getAppointments = asyncHandler(async (req, res) => {
  const { date, status } = req.query;
  
  let query = supabaseAdmin
    .from('appointments')
    .select(`
      *,
      patients(id, name, contact)
    `)
    .order('date', { ascending: true })
    .order('time', { ascending: true });
    
  // Filter by date if provided
  if (date) {
    query = query.eq('date', date);
  }
  
  // Filter by status if provided
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data: appointments, error } = await query;
  
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  res.status(200).json(appointments);
});

/**
 * @desc    Get today's appointments
 * @route   GET /api/appointments/today
 * @access  Private
 */
const getTodayAppointments = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: appointments, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      *,
      patients(id, name, contact)
    `)
    .eq('date', today)
    .order('time', { ascending: true });
    
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  res.status(200).json(appointments);
});

/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { data: appointment, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      *,
      patients(*)
    `)
    .eq('id', id)
    .single();
    
  if (error || !appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  
  res.status(200).json(appointment);
});

/**
 * @desc    Create a new appointment
 * @route   POST /api/appointments
 * @access  Private
 */
const createAppointment = asyncHandler(async (req, res) => {
  const { patient_id, date, time, type, notes, status = 'pending' } = req.body;
  
  // Check for required fields
  if (!patient_id || !date || !time || !type) {
    res.status(400);
    throw new Error('Please provide patient, date, time, and appointment type');
  }
  
  // Check if patient exists
  const { data: patient, error: patientError } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('id', patient_id)
    .single();
    
  if (patientError || !patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  
  // Check if time slot is available
  const { data: existingAppointment, error: existingError } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('date', date)
    .eq('time', time)
    .not('status', 'eq', 'cancelled')
    .maybeSingle();
    
  if (existingAppointment) {
    res.status(400);
    throw new Error('This time slot is already booked');
  }
  
  // Create appointment in Supabase
  const { data: newAppointment, error } = await supabaseAdmin
    .from('appointments')
    .insert([
      {
        patient_id,
        date,
        time,
        type,
        notes: notes || null,
        status,
      },
    ])
    .select()
    .single();
    
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  // Update patient's last visit date
  await supabaseAdmin
    .from('patients')
    .update({ last_visit: date })
    .eq('id', patient_id);
  
  res.status(201).json(newAppointment);
});

/**
 * @desc    Update an appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { patient_id, date, time, type, notes, status } = req.body;
  
  // Check if appointment exists
  const { data: existingAppointment, error: existingError } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single();
    
  if (existingError || !existingAppointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  
  // Check if time slot is available (if changing date/time)
  if ((date && date !== existingAppointment.date) || (time && time !== existingAppointment.time)) {
    const { data: timeConflict, error: timeError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('date', date || existingAppointment.date)
      .eq('time', time || existingAppointment.time)
      .not('id', 'eq', id)
      .not('status', 'eq', 'cancelled')
      .maybeSingle();
      
    if (timeConflict) {
      res.status(400);
      throw new Error('This time slot is already booked');
    }
  }
  
  // Prepare update data
  const updateData = {};
  
  if (patient_id !== undefined) updateData.patient_id = patient_id;
  if (date !== undefined) updateData.date = date;
  if (time !== undefined) updateData.time = time;
  if (type !== undefined) updateData.type = type;
  if (notes !== undefined) updateData.notes = notes;
  if (status !== undefined) updateData.status = status;
  
  // Update appointment in Supabase
  const { data: updatedAppointment, error } = await supabaseAdmin
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  // If status is 'completed', update patient's last visit date
  if (status === 'completed') {
    await supabaseAdmin
      .from('patients')
      .update({ last_visit: date || existingAppointment.date })
      .eq('id', patient_id || existingAppointment.patient_id);
  }
  
  res.status(200).json(updatedAppointment);
});

/**
 * @desc    Delete an appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private
 */
const deleteAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if appointment exists
  const { data: existingAppointment, error: existingError } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single();
    
  if (existingError || !existingAppointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }
  
  // Delete appointment from Supabase
  const { error } = await supabaseAdmin
    .from('appointments')
    .delete()
    .eq('id', id);
    
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  res.status(200).json({ message: 'Appointment removed' });
});

module.exports = {
  getAppointments,
  getTodayAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};