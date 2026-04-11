const express = require('express');
const {Pool} = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Connecting to PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'my-first-project',
    password: 'YOUR_PASSWORD',
    port: 5432
});

async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

async function resetMatches() {
    await query("DELETE FROM matches");
    await query("ALTER SEQUENCE matches_id_seq RESTART WITH 1");
}

resetMatches();

// Getting all players
app.get('/api/players', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Getting one player
app.get('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM players WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Creating a player
app.post('/api/players', async (req, res) => {
  try {
    const { name, age, ranking } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await pool.query(
      'INSERT INTO players (name, age, ranking) VALUES ($1, $2, $3) RETURNING *',
      [name, age, ranking]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// Updating a player
app.put('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, ranking } = req.body;

    const result = await pool.query(
      'UPDATE players SET name=$1, age=$2, ranking=$3 WHERE id=$4 RETURNING *',
      [name, age, ranking, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// Deleting a player
app.delete('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM players WHERE id = $1 RETURNING *', [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.status(200).json({ message: 'Player deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// Getting all tournaments
app.get('/api/tournaments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tournaments ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// Getting one tournament
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM tournaments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Creating a tournament
app.post('/api/tournaments', async (req, res) => {
  try {
    const { name, location, date } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const result = await pool.query(
      'INSERT INTO tournaments (name, location, date) VALUES ($1, $2, $3) RETURNING *',
      [name, location, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

// Updating a tournament
app.put('/api/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, date } = req.body;

    const result = await pool.query(
      'UPDATE tournaments SET name=$1, location=$2, date=$3 WHERE id=$4 RETURNING *',
      [name, location, date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

// Deleting a tournament
app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tournaments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.status(200).json({ message: 'Tournament deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
});

// Getting all rounds
app.get('/api/rounds', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rounds ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rounds' });
  }
});

// Getting one round
app.get('/api/rounds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM rounds WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Round not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Creating a round
app.post('/api/rounds', async (req, res) => {
  try {
    const { tournament_id, round_number } = req.body;

    if (!tournament_id || !round_number) {
      return res.status(400).json({ error: 'tournament_id and round_number are required' });
    }

    const result = await pool.query(
      'INSERT INTO rounds (tournament_id, round_number) VALUES ($1, $2) RETURNING *',
      [tournament_id, round_number]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create round' });
  }
});

// Updating a round
app.put('/api/rounds/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { round_number } = req.body;

    const result = await pool.query(
      'UPDATE rounds SET round_number=$1 WHERE id=$2 RETURNING *',
      [round_number, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Round not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update round' });
  }
});

// Deleting a round
app.delete('/api/rounds/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM rounds WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Round not found' });
    }

    res.status(200).json({ message: 'Round deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete round' });
  }
});

// Getting all matches
app.get('/api/matches', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM matches ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Getting one match
app.get('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM matches WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Creating a match
app.post('/api/matches', async (req, res) => {
  try {
    const { round_id, player1_id, player2_id, winner_id } = req.body;

    if (!round_id || !player1_id || !player2_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(
      'INSERT INTO matches (round_id, player1_id, player2_id, winner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [round_id, player1_id, player2_id, winner_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Updating a match
app.put('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { winner_id } = req.body;

    const result = await pool.query(
      'UPDATE matches SET winner_id=$1 WHERE id=$2 RETURNING *',
      [winner_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Deleting a match
app.delete('/api/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM matches WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.status(200).json({ message: 'Match deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Getting all matches in one round
app.get('/api/rounds/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM matches WHERE round_id = $1 ORDER BY id',
      [id]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches for this round' });
  }
});

function shuffle(array) {
  let current = array.length,
    randomIndex;

  while (current !== 0) {
    randomIndex = Math.floor(Math.random() * current);
    current--;
    [array[current], array[randomIndex]] = [array[randomIndex], array[current]];
  }

  return array;
}

// Generate matches in a tournament
app.post('/api/tournaments/:id/generate-matches', async (req, res) => {
  try {
    const tournament_id = req.params.id;

    const tour = await pool.query('SELECT * FROM tournaments WHERE id=$1', [tournament_id]);
    if (tour.rows.length === 0) {
        return res.status(404).json({ error: 'Tournament not found' });
    }

    // Create round
    const roundResult = await pool.query(
      'INSERT INTO rounds (tournament_id, round_number) VALUES ($1, $2) RETURNING *',
      [tournament_id, 1]
    );

    const round_id = roundResult.rows[0].id;

    const players = await pool.query('SELECT * FROM players');
    if (players.rows.length < 2)
      return res.status(400).json({ error: 'Not enough players' });

    const shuffled = shuffle(players.rows);

    let matches = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      const p1 = shuffled[i];
      const p2 = shuffled[i + 1];

      if (!p2) break;

      const match = await pool.query(
        'INSERT INTO matches (round_id, player1_id, player2_id) VALUES ($1, $2, $3) RETURNING *',
        [round_id, p1.id, p2.id]
      );
      matches.push(match.rows[0]);
    }

    res.status(201).json({ round_id, matches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate matches' });
  }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});