const express = require('express');
const router = express.Router();
const validator = require('validator');
const database = require('../config/database-adapter');
const EmailService = require('../config/email');

// Validation middleware
const validateInscription = (req, res, next) => {
  const { 
    firstName, lastName, email, phone, birthDate, 
    address, city, postalCode, country, program, motivation 
  } = req.body;

  const errors = [];

  // Required fields validation
  if (!firstName || firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters long');
  }
  if (!lastName || lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters long');
  }
  if (!email || !validator.isEmail(email)) {
    errors.push('Please provide a valid email address');
  }
  if (!phone || !validator.isMobilePhone(phone, 'any')) {
    errors.push('Please provide a valid phone number');
  }
  if (!birthDate || !validator.isDate(birthDate)) {
    errors.push('Please provide a valid birth date');
  }
  if (!address || address.trim().length < 5) {
    errors.push('Address must be at least 5 characters long');
  }
  if (!city || city.trim().length < 2) {
    errors.push('City must be at least 2 characters long');
  }
  if (!postalCode || postalCode.trim().length < 2) {
    errors.push('Postal code is required');
  }
  if (!country || country.trim().length < 2) {
    errors.push('Country is required');
  }
  if (!program || program.trim().length < 2) {
    errors.push('Program selection is required');
  }
  if (!motivation || motivation.trim().length < 10) {
    errors.push('Motivation must be at least 10 characters long');
  }

  // Age validation (must be at least 16)
  if (birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    if (age < 16) {
      errors.push('You must be at least 16 years old to apply');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors 
    });
  }

  next();
};

// POST /api/inscriptions - Submit new inscription
router.post('/', validateInscription, async (req, res) => {
  const { 
    firstName, lastName, email, phone, birthDate, 
    address, city, postalCode, country, program, motivation 
  } = req.body;

  try {
    // Check if email already exists
    const existingUser = await database.query(
      'SELECT id FROM inscriptions WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'An inscription with this email already exists' 
      });
    }

    // Insert new inscription
    const result = await database.query(`
      INSERT INTO inscriptions (
        first_name, last_name, email, phone, birth_date,
        address, city, postal_code, country, program, motivation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      firstName.trim(), lastName.trim(), email.toLowerCase().trim(),
      phone.trim(), birthDate, address.trim(), city.trim(),
      postalCode.trim(), country.trim(), program.trim(), motivation.trim()
    ]);

    const inscription = result.rows[0];
    
    // Send confirmation email
    try {
      await EmailService.sendInscriptionConfirmation(
        inscription.email,
        `${inscription.first_name} ${inscription.last_name}`,
        inscription.id
      );
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue without failing the inscription
    }

    res.status(201).json({
      success: true,
      message: 'Inscription submitted successfully! You will receive a confirmation email shortly.',
      data: {
        id: inscription.id,
        email: inscription.email,
        status: inscription.status,
        submittedAt: inscription.created_at
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred' 
    });
  }
});

// GET /api/inscriptions/:id - Get inscription by ID (for confirmation pages)
router.get('/:id', async (req, res) => {
  const inscriptionId = req.params.id;

  if (!validator.isInt(inscriptionId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid inscription ID' 
    });
  }

  try {
    const result = await database.query(
      'SELECT id, first_name, last_name, email, program, status, created_at FROM inscriptions WHERE id = $1',
      [inscriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inscription not found' 
      });
    }

    const inscription = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: inscription.id,
        name: `${inscription.first_name} ${inscription.last_name}`,
        email: inscription.email,
        program: inscription.program,
        status: inscription.status,
        submittedAt: inscription.created_at
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An unexpected error occurred' 
    });
  }
});

module.exports = router;