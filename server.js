const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'my-first-project',
    password: 'DMa52808',
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


// GET all players
app.get('/api/players', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM players ORDER BY id');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// GET one player
app.get('/api/players/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM players WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// CREATE player
app.post('/api/players', async (req, res) => {
    const { name, age, ranking, seed } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'name is required' });
    }

    if (age === undefined || age === null || typeof age !== 'number' || age < 10 || age > 100) {
        return res.status(400).json({ error: 'age must be a number between 10 and 100' });
    }

    if (ranking === undefined || ranking === null || typeof ranking !== 'number' || ranking <= 0) {
        return res.status(400).json({ error: 'ranking must be a positive number' });
    }

    if (seed === undefined || seed === null || typeof seed !== 'number' || seed <= 0) {
        return res.status(400).json({ error: 'seed must be a positive number' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO players (name, age, ranking, seed) VALUES ($1, $2, $3, $4) RETURNING *',
            [name.trim(), age, ranking, seed]
        );

        res.status(201).json(result.rows[0]);
     } catch (err) {
        if (err.code === "23505") {
            return res.status(400).json({ error: "ranking or seed must be unique" });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create player' });
    }
});

// UPDATE player
app.put('/api/players/:id', async (req, res) => {
    const { id } = req.params;
    const { name, age, ranking, seed } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'name is required' });
    }

    if (typeof age !== 'number' || age < 10 || age > 100) {
        return res.status(400).json({ error: 'age must be 10–100' });
    }

    if (typeof ranking !== 'number' || ranking <= 0) {
        return res.status(400).json({ error: 'ranking must be positive' });
    }

    if (typeof seed !== 'number' || seed <= 0) {
        return res.status(400).json({ error: 'seed must be positive' });
    }

    try {
        const result = await pool.query(
            'UPDATE players SET name=$1, age=$2, ranking=$3, seed=$4 WHERE id=$5 RETURNING *',
            [name.trim(), age, ranking, seed, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.code === "23505") {
            return res.status(400).json({ error: "ranking or seed must be unique" });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to update player' });
    }
});

// DELETE player
app.delete('/api/players/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM players WHERE id=$1 RETURNING *',
            [id]
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

// GET all tournaments
app.get('/api/tournaments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tournaments ORDER BY id');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
});

// GET one tournament
app.get('/api/tournaments/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tournaments WHERE id=$1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// CREATE tournament
app.post('/api/tournaments', async (req, res) => {
    const { name, start_date } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'name is required' });
    }

    if (!start_date) {
        return res.status(400).json({ error: 'start date is required' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO tournaments (name, start_date) VALUES ($1, $2) RETURNING *',
            [name.trim(), start_date]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create tournament' });
    }
});

// UPDATE tournament
app.put('/api/tournaments/:id', async (req, res) => {
    const { name, start_date } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'name is required' });
    }

    if (!start_date) {
        return res.status(400).json({ error: 'start date is required' });
    }

    try {
        const result = await pool.query(
            'UPDATE tournaments SET name=$1, start_date=$2 WHERE id=$3 RETURNING *',
            [name.trim(), start_date, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update tournament' });
    }
});

// DELETE tournament
app.delete('/api/tournaments/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM tournaments WHERE id=$1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        res.status(200).json({ message: 'Tournament deleted', deleted: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete tournament' });
    }
});

// GET all rounds
app.get('/api/rounds', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rounds ORDER BY id');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch rounds' });
    }
});

