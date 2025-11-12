require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Inicializar Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();
const auth = admin.auth();

// Crear app Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido', details: error.message });
  }
};

// ============================================
// RUTA DE PRUEBA
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 API de Eventos Comunitarios funcionando!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      events: '/api/events/*',
      attendances: '/api/attendances/*',
      reviews: '/api/reviews/*'
    }
  });
});

// ============================================
// AUTENTICACIÓN
// ============================================

// Registrar usuario (actualizado)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    // Validación
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password debe tener al menos 6 caracteres' });
    }
    
    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || email.split('@')[0]
    });
    
    // Crear perfil en Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: null,
      bio: '',
      isOrganizer: false,
      eventsAttended: 0,
      eventsCreated: 0,
      authProvider: 'email', // ← AGREGADO
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(400).json({ 
      error: 'Error al crear usuario', 
      details: error.message 
    });
  }
});

// Obtener perfil de usuario
app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({
      success: true,
      user: userDoc.data()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AUTENTICACIÓN CON GOOGLE
// ============================================

// Verificar token de Google y crear/actualizar usuario
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Token de Google es requerido' });
    }
    
    // Verificar el token de Google
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Verificar si el usuario ya existe en Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Crear nuevo usuario en Firestore
      const userData = {
        uid: uid,
        email: decodedToken.email,
        displayName: decodedToken.name || decodedToken.email.split('@')[0],
        photoURL: decodedToken.picture || null,
        bio: '',
        isOrganizer: false,
        eventsAttended: 0,
        eventsCreated: 0,
        authProvider: 'google',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(uid).set(userData);
      
      return res.status(201).json({
        success: true,
        message: 'Usuario creado con Google exitosamente',
        isNewUser: true,
        user: userData
      });
    } else {
      // Usuario ya existe, actualizar última conexión
      await db.collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        success: true,
        message: 'Login con Google exitoso',
        isNewUser: false,
        user: userDoc.data()
      });
    }
  } catch (error) {
    console.error('Error en autenticación de Google:', error);
    res.status(401).json({ 
      error: 'Token de Google inválido',
      details: error.message 
    });
  }
});

// ============================================
// AUTENTICACIÓN CON FACEBOOK
// ============================================

// Verificar token de Facebook y crear/actualizar usuario
app.post('/api/auth/facebook', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Token de Facebook es requerido' });
    }
    
    // Verificar el token de Firebase (que viene después de Facebook)
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Verificar si el usuario ya existe
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Crear nuevo usuario
      const userData = {
        uid: uid,
        email: decodedToken.email || `facebook_${uid}@placeholder.com`,
        displayName: decodedToken.name || 'Usuario de Facebook',
        photoURL: decodedToken.picture || null,
        bio: '',
        isOrganizer: false,
        eventsAttended: 0,
        eventsCreated: 0,
        authProvider: 'facebook',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(uid).set(userData);
      
      return res.status(201).json({
        success: true,
        message: 'Usuario creado con Facebook exitosamente',
        isNewUser: true,
        user: userData
      });
    } else {
      // Usuario ya existe
      await db.collection('users').doc(uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return res.json({
        success: true,
        message: 'Login con Facebook exitoso',
        isNewUser: false,
        user: userDoc.data()
      });
    }
  } catch (error) {
    console.error('Error en autenticación de Facebook:', error);
    res.status(401).json({ 
      error: 'Token de Facebook inválido',
      details: error.message 
    });
  }
});

// ============================================
// GESTIÓN DE EVENTOS
// ============================================

