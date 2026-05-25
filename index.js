const express = require('express');
const dotenv =require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // booking collection
    const bookingCollection = db.collection('bookings')

    // create post api
    app.post('/add-car', async(req, res)=> {
      const carData = req.body
      console.log(carData, 'from server'); 
      const result = await carCollection.insertOne(carData)
      
      res.json(result)
    })

    // create get api
    app.get('/explore-cars', async(req, res)=> {
      const result = await carCollection.find().toArray();
      res.json(result);
    })
    // details api via id
    app.get('/explore-cars/:id', async(req, res) => {
      const {id} = req.params;

      const result = await carCollection.findOne({_id: new ObjectId(id)});
      res.json(result)
    })


    // booking post api
    app.post('/booking', async (req, res)=> {
      const bookingData = req.body;
      const result = await bookingCollection.insertOne(bookingData)

      res.json(result)
    })

    // booking get api
    app.get('/booking/:userId', async (req, res)=> {
      const {userId} = req.params;
      const result = await bookingCollection.find({userId: userId}).toArray();
      
      res.json(result)
    })



    // my added car get api
    app.get('/add-car/:userId', async(req, res) => {
      const {userId} = req.params;

      const result = await carCollection.find({userId: userId}).toArray();
      res.json(result)
    })  


    // delete car from my added car
    app.delete('/add-car/:carId', async(req, res) => {
      const {carId} = req.params;

      const result = await carCollection.deleteOne({_id: new ObjectId(carId)});
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