// GET one round
app.get('/api/rounds/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM rounds WHERE id=$1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Round not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// CREATE round
app.post('/api/rounds', async (req, res) => {
    const { tournament_id, round_number } = req.body;

    if (!tournament_id || typeof tournament_id !== 'number') {
        return res.status(400).json({ error: 'tournament_id is required and must be a number' });
    }

    if (!round_number || typeof round_number !== 'number') {
        return res.status(400).json({ error: 'round_number is required and must be a number' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO rounds (tournament_id, round_number) VALUES ($1, $2) RETURNING *',
            [tournament_id, round_number]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create round' });
    }
});

// UPDATE round
app.put('/api/rounds/:id', async (req, res) => {
    const { round_number } = req.body;

    if (typeof round_number !== 'number') {
        return res.status(400).json({ error: 'round_number must be a number' });
    }

    try {
        const result = await pool.query(
            'UPDATE rounds SET round_number=$1 WHERE id=$2 RETURNING *',
            [round_number, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Round not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update round' });
    }
});

// DELETE round
app.delete('/api/rounds/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM rounds WHERE id=$1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Round not found' });
        }

        res.status(200).json({ message: 'Round deleted', deleted: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete round' });
    }
});

// GET all matches
app.get('/api/matches', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT m.id, m.round_id, p1.name AS player1, p2.name AS player2, w.name AS winner, m.player1_id, m.player2_id, m.winner_id, m.score, m.match_time FROM matches LEFT JOIN players p1 ON p1.id = m.player1_id LEFT JOIN players p2 ON p2.id = m.player2_id LEFT JOIN players w  ON w.id = m.winner_id ORDER BY m.id;');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// GET one match
app.get('/api/matches/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT m.id, m.round_id, p1.name AS player1, p2.name AS player2, w.name AS winner, m.player1_id, m.player2_id, m.winner_id, m.score, m.match_time FROM matches LEFT JOIN players p1 ON p1.id = m.player1_id LEFT JOIN players p2 ON p2.id = m.player2_id LEFT JOIN players w  ON w.id = m.winner_id WHERE m.id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// CREATE match
app.post('/api/matches', async (req, res) => {
    const { round_id, player1_id, player2_id } = req.body;

    if (typeof round_id !== 'number') {
        return res.status(400).json({ error: 'round_id is required' });
    }

    if (typeof player1_id !== 'number') {
        return res.status(400).json({ error: 'player1_id is required' });
    }

    if (player2_id !== null && typeof player2_id !== 'number') {
        return res.status(400).json({ error: "player2_id must be null or a number" });
    }

    if (player1_id === player2_id) {
        return res.status(400).json({ error: "Players must be different" });
    }

    try {
        const result = await pool.query(
            'INSERT INTO matches (round_id, player1_id, player2_id) VALUES ($1, $2, $3) RETURNING *',
            [round_id, player1_id, player2_id || null]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create match' });
    }
});

// UPDATE match
app.put("/api/matches/:id", async (req, res) => {
    const id = req.params.id;
    const {winner_id, score} = req.body;

    if (typeof score !== "string" || score.trim() === "") {
        return res.status(400).json({ error: "score required" });
    }

    try {
        const result = await pool.query(
            "UPDATE matches SET winner_id=$1, score=$2 WHERE id=$3 RETURNING *",
            [winner_id, score, id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Failed to update match result"});
    }
});

// DELETE match
app.delete('/api/matches/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM matches WHERE id=$1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        res.status(200).json({ message: 'Match deleted', deleted: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete match' });
    }
});

// GET all rounds in one tournament
app.get('/api/tournaments/:id/rounds', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM rounds WHERE tournament_id = $1 ORDER BY round_number',
            [req.params.id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch rounds" });
    }
});

// GET all matches in one round
app.get('/api/rounds/:id/matches', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT m.id, m.round_id, p1.name AS player1, p2.name AS player2, w.name AS winner, m.player1_id, m.player2_id, m.winner_id, m.score, m.match_time FROM matches m LEFT JOIN players p1 ON p1.id = m.player1_id LEFT JOIN players p2 ON p2.id = m.player2_id LEFT JOIN players w  ON w.id = m.winner_id WHERE m.round_id = $1 ORDER BY m.id',
            [req.params.id]
        );

        res.status(200).json(result.rows);
        console.log("Round ID:", req.params.id);
    } catch (err) {
        console.error("DB ERROR:", err);
        res.status(500).json({
            error: 'Failed to fetch matches for round',
            detail: err.message
    });
}
});

function shuffle(array) {
  let current = array.length, randomIndex;

  while (current !== 0) {
    randomIndex = Math.floor(Math.random() * current);
    current--;

    [array[current], array[randomIndex]] =
      [array[randomIndex], array[current]];
  }

  return array;
}

