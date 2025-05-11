const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/supabase');

/**
 * @desc    Get all appointments
 * @route   GET /api/appointments
 * @access  Private
 */
const getAppointments = asyncHandler(async (req, res) => {
  try {
    const { 
      date, 
      status, 
      start_date, 
      end_date, 
      patient_id,
      type,
      limit,
      page = 1
    } = req.query;
    
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients(id, name, contact, email, birth_date, gender)
      `);
      
    // Filter by date if provided
    if (date) {
      query = query.eq('date', date);
    }
    
    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Filter by patient if provided
    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }
    
    // Filter by appointment type if provided
    if (type) {
      query = query.eq('type', type);
    }
    
    // Filter by date range if provided
    if (start_date && end_date) {
      query = query.gte('date', start_date).lte('date', end_date);
    } else if (start_date) {
      query = query.gte('date', start_date);
    } else if (end_date) {
      query = query.lte('date', end_date);
    }
    
    // Order by date and time
    query = query.order('date', { ascending: true }).order('time', { ascending: true });
    
    // Add pagination if limit is provided
    if (limit) {
      const pageSize = parseInt(limit);
      const pageIndex = parseInt(page) - 1;
      const from = pageSize * pageIndex;
      const to = from + pageSize - 1;
      
      query = query.range(from, to);
    }
    
    const { data: appointments, error, count } = await query;
    
    if (error) {
      res.status(400);
      throw new Error(error.message);
    }
    
    // If limit was provided, get total count for pagination
    if (limit) {
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from('appointments')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        res.status(400);
        throw new Error(countError.message);
      }
      
      return res.status(200).json({
        data: appointments,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      });
    }
    
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500);
    throw new Error(`Error getting appointments: ${error.message}`);
  }
});

/**
 * @desc    Get today's appointments
 * @route   GET /api/appointments/today
 * @access  Private
 */
const getTodayAppointments = asyncHandler(async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients(id, name, contact, email, birth_date, gender)
      `)
      .eq('date', today)
      .order('time', { ascending: true });
      
    if (error) {
      res.status(400);
      throw new Error(error.message);
    }
    
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500);
    throw new Error(`Error getting today's appointments: ${error.message}`);
  }
});

/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Private
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients(*)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      res.status(404);
      throw new Error('Appointment not found');
    }
    
    res.status(200).json(appointment);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving appointment');
  }
});

/**
 * @desc    Create a new appointment
 * @route   POST /api/appointments
 * @access  Private
 */
const createAppointment = asyncHandler(async (req, res) => {
  try {
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
          created_by: req.user.id,
        },
      ])
      .select()
      .single();
      
    if (error) {
      res.status(400);
      throw new Error(error.message);
    }
    
    // Update patient's last visit date if appointment is for today
    const today = new Date().toISOString().split('T')[0];
    if (date === today && status === 'confirmed') {
      await supabaseAdmin
        .from('patients')
        .update({ last_visit: date })
        .eq('id', patient_id);
    }
    
    // Get complete appointment data with patient information
    const { data: appointmentWithPatient, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patients(id, name, contact, email, birth_date, gender)
      `)
      .eq('id', newAppointment.id)
      .single();
    
    if (fetchError) {
      res.status(400);
      throw new Error(fetchError.message);
    }
    
    res.status(201).json(appointmentWithPatient);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error creating appointment');
  }
});

/**
 * @desc    Update an appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
const updateAppointment = asyncHandler(async (req, res) => {
  try {
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
    
    // Add updated_at and updated_by fields
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = req.user.id;
    
    // Update appointment in Supabase
    const { data: updatedAppointment, error } = await supabaseAdmin
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patients(id, name, contact, email, birth_date, gender)
      `)
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
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error updating appointment');
  }
});

/**
 * @desc    Delete an appointment
 * @route   DELETE /api/appointments/:id
 * @access  Private
 */
const deleteAppointment = asyncHandler(async (req, res) => {
  try {
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
    
    res.status(200).json({ message: 'Appointment removed successfully' });
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error deleting appointment');
  }
});

/**
 * @desc    Get appointment statistics
 * @route   GET /api/appointments/stats
 * @access  Private
 */
const getAppointmentStats = asyncHandler(async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const today = new Date();
    let startDate;
    
    // Calculate start date based on period
    switch (period) {
      case 'day':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
    }
    
    // Format dates for query
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = today.toISOString().split('T')[0];
    
    // Get all appointments for the period
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .gte('date', formattedStartDate)
      .lte('date', formattedEndDate);
      
    if (error) {
      res.status(400);
      throw new Error(error.message);
    }
    
    // Calculate statistics
    const stats = {
      total: appointments.length,
      byStatus: {
        pending: appointments.filter(app => app.status === 'pending').length,
        confirmed: appointments.filter(app => app.status === 'confirmed').length,
        completed: appointments.filter(app => app.status === 'completed').length,
        cancelled: appointments.filter(app => app.status === 'cancelled').length,
      },
      byType: {},
    };
    
    // Calculate appointments by type
    appointments.forEach(appointment => {
      const type = appointment.type || 'other';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });
    
    // Calculate appointments by date for charts
    const appointmentsByDate = {};
    
    appointments.forEach(appointment => {
      const date = appointment.date;
      appointmentsByDate[date] = (appointmentsByDate[date] || 0) + 1;
    });
    
    // Convert to array format for charts
    const dailyAppointments = Object.entries(appointmentsByDate).map(([date, count]) => ({
      date,
      appointments: count,
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    res.status(200).json({
      ...stats,
      dailyAppointments,
      period,
      dateRange: {
        start: formattedStartDate,
        end: formattedEndDate,
      },
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Error getting appointment statistics: ${error.message}`);
  }
});

/**
 * @desc    Get appointments for a patient
 * @route   GET /api/patients/:patientId/appointments
 * @access  Private
 */
const getPatientAppointments = asyncHandler(async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if patient exists
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .single();
      
    if (patientError || !patient) {
      res.status(404);
      throw new Error('Patient not found');
    }
    
    // Get appointments for the patient
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })
      .order('time', { ascending: true });
      
    if (error) {
      res.status(400);
      throw new Error(error.message);
    }
    
    res.status(200).json(appointments);
  } catch (error) {
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error getting patient appointments');
  }
});

module.exports = {
  getAppointments,
  getTodayAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentStats,
  getPatientAppointments,
};