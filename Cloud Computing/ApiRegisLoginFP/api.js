const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceAccount.json');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');


const firebaseConfig = {
  
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Inisialisasi Firebase App
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseConfig.databaseURL
  });
}

const db = admin.firestore();
const app = express();
const port = 3010;
const secretKey = 'your-secret-key'; // Kunci rahasia untuk JWT, ganti dengan kunci Anda sendiri

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Endpoint untuk registrasi
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: username
    });

    // Simpan data pengguna ke Firestore
    await db.collection('').doc(userRecord.uid).set({
      email,
      username
    });

    res.status(200).json({ message: 'Registrasi berhasil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat registrasi' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRecord = await admin.auth().getUserByEmail(email);

    // Verifikasi bahwa pengguna ditemukan
    if (userRecord) {
      const uid = userRecord.uid;

      // Buat token JWT
      const token = jwt.sign({ uid }, secretKey);

      res.status(200).json({ token });
    } else {
      res.status(401).json({ error: 'Email atau password salah' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat login' });
  }
});

const transporter = nodemailer.createTransport({
  // Konfigurasi transporter email Anda
  service: 'Gmail', 
  auth: {
    user: '', 
    pass: '' 
  }
});



app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    
    const actionCodeSettings = {
      url: "http://localhost:3000/api/forgot-password", 
      handleCodeInApp: true
    };
    const resetPasswordLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    // Kirim email reset password menggunakan Nodemailer
    const mailOptions = {
      from: 'noreply@example.com',
      to: email,
      subject: 'Reset Password',
      text: `Klik tautan berikut untuk mereset password Anda: ${resetPasswordLink}`
    };
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email reset password telah dikirim' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan dalam mengirim email reset password' });
  }
});

// Middleware untuk memeriksa token akses
const authenticate = (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Akses ditolak' });
    }

    const token = authorization.split('Bearer ')[1];

    // Verifikasi token JWT
    jwt.verify(token, secretKey, (err, decodedToken) => {
      if (err) {
        console.error(err);
        return res.status(401).json({ error: 'Token akses tidak valid' });
      }

      req.user = decodedToken;
      next();
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Token akses tidak valid' });
  }
};

// Contoh endpoint yang dilindungi, hanya dapat diakses setelah autentikasi
app.get('/api/protected', authenticate, (req, res) => {
  const user = req.user;
  
  res.status(200).json({ message: 'Endpoint yang dilindungi, hanya dapat diakses setelah autentikasi' });
});

app.listen(port, () => {
  console.log(`API berjalan di http://localhost:${port}`);
});
