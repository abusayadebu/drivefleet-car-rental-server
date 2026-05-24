const express = require('express');
const dotenv =require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
dotenv.config();

const uri = process.env.MONGODB_URI;

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    // Connect the client
    await client.connect();
    
    // create database and collection
    const db = client.db('driveFleet')
    const carCollection = db.collection('cars')

    // create api
    app.post('/add-car', async(req, res)=> {
      const carData = req.body
      console.log(carData, 'from server'); 
      const result = await carCollection.insertOne(carData)
      
      res.json(result)
    })


    // Send a ping
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res)=>{
    res.send('server is running on browser')
})

app.listen(PORT, ()=> {
    console.log(`server is running on ${PORT}`);
})