// Generate matches in a tournament
app.post('/api/tournaments/:id/generate-matches', async (req, res) => {
    const tournament_id = req.params.id;

    try {
        // 1. DELETE existing matches for this tournament
        await pool.query(`
            DELETE FROM matches
            WHERE round_id IN (
                SELECT id FROM rounds WHERE tournament_id = $1
            )
        `, [tournament_id]);

        await pool.query("DELETE FROM rounds WHERE tournament_id = $1", [tournament_id]);

        // 2. Count players
        const playersResult = await pool.query(
            "SELECT id FROM players ORDER BY RANDOM()"
        );
        let players = playersResult.rows.map(p => p.id);
        let playerCount = players.length;

        // 3. Create Round 1
        const round1 = await pool.query(
            "INSERT INTO rounds (tournament_id, round_number) VALUES ($1, $2) RETURNING id",
            [tournament_id, 1]
        );
        const round1Id = round1.rows[0].id;

        // 4. Pair players
        let matchPairs = [];

        while (players.length >= 2) {
            let p1 = players.pop();
            let p2 = players.pop() ?? null;
            matchPairs.push([p1, p2]);
        }

        if (players.length === 1) {
            // BYE
            matchPairs.push([players.pop(), null]);
        }

        // 5. Insert matches
        for (const [p1, p2] of matchPairs) {

            if (!p1) continue;

            await pool.query(
                "INSERT INTO matches(round_id, player1_id, player2_id, match_time, winner_id) VALUES ($1, $2, $3, NOW(), $4)",
                [round1Id, p1, p2 ?? null, p2 === null ? p1 : null]
            );
        }

        return res.json({
            message: "Round 1 generated dynamically",
            matchesCreated: matchPairs.length
        });
    
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Failed to create matches"});
    }
});

// Generating next round
app.post("/api/tournaments/:id/next-round", async (req, res) => {
    const tournament_id = req.params.id;

    try {
        // 1. Load existing rounds
        const roundsResult = await pool.query(
            "SELECT * FROM rounds WHERE tournament_id = $1 ORDER BY round_number ASC",
            [tournament_id]
        );
        const rounds = roundsResult.rows;

        if (rounds.length === 0) {
            return res.status(400).json({error: "Generate matches first"});
        }

        const lastRound = rounds[rounds.length - 1];

        const matchesResult = await pool.query(
            "SELECT * FROM matches WHERE round_id = $1",
            [lastRound.id]
        );
        const matches = matchesResult.rows;

        // 2. Do not generate next round until ALL matches finished
        const allCompleted = matches.every(m =>
            m.winner_id !== null || m.player2_id === null
        );

        if (!allCompleted) {
            return res.json({message: "Round not complete"});
        }

        // 3. Collect winners
        const winners = matches.map(
            m => m.winner_id ?? m.player1_id
        );

        // 4. If only 1 winner → tournament is finished
        if (winners.length === 1) {
            const resultWinner = await pool.query(
                "SELECT name FROM players WHERE id = $1",
                [winners[0]]
            );
            const winnerName = resultWinner.rows[0].name;

            return res.json({
                message: `Tournament winner: ${winnerName}`,
                winnerName
            });
        }

        // 5. Create next round
        const nextRoundNumber = lastRound.round_number + 1;

        const nextRound = await pool.query(
            "INSERT INTO rounds (tournament_id, round_number) VALUES ($1, $2) RETURNING id",
            [tournament_id, nextRoundNumber]
        );
        const nextRoundId = nextRound.rows[0].id;

        // 6. Pair winners
        let shuffled = winners.sort(() => Math.random() - 0.5);
        let matchPairs = [];

        while (shuffled.length >= 2) {
            matchPairs.push([shuffled.pop(), shuffled.pop()]);
        }

        if (shuffled.length === 1) {
            matchPairs.push([shuffled.pop(), null]);
        }

        // 7. Insert matches
        for (const [p1, p2] of matchPairs) {
            await pool.query(
                "INSERT INTO matches(round_id, player1_id, player2_id, match_time, winner_id) VALUES ($1, $2, $3, NOW(), $4)",
                [nextRoundId, p1, p2, p2 === null ? p1 : null]
            );
        }

        res.json({
            message: `Round ${nextRoundNumber} generated`,
            matchesCreated: matchPairs.length
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Failed to generate next round"});
    }
});

// Public API usage
app.get('/api/tournaments/:id/enriched', async (req, res) => {
    try {
        const { id } = req.params;

        const dbResult = await pool.query(
            'SELECT * FROM tournaments WHERE id = $1',
            [id]
        );

        if (dbResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        const tournament = dbResult.rows[0];

        const searchName = encodeURIComponent(tournament.name);

        const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${searchName}`;

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(500).json({ error: 'Public API request failed' });
        }

        const data = await response.json();

        const teamInfo = data?.teams?.[0] || null;

        res.status(200).json({
            tournament,
            enrichment: teamInfo
                ? {
                    teamName: teamInfo.strTeam,
                    sport: teamInfo.strSport,
                    league: teamInfo.strLeague,
                    country: teamInfo.strCountry
                }
                : null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch enriched tournament data' });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});