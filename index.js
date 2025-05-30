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
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
})

const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cors({
    origin: ["https://discussion-alpha.vercel.app", "http://localhost:5173"]
}))

// ✅ MongoDB URI
const uri = "mongodb+srv://knightninja70:atlas1515@messanger.m2srcq3.mongodb.net/messanger?retryWrites=true&w=majority&appName=messanger"

// ✅ MongoClient sozlamalari
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
})

let userCollection

// ✅ MongoDB ulanadi va `chat` kolleksiyasini oladi
async function connectToMongo() {
    try {
        await client.connect()
        const db = client.db("crud") // sizda `crud` db ichida `chat` bor
        userCollection = db.collection("chat")
        console.log("✅ MongoDB Atlas connected!")
    } catch (err) {
        console.error("❌ MongoDB connection error:", err)
    }
}

connectToMongo()

// ✅ SOCKET.IO ishlayapti
io.on("connection", (socket) => {
    console.log("🔌 New client connected")

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected")
    })
})

// ✅ CREATE user
app.post("/users", async (req, res) => {
    try {
        const result = await userCollection.insertOne(req.body)
        io.emit("user-updated")
        res.status(201).json({ insertedId: result.insertedId })
    } catch (err) {
        console.error("POST /users error:", err)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

// ✅ READ users
app.get("/users", async (req, res) => {
    try {
        const users = await userCollection.find().toArray()
        res.json(users)
    } catch (err) {
        console.error("GET /users error:", err)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

// ✅ UPDATE user
app.put("/users/:id", async (req, res) => {
    try {
        const result = await userCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        )

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "User not found or unchanged" })
        }

        io.emit("user-updated")
        res.json({ message: "User updated successfully" })
    } catch (err) {
        console.error("PUT /users/:id error:", err)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

// ✅ DELETE user
app.delete("/users/:id", async (req, res) => {
    try {
        const result = await userCollection.deleteOne({ _id: new ObjectId(req.params.id) })

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "User not found" })
        }

        io.emit("user-updated")
        res.json({ message: "User deleted successfully" })
    } catch (err) {
        console.error("DELETE /users/:id error:", err)
        res.status(500).json({ error: "Internal Server Error" })
    }
})

// ✅ Fallback error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err)
    res.status(500).json({ error: "Internal Server Error" })
})

// ✅ SERVER listener
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
})
