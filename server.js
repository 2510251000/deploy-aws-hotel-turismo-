const express = require('express');
const sql     = require('mssql/msnodesqlv8');
const cors    = require('cors');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Conexión ───────────────────────────────────────────────────────────────
const config = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=Hotel;Trusted_Connection=yes;'
};

const poolPromise = new sql.ConnectionPool(config).connect();

async function getPool() {
  return poolPromise;
}

// ══════════════════════════════════════════════════════════════════════════════
// HUÉSPEDES
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/huespedes', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query('SELECT * FROM HUESPEDES');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/huespedes/:id', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), req.params.id)
      .query('SELECT * FROM HUESPEDES WHERE id_huespedes = @id');
    if (!result.recordset.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/huespedes', async (req, res) => {
  const { id_huespedes, nombre, telefono, edad } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id',       sql.NVarChar(50), id_huespedes)
      .input('nombre',   sql.NVarChar(50), nombre)
      .input('telefono', sql.Int,          telefono)
      .input('edad',     sql.NChar(10),    edad)
      .query('INSERT INTO HUESPEDES VALUES (@id, @nombre, @telefono, @edad)');
    res.json({ mensaje: 'Huésped creado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/huespedes/:id', async (req, res) => {
  const { nombre, telefono, edad } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id',       sql.NVarChar(50), req.params.id)
      .input('nombre',   sql.NVarChar(50), nombre)
      .input('telefono', sql.Int,          telefono)
      .input('edad',     sql.NChar(10),    edad)
      .query('UPDATE HUESPEDES SET nombre=@nombre, telefono=@telefono, edad=@edad WHERE id_huespedes=@id');
    res.json({ mensaje: 'Huésped actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/huespedes/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.NVarChar(50), req.params.id)
      .query('DELETE FROM HUESPEDES WHERE id_huespedes = @id');
    res.json({ mensaje: 'Huésped eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// HABITACIONES
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/habitaciones', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query('SELECT * FROM HABITACIONES');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/habitaciones', async (req, res) => {
  const { id_habitaciones, n_habitacion, n_huespedes } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id',   sql.Int, id_habitaciones)
      .input('nHab', sql.Int, n_habitacion)
      .input('nHue', sql.Int, n_huespedes)
      .query('INSERT INTO HABITACIONES VALUES (@id, @nHab, @nHue)');
    res.json({ mensaje: 'Habitación creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/habitaciones/:id', async (req, res) => {
  const { n_habitacion, n_huespedes } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id',   sql.Int, req.params.id)
      .input('nHab', sql.Int, n_habitacion)
      .input('nHue', sql.Int, n_huespedes)
      .query('UPDATE HABITACIONES SET n_habitacion=@nHab, n_huespedes=@nHue WHERE id_habitaciones=@id');
    res.json({ mensaje: 'Habitación actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/habitaciones/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM HABITACIONES WHERE id_habitaciones = @id');
    res.json({ mensaje: 'Habitación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// RESERVAS
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/reservas', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query(`
      SELECT r.*, h.nombre AS nombre_huesped, hab.n_habitacion
      FROM RESERVAS r
      LEFT JOIN HUESPEDES    h   ON r.id_huespedes    = h.id_huespedes
      LEFT JOIN HABITACIONES hab ON r.id_habitaciones = hab.id_habitaciones
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reservas', async (req, res) => {
  const { id_reservas, n_fecha, n_hora, id_huespedes, id_habitaciones, id_pago, id_servicio } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id',    sql.NChar(10),    id_reservas)
      .input('fecha', sql.Date,         n_fecha)
      .input('hora',  sql.NChar(10),    n_hora)
      .input('hue',   sql.NVarChar(50), id_huespedes)
      .input('hab',   sql.Int,          id_habitaciones)
      .input('pago',  sql.NChar(10),    id_pago)
      .input('serv',  sql.NChar(10),    id_servicio)
      .query('INSERT INTO RESERVAS VALUES (@id, @fecha, @hora, @hue, @hab, @pago, @serv)');
    res.json({ mensaje: 'Reserva creada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reservas/:id', async (req, res) => {
  const { n_fecha, n_hora, id_huespedes, id_habitaciones, id_pago, id_servicio } = req.body;
  try {
    const pool = await getPool();
    await pool.request()
      .input('id',    sql.NChar(10),    req.params.id)
      .input('fecha', sql.Date,         n_fecha)
      .input('hora',  sql.NChar(10),    n_hora)
      .input('hue',   sql.NVarChar(50), id_huespedes)
      .input('hab',   sql.Int,          id_habitaciones)
      .input('pago',  sql.NChar(10),    id_pago)
      .input('serv',  sql.NChar(10),    id_servicio)
      .query(`UPDATE RESERVAS
              SET n_fecha=@fecha, n_hora=@hora, id_huespedes=@hue,
                  id_habitaciones=@hab, id_pago=@pago, id_servicio=@serv
              WHERE id_reservas=@id`);
    res.json({ mensaje: 'Reserva actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reservas/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.NChar(10), req.params.id)
      .query('DELETE FROM RESERVAS WHERE id_reservas = @id');
    res.json({ mensaje: 'Reserva eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Iniciar servidor ───────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});