// Crear evento
app.post('/api/events', verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      category,
      maxAttendees,
      imageUrl
    } = req.body;
    
    // Validación
    if (!title || !date || !location) {
      return res.status(400).json({ 
        error: 'Título, fecha y ubicación son requeridos' 
      });
    }
    
    // Obtener datos del usuario
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    const userData = userDoc.data();
    
    const eventData = {
      title,
      description: description || '',
      date,
      time: time || '00:00',
      location,
      category: category || 'General',
      maxAttendees: maxAttendees || null,
      imageUrl: imageUrl || null,
      organizerId: req.user.uid,
      organizerName: userData.displayName || req.user.email,
      organizerPhoto: userData.photoURL || null,
      attendeesCount: 0,
      averageRating: 0,
      ratingsCount: 0,
      status: 'upcoming',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const eventRef = await db.collection('events').add(eventData);
    
    // Actualizar contador de eventos creados
    await db.collection('users').doc(req.user.uid).update({
      isOrganizer: true,
      eventsCreated: admin.firestore.FieldValue.increment(1)
    });
    
    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      event: {
        id: eventRef.id,
        ...eventData
      }
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener todos los eventos
app.get('/api/events', async (req, res) => {
  try {
    const { status, category, limit = '50' } = req.query;
    
    let query = db.collection('events');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
    
    const snapshot = await query.get();
    const events = [];
    
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener evento por ID
app.get('/api/events/:eventId', async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.eventId).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    res.json({
      success: true,
      event: {
        id: eventDoc.id,
        ...eventDoc.data()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar evento
app.put('/api/events/:eventId', verifyToken, async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.eventId).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    const eventData = eventDoc.data();
    
    if (eventData.organizerId !== req.user.uid) {
      return res.status(403).json({ 
        error: 'No autorizado para modificar este evento' 
      });
    }
    
    const updates = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Campos que no se pueden actualizar
    delete updates.organizerId;
    delete updates.createdAt;
    delete updates.attendeesCount;
    delete updates.averageRating;
    delete updates.ratingsCount;
    
    await db.collection('events').doc(req.params.eventId).update(updates);
    
    res.json({
      success: true,
      message: 'Evento actualizado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar evento
app.delete('/api/events/:eventId', verifyToken, async (req, res) => {
  try {
    const eventDoc = await db.collection('events').doc(req.params.eventId).get();
    
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    const eventData = eventDoc.data();
    
    if (eventData.organizerId !== req.user.uid) {
      return res.status(403).json({ 
        error: 'No autorizado para eliminar este evento' 
      });
    }
    
    await db.collection('events').doc(req.params.eventId).delete();
    
    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ASISTENCIAS
// ============================================

// Confirmar asistencia
app.post('/api/events/:eventId/attend', verifyToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.uid;
    
    // Verificar si el evento existe
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    const eventData = eventDoc.data();
    
    // Verificar si ya está registrado
    const existingAttendance = await db.collection('attendances')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get();
    
    if (!existingAttendance.empty) {
      return res.status(400).json({ 
        error: 'Ya estás registrado en este evento' 
      });
    }
    
    // Verificar límite de asistentes
    if (eventData.maxAttendees && eventData.attendeesCount >= eventData.maxAttendees) {
      return res.status(400).json({ error: 'Evento lleno' });
    }
    
    // Crear asistencia
    const attendanceData = {
      eventId,
      userId,
      eventTitle: eventData.title,
      eventDate: eventData.date,
      eventTime: eventData.time,
      status: 'confirmed',
      registeredAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('attendances').add(attendanceData);
    
    // Actualizar contador
    await db.collection('events').doc(eventId).update({
      attendeesCount: admin.firestore.FieldValue.increment(1)
    });
    
    res.status(201).json({
      success: true,
      message: 'Asistencia confirmada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancelar asistencia
app.delete('/api/events/:eventId/attend', verifyToken, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const userId = req.user.uid;
    
    const attendanceSnapshot = await db.collection('attendances')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get();
    
    if (attendanceSnapshot.empty) {
      return res.status(404).json({ 
        error: 'No estás registrado en este evento' 
      });
    }
    
    // Eliminar asistencia
    const batch = db.batch();
    attendanceSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Actualizar contador
    await db.collection('events').doc(eventId).update({
      attendeesCount: admin.firestore.FieldValue.increment(-1)
    });
    
    res.json({
      success: true,
      message: 'Asistencia cancelada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mis asistencias
app.get('/api/my-attendances', verifyToken, async (req, res) => {
  try {
    const snapshot = await db.collection('attendances')
      .where('userId', '==', req.user.uid)
      .get();
    
    const attendances = [];
    snapshot.forEach(doc => {
      attendances.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      count: attendances.length,
      attendances
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RESEÑAS
// ============================================

// Crear reseña
app.post('/api/events/:eventId/reviews', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const eventId = req.params.eventId;
    const userId = req.user.uid;
    
    // Validación
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating debe estar entre 1 y 5' 
      });
    }
    
    // Verificar que asistió
    const attendanceSnapshot = await db.collection('attendances')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get();
    
    if (attendanceSnapshot.empty) {
      return res.status(403).json({ 
        error: 'Debes asistir al evento para dejar una reseña' 
      });
    }
    
    // Verificar si ya dejó reseña
    const existingReview = await db.collection('reviews')
      .where('eventId', '==', eventId)
      .where('userId', '==', userId)
      .get();
    
    if (!existingReview.empty) {
      return res.status(400).json({ 
        error: 'Ya has dejado una reseña para este evento' 
      });
    }
    
    // Obtener datos del usuario
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    const reviewData = {
      eventId,
      userId,
      userName: userData.displayName,
      userPhoto: userData.photoURL || null,
      rating,
      comment: comment || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('reviews').add(reviewData);
    
    // Actualizar promedio del evento
    const eventDoc = await db.collection('events').doc(eventId).get();
    const eventData = eventDoc.data();
    
    const newRatingsCount = eventData.ratingsCount + 1;
    const newAverage = ((eventData.averageRating * eventData.ratingsCount) + rating) / newRatingsCount;
    
    await db.collection('events').doc(eventId).update({
      averageRating: newAverage,
      ratingsCount: newRatingsCount
    });
    
    res.status(201).json({
      success: true,
      message: 'Reseña creada exitosamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener reseñas de un evento
app.get('/api/events/:eventId/reviews', async (req, res) => {
  try {
    const snapshot = await db.collection('reviews')
      .where('eventId', '==', req.params.eventId)
      .get();
    
    const reviews = [];
    snapshot.forEach(doc => {
      reviews.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   🚀 Servidor iniciado exitosamente       ║
╠════════════════════════════════════════════╣
║   📍 URL: http://localhost:${PORT}           ║
║   🔥 Firebase: Conectado                  ║
║   📚 Documentación: http://localhost:${PORT}  ║
╚════════════════════════════════════════════╝
  `);
});

// Manejo de errores global
process.on('unhandledRejection', (error) => {
  console.error('❌ Error no manejado:', error);
});