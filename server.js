const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()
const Pusher = require("pusher");

const app = express()
const port = process.env.PORT;
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ed70j.mongodb.net/${process.env.DB_DB}?retryWrites=true&w=majority`;

const pusher = new Pusher({
    appId: "1148934",
    key: "5bd0359b85431909f70b",
    secret: "01722f9d59fc8ea3f678",
    cluster: "ap2",
    useTLS: true
  });

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res) => {
    res.send("hello its working");
});

const db = new MongoClient(url, {useNewUrlParser: true, useUnifiedTopology:true});
db.connect(err => {
    const userCollection = db.db("Teach-Me_coll").collection("users");
    const reviewCollection = db.db("Teach-Me_coll").collection("reviews");
    const taskCollection = db.db("Teach-Me_coll").collection("tasks");
    const messageCollection = db.db("Teach-Me_coll").collection("messages");
    const classroomCollection = db.db("Teach-Me_coll").collection("classrooms");
    const communicationCollection = db.db("Teach-Me_coll").collection("communications");
    
    const changeStream = messageCollection.watch();

    changeStream.on("change", (change) => {
        console.log("the change is",change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted', {
                name: messageDetails.name,
                message: messageDetails.message,
                chatId: messageDetails.chatId,
                timestamp: messageDetails.timestamp,  
            });
        }else {
            console.log("Error triggering Pusher");
        }
    });

    app.get('/teachers/', async (req, res) => {
        await userCollection.find({
            Types: "teacher"
        }).toArray((err, doc) => {
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.get('/user/:Id', async (req, res) => {
        const id = req.params.Id;
        await userCollection.findOne({
            userEmailId: id
        }, (err, doc)=>{ 
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.post('/user/', async (req, res) => {
        const user = req.body;
        await userCollection.insertOne(user).then(result => {
            res.send(result);
        });
    });
    app.get('/reviews/:Id', async (req, res) => {
        const id = req.params.Id;
        await reviewCollection.find({
            teachId: id
        }).toArray((err, doc) => {
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.post('/reviews/', async (req, res) => {
        const review = req.body;
        await reviewCollection.insertOne(review).then(result => {
            res.send(result);
        });
    });
    app.get('/class/task/:Id', async (req, res) => {
        const id = req.params.Id;
        await taskCollection.find({
            classId: id
        }).toArray((err, doc) => {
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.post('/class/task/', async (req, res) => {
        const task = req.body;
        await taskCollection.insertOne(task).then(result => {
            res.send(result);
        });
    });
    app.get('/messages/:Id', async (req, res) => {
        const id = req.params.Id;
        await messageCollection.find({
            chatId: id
        }).sort({"created_at": -1}).toArray((err, doc) => {
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.post('/messages/', async (req, res) => {
        const message = req.body;
        await messageCollection.insertOne(message).then(result => {
            res.send(result);
        });
    });
    app.get('/comm/student/:Id', async (req, res) => {
        const id = req.params.Id;
        await communicationCollection.find({
            studentId: id
        }).toArray((err, doc) => {
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.get('/comm/teacher/:Id', async (req, res) => {
        const id = req.params.Id;
        await communicationCollection.find({
            teachId: id
        }).toArray((err, doc) => {
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.post('/comm/', async (req, res) => {
        const communication = req.body;
        await communicationCollection.insertOne(communication).then(result => {
            res.send(result);
        });
    });
    app.get('/class/teacher/:Id', async (req, res) => {
        const id = req.params.Id;
        await classroomCollection.find({
            teachId: id
        }).toArray((err, doc) => {
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.get('/class/student/:Id', async (req, res) => {
        const id = req.params.Id;
        await classroomCollection.find({
            studentId: id
        }).toArray((err, doc) => {
            if(doc){
                res.send(doc);
            }else{
                res.send(err);
            }
        });
    });
    app.post('/class/', async (req, res) => {
        const classroom = req.body;
        await classroomCollection.insertOne(classroom).then(result => {
            res.send(result);
        });
    });
});

app.listen(port);