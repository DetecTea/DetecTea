const express = require('express');
const axios = require('axios');

const app = express();
const port = 3020;

// Endpoint untuk mendapatkan cuaca saat ini berdasarkan nama kota
app.get('/api/current-weather', async (req, res) => {
  try {
    const { city } = req.query;

    const apiKey = '';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

    const response = await axios.get(apiUrl);
    const weatherData = response.data;

    const { name, main, weather } = weatherData;
    const { temp } = main;
    const { description } = weather[0];

    const kelvin = temp;
    const celsius = Math.round(kelvin - 273.15);

    const weatherInfo = {
      city: name,
      temperature: celsius,
      condition: description
    };

    res.status(200).json(weatherInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengambil data cuaca' });
  }
});


app.get('/api/forecast', async (req, res) => {
  try {
    const { city, days } = req.query;

    const apiKey = '';
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}`;

    const response = await axios.get(apiUrl);
    const forecastData = response.data;

    const forecastInfo = forecastData.list
      .filter((item, index) => index < days)
      .map((item) => {
        const { dt_txt, main, weather } = item;
        const { temp } = main;
        const { description } = weather[0];

        const kelvin = temp;
        const celsius = Math.round(kelvin - 273.15);


        return {
          date: dt_txt,
          temperature: celsius,
          condition: description
        };
      });

    res.status(200).json(forecastInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memprediksi cuaca' });
  }
});

// Handle root request
app.get('/', (req, res) => {
  res.send('Selamat datang di Aplikasi Cuaca');
});

// Menjalankan aplikasi di port yang ditentukan
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

