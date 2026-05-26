const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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


const JWKS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
)

// middleware 
const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ message: "unauthorized" });
  }
  const token = authHeader.split(" ")[1]
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS)
    next()
    console.log(payload);
  }
  catch (error) {
    return res.status(403).json({ message: "Forbidden" });

  }

}


async function run() {
  try {
    // Connect the client
    await client.connect();

    // create database and collection
    const db = client.db('driveFleet')
    const carCollection = db.collection('cars')
    // booking collection
    const bookingCollection = db.collection('bookings')

    // car post api
    app.post('/add-car', verifyToken, async (req, res) => {
      const carData = {
        ...req.body,
        booking_count: 0 
      };

      console.log(carData, 'from server');

      const result = await carCollection.insertOne(carData);

      res.json(result);
    });


    //  get api for explore cars
    app.get('/explore-cars', async (req, res) => {

      try {
        const { search = "", type = "" } = req.query;
        let query = {};

        // search
        if (search) {
          query.carName = {
            $regex: search,
            $options: "i",
          };
        }

        // filter
        if (type) {
          query.carType = type;
        }

        console.log(query);

        const result = await carCollection
          .find(query)
          .toArray();

        res.json(result);

      } catch (error) {

        console.log(error);

        res.status(500).json({
          message: "Server Error",
        });

      }

    });


    // details api via id
    app.get('/explore-cars/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await carCollection.findOne({ _id: new ObjectId(id) });
      res.json(result)
    })

    // booking post api
    app.post('/booking', verifyToken, async (req, res) => {

      try {

        const bookingData = req.body;

        if (!bookingData?.carId) {
          return res.status(400).json({
            success: false,
            message: "carId is required"
          });
        }



        // 1. Save booking
        const bookingResult = await bookingCollection.insertOne(bookingData);

        // 2. Increase booking count
        await carCollection.updateOne(
          { _id: new ObjectId(bookingData.carId) },
          {
            $inc: { booking_count: 1 }
          }
        );

        // 3. Get updated car (IMPORTANT for frontend display)
        const updatedCar = await carCollection.findOne(
          { _id: new ObjectId(bookingData.carId) }
        );

        res.status(201).json({
          success: true,
          bookingId: bookingResult.insertedId,
          bookingCount: updatedCar?.booking_count || 0
        });

      } catch (error) {

        console.log(error);

        res.status(500).json({
          success: false,
          message: "Booking failed"
        });

      }

    });



    // booking get api
    app.get('/booking/:userId', verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await bookingCollection.find({ userId: userId }).toArray();

      res.json(result)
    })



    // my added car get api
    app.get('/add-car/:userId', verifyToken, async (req, res) => {
      const { userId } = req.params;

      const result = await carCollection.find({ userId: userId }).toArray();
      res.json(result)
    })


    // edit car from my added car
    app.patch('/add-car/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      const result = await carCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );

      res.json(result)
    })


    // delete car from my added car
    app.delete('/add-car/:carId', verifyToken, async (req, res) => {
      const { carId } = req.params;

      const result = await carCollection.deleteOne({ _id: new ObjectId(carId) });
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

app.get('/', (req, res) => {
  res.send('server is running on browser')
})

app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
})