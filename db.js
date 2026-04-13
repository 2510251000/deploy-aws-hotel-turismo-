const express = require('express');
const cors    = require('cors');
const path    = require('path');
const sql     = require('mssql/msnodesqlv8');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Conexión ───────────────────────────────────────────────────────────────
const config = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=Hotel;Trusted_Connection=yes;'
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => { console.log('✅ Conectado a SQL Server'); return pool; })
  .catch(err => { console.error('❌ Error:', err.message); throw err; });

async function getPool() {
  return poolPromise;
}

// ── Rutas (igual que antes) ────────────────────────────────────────────────
app.get('/api/huespedes', async (req, res) => {
  try {
    const pool   = await getPool();
    const result = await pool.request().query('SELECT * FROM HUESPEDES');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ... el resto de tus rutas igual ...

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));