const express = require("express")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: ["https://discussion-alpha.vercel.app", "http://localhost:5173"],
        methods: ["POST", "GET", "PUT", "DELETE"]
    }
})

const PORT = 3000

app.use(express.json())
app.use(cors({
    origin: ["https://discussion-alpha.vercel.app", "http://localhost:5173"]
}))

const uri = "mongodb+srv://knightninja70:atlas1515@messanger.m2srcq3.mongodb.net/Messanger?retryWrites=true&w=majority&appName=messanger"

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    },
    ssl: true,
    tlsAllowInvalidCertificates: true
})

let userCollection

async function connectToMongo() {
    try {
        await client.connect()
        const db = client.db("crud")
        userCollection = db.collection("chat")
        console.log("✅ MongoDB Atlas connected!");
    } catch (err) {
        console.log("Error", err);
    }
}

connectToMongo()

io.on("connection", (socket) => {
    console.log("New client connected")

    socket.on("disconnect", () => {
        console.log("Client disconnected");
    })
})

// CRUD --

app.post("/users", async (req, res) => {
    try {
        const result = await userCollection.insertOne(req.body)
        io.emit("user-updated")
        res.status(201).json({ insertedId: result.insertedId })
    } catch (err) {
        console.log("Error:", err)
        res.status(500).json({ error: "Server error" });
    }
})

app.get("/users", async (req, res) => {
    try {
        if (!userCollection) {
            return res.status(500).json({ error: "MongoDB not connected" })
        }
        const users = await userCollection.find().toArray()
        res.json(users)
    } catch (err) {
        console.log("Error", err);
        res.status(500).json({ error: "Server error" });
    }
})

app.put("/users/:id", async (req, res) => {
    try {
        const userId = req.params.id
        const updatedData = req.body

        const result = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updatedData }
        )

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Account not found or unchanged" })
        }

        io.emit("user-updated")
        res.json({ message: "Account successfully updated" })
    } catch (err) {
        console.log("Error", err);
        res.status(500).json({ error: "Server error" });
    }
})

app.delete("/users/:id", async (req, res) => {
    try {
        const userId = req.params.id
        const deleting = await userCollection.deleteOne({ _id: new ObjectId(userId) })

        if (deleting.deletedCount === 0) {
            return res.status(404).json({ error: "Account not found" })
        }

        io.emit("user-updated")
        res.json({ message: "Account successfully deleted" })
    } catch (err) {
        console.log("Error", err);
        res.status(500).json({ error: "Server error" });
    }
})

// EXTRA --

app.use((err, req, res, next) => {
    console.log("Global error:", err);
    res.status(500).json({ error: "Internal Server Error" })
})

server.listen(PORT)