const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/supabase');

/**
 * @desc    Get all patients
 * @route   GET /api/patients
 * @access  Private
 */
const getPatients = asyncHandler(async (req, res) => {
  try {
    const { search, doctor_id = 3 } = req.query;
    let query = supabaseAdmin
      .from("patients")
      .select("*")
      .eq("doctor_id", doctor_id)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%, contact.ilike.%${search}%`);
    }

    const { data: patients, error } = await query;

    if (error) {
      res.status(400);
      throw new Error(error.message);
    }

    res.status(200).json(patients);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @desc    Get patient by ID
 * @route   GET /api/patients/:id
 * @access  Private
 */
const getPatientById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data: patient, error } = await supabaseAdmin
    .from("patients")
    .select(
      `
      *,
      appointments(*)
    `
    )
    .eq("id", id)
    .single();

  const { data: patient_documents, error: patient_documents_error } =
    await supabaseAdmin
      .from("patient_reports")
      .select(`analysis_report`)
      .eq("patient_id", id);
  if (error || !patient) {
    res.status(404);
    throw new Error("Patient not found");
  }
  if (patient_documents) {
    patient.medical_report_analysis = patient_documents.map(
      (doc) => doc.analysis_report
    );
  }
  res.status(200).json(patient);
});

const storePatientMedicalDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: doctor_id } = req.user;
  const { analysis_report } = req.body;
  const { data, error } = await supabaseAdmin.from("patient_reports").insert({
    patient_id: id,
    created_by: doctor_id,
    analysis_report: analysis_report,
  });
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  res
    .status(201)
    .json({ id: 1, message: "Analysis Report stored successfully" });
});

/**
 * @desc    Create a new patient
 * @route   POST /api/patients
 * @access  Private
 */
const createPatient = asyncHandler(async (req, res) => {
  const { name, age, gender, contact, address, email, medical_history,doctor_id } =
    req.body;

  // Check for required fields
  if (!name || !contact) {
    res.status(400);
    throw new Error("Please provide patient name and contact");
  }

  // Create patient in Supabase
  const { data, error } = await supabaseAdmin
    .from("patients")
    .insert([
      {
        name,
        age: age || null,
        gender: gender || null,
        contact,
        address: address || null,
        email: email || null,
        medical_history: medical_history || null,
        status: "active",
        last_visit: null,
        doctor_id: doctor_id || null,
      },
    ])
    .select()
    .single();

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  res.status(201).json(data);
});

/**
 * @desc    Update a patient
 * @route   PUT /api/patients/:id
 * @access  Private
 */
const updatePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    age,
    gender,
    contact,
    address,
    email,
    medical_history,
    status,
    last_visit,
    patient_document,
  } = req.body;

  // Check if patient exists
  const { data: existingPatient, error: existingError } = await supabaseAdmin
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (existingError || !existingPatient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Prepare update data
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (age !== undefined) updateData.age = age;
  if (gender !== undefined) updateData.gender = gender;
  if (contact !== undefined) updateData.contact = contact;
  if (address !== undefined) updateData.address = address;
  if (email !== undefined) updateData.email = email;
  if (medical_history !== undefined)
    updateData.medical_history = medical_history;
  if (status !== undefined) updateData.status = status;
  if (last_visit !== undefined) updateData.last_visit = last_visit;
  if (patient_document !== undefined)
    updateData.patient_document = patient_document;

  // Update patient in Supabase
  const { data: updatedPatient, error } = await supabaseAdmin
    .from("patients")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  res.status(200).json(updatedPatient);
});

/**
 * @desc    Delete a patient
 * @route   DELETE /api/patients/:id
 * @access  Private
 */
const deletePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if patient exists
  const { data: existingPatient, error: existingError } = await supabaseAdmin
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (existingError || !existingPatient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Delete patient from Supabase
  const { error } = await supabaseAdmin.from("patients").delete().eq("id", id);

  if (error) {
    res.status(400);
    throw new Error(error.message);
  }

  res.status(200).json({ message: "Patient removed" });
});

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  storePatientMedicalDocument,
};