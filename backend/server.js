const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bpmn_designer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Test database connection
const initializeDatabase = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Connected to PostgreSQL database');
    
    // Ensure tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bpmn_designs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        key VARCHAR(255) NOT NULL,
        description TEXT,
        xml_content TEXT NOT NULL,
        thumbnail TEXT,
        created_by VARCHAR(255) ,
        updated_by VARCHAR(255) ,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        tags TEXT[] DEFAULT '{}',
        version INTEGER DEFAULT 1
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Retry after delay
    setTimeout(initializeDatabase, 5000);
  }
};

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Routes

// Get all BPMN designs
app.get('/api/designs', async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, name, description, thumbnail, 
        created_at, updated_at,created_by, tags, version,
        LENGTH(xml_content) as xml_size
      FROM bpmn_designs
    `;
    let countQuery = 'SELECT COUNT(*) FROM bpmn_designs';
    const params = [];
    const countParams = [];

    if (search) {
      query += ` WHERE name ILIKE $1 OR description ILIKE $1 OR $1 = ANY(tags)`;
      countQuery += ` WHERE name ILIKE $1 OR description ILIKE $1 OR $1 = ANY(tags)`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [designsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, countParams)
    ]);

    const designs = designsResult.rows;
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      designs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching designs:', error);
    res.status(500).json({ error: 'Failed to fetch designs' });
  }
});

// Get single BPMN design
app.get('/api/designs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT id, name , key, description, xml_content, thumbnail, created_at, updated_at,created_by, tags, version as version_number
       FROM bpmn_designs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching design:', error);
    res.status(500).json({ error: 'Failed to fetch design' });
  }
});

// Create new BPMN design
app.post('/api/designs', async (req, res) => {
  try {
    const { name,key, description, xml_content, thumbnail, tags } = req.body;
    
    if (!name || !xml_content) {
      return res.status(400).json({ error: 'Name and XML content are required' });
    }

    // Check for duplicate key before inserting
    if (key) {
      const duplicateKeyCheck = await pool.query(
        'SELECT id FROM bpmn_designs WHERE key = $1',
        [key]
      );
      if (duplicateKeyCheck.rows.length > 0) {
        return res.status(400).json({ error: `Provided model key already exists: ${key}`  });
      }
    }

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO bpmn_designs (id, name, key, description, xml_content, thumbnail, tags) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, key, description, thumbnail, created_at, updated_at, tags, version`,
      [id, name, key, description || '', xml_content, thumbnail || null, tags || []]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating design:', error);
    res.status(500).json({ error: 'Failed to create design' });
  }
});

// Update BPMN design
app.put('/api/designs/:id', async (req, res) => {
  try {    
    const { id } = req.params;    
    const { name, key ,description , tags } = req.body;

    const result = await pool.query(
      `UPDATE bpmn_designs 
       SET name = $1, key = $2 ,description = $3 , tags = $4, 
           updated_at = CURRENT_TIMESTAMP, version = version + 1 
       WHERE id = $5
       RETURNING id, name, key, description ,xml_content , created_at , updated_at , created_by ,tags, version as version_number `,
      [name, key,description , tags , id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Save version history
    await pool.query(
      `INSERT INTO design_versions (design_id, version_number, xml_content , created_by) 
       SELECT $1, version - 1, xml_content , created_by FROM bpmn_designs WHERE id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({ error: 'Failed to update design' });
  }
});

// Update BPMN design
app.put('/api/design/:id', async (req, res) => {
  try {    
    const { id } = req.params;    
    const { name, key, description, xml_content, thumbnail, tags, history } = req.body;
    const versionUpdate = history ? 'version + 1' : 'version';
    
    const result = await pool.query(
      `UPDATE bpmn_designs 
       SET name = $1, key = $2 ,description = $3 , xml_content = $4 , thumbnail = $5 , tags = $6, 
           updated_at = CURRENT_TIMESTAMP, version = ${versionUpdate} 
       WHERE id = $7
       RETURNING id, name, key, description ,xml_content , created_at , updated_at , created_by ,tags, version as version_number `,
      [name, key,description ,xml_content, thumbnail , tags , id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    // Save version history
    if (history){
      await pool.query(
        `INSERT INTO design_versions (design_id, version_number, xml_content , created_by) 
         SELECT $1, version - 1 , xml_content , created_by FROM bpmn_designs WHERE id = $1`,
        [id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating design:', error);
    res.status(500).json({ error: 'Failed to update design' });
  }
});

// Delete BPMN design
app.delete('/api/designs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM bpmn_designs WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    res.status(500).json({ error: 'Failed to delete design' });
  }
});

// Get design by version
app.get('/api/designs/:id/version/:version', async (req, res) => {
  try {
    const { id, version } = req.params;
    const result = await pool.query(
      `SELECT dv.version_number, dv.xml_content, dv.created_at, dv.created_by, dv.comment, 
              bd.name, bd.key, bd.description, bd.tags
         FROM design_versions dv
         JOIN bpmn_designs bd ON dv.design_id = bd.id
        WHERE dv.design_id = $1 AND dv.version_number = $2
        LIMIT 1`,
      [id, version]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching design by version:', error);
    res.status(500).json({ error: 'Failed to fetch design by version' });
  }
});


// Get design versions
app.get('/api/designs/:id/versions', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT version_number, xml_content, created_at,created_by, comment 
       FROM design_versions 
       WHERE design_id = $1 
       ORDER BY version_number DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching versions:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Initialize database and start server
// initializeDatabase().then(() => {
//   app.listen(port, '0.0.0.0', () => {
//     console.log(`BPMN Designer backend running on port ${port}`);
//     console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
//   });
// }).catch(console.error);
