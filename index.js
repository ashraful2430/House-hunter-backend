const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://house-hunter365.netlify.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASSWORD}@cluster0.cy95lx0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("HouseDB").collection("users");
    const rentedHouseCollection = client.db("HouseDB").collection("rented");
    const bookedHouseCollection = client.db("HouseDB").collection("booked");

    // booked house api

    app.get("/booked/:email", async (req, res) => {
      const query = { bookedEmail: req.params.email };
      const result = await bookedHouseCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/booked", async (req, res) => {
      const result = await bookedHouseCollection.find().toArray();
      res.send(result);
    });

    app.get("/booked/count/:email", async (req, res) => {
      const query = { bookedEmail: req.params.email };
      const count = await bookedHouseCollection.countDocuments(query);
      res.send({ count });
    });

    app.delete("/booked/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookedHouseCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/booked", async (req, res) => {
      const info = req.body;
      const result = await bookedHouseCollection.insertOne(info);
      res.send(result);
    });

    //   rented house api

    app.get("/rented", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const filter = req.query;

      const query = { city: { $regex: filter.search, $options: "i" } };
      const result = await rentedHouseCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/rented/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await rentedHouseCollection.findOne(query);
      res.send(result);
    });

    app.get("/houseCount", async (req, res) => {
      const count = await rentedHouseCollection.estimatedDocumentCount();
      res.send({ count });
    });

    app.patch("/rented/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      console.log("Received id:", id);

      try {
        const objectId = new ObjectId(id);
        const filter = { _id: objectId };
        const updatedDoc = {
          $set: {
            houseName: item.houseName,
            address: item.address,
            bathrooms: item.bathrooms,
            bedroom: item.bedroom,
            city: item.city,
            date: item.date,
            image: item.image,
            number: item.number,
            rent: item.rent,
            size: item.size,
            details: item.details,
          },
        };
        const result = await rentedHouseCollection.updateOne(
          filter,
          updatedDoc
        );
        res.send(result);
      } catch (error) {
        console.error("Error creating ObjectId:", error);
        res.status(400).send("Invalid ObjectId format");
        return;
      }
    });

    app.delete("/rented/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await rentedHouseCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/rented/owner/:email", async (req, res) => {
      const query = { email: req.params.email };
      console.log(query, "135");
      const result = await rentedHouseCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    app.post("/rented", async (req, res) => {
      const info = req.body;
      const result = await rentedHouseCollection.insertOne(info);
      res.send(result);
    });

    //   user related api

    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const query = { email: req.params.email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existedUser = await userCollection.findOne(query);
      if (existedUser) {
        return res.send({ message: "user already existed", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("housing server is running");
});
app.listen(port, () => {
  console.log(`housing server is running of ${port}`);
});
