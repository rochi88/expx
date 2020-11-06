// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
  host: "db",
  database: "docker",
  user: "postgres",
  password: "postgres",
  port: 5432
});
//pgClient.on('error', () => console.log('Lost PG connection'));

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pgClient.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

// promise - checkout a client
pgClient
  .connect()
  .then(client => {
    return client
      .query('CREATE TABLE IF NOT EXISTS values (number INT)')
      .then(res => {
        client.release()
        console.log(res.rows[0])
      })
      .catch(err => {
        client.release()
        console.log(err.stack)
      })
  })
  
// async/await - check out a client
// ;(async () => {
//   const client = await pgClient.connect()
//   try {
//     const res = await client.query('SELECT * from values')
//     console.log(res.rows[0])
//   } finally {
//     // Make sure to release the client before any error handling,
//     // just in case the error handling itself throws an error.
//     client.release()
//   }
// })().catch(err => console.log(err.stack))

//pgClient
//  .query('CREATE TABLE IF NOT EXISTS values (number INT)')
//  .catch(err => console.log(err));

// Express route handlers

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
  host: "redis",
  port: 6379,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

app.get('/', (req, res) => {
  res.send('Hi');
});

app.get('/values/all', async (req, res) => {
  const values = await pgClient.query('SELECT * from values');

  res.send(values.rows);
});



app.listen(5000, err => {
  console.log('Listening');
});
