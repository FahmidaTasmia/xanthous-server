const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bkf4wz6.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//verifyJWT
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run(){
    try{
        const categoryCollections = client.db('xanthous').collection('Category');
        //products
        const productCollections = client.db('xanthous').collection('products');
        //bookings
        const bookingsCollection = client.db('xanthous').collection('bookings');
        //best selling
        const bestSellerCollections = client.db('xanthous').collection('bestselling');

        //verify admin middleware

        const verifyAdmin = async (req, res, next) =>{
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollections.findOne(query);

            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }
        
        //get all category
        app.get('/category', async(req,res)=>{
            const query ={};
            const cursor = categoryCollections.find(query);
            const result = await cursor.toArray();
            res.send (result)
        })

        //get all product
        app.get('/allProduct', async(req,res)=>{
            const query={};
            const cursor = productCollections.find(query);
            const result = await cursor.toArray();
            res.send(result)
        });

        //categorywise product
        app.get('/category/:id', async(req,res)=>{
            const id =req.params.id;
            const query ={categoryId:(id)}
            const result= await productCollections.find(query).toArray();
            res.send(result);
        })


        //get best seller
        app.get('/bestItem', async(req,res)=>{
            const query ={};
            const cursor = bestSellerCollections.find(query);
            const result = await cursor.toArray();
            res.send (result)
        })

        //get booking

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const bookings = await bookingsCollection.find(query).toArray();
            res.send(bookings);
        })

        //get booking by id

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })


        //post bookings
        app.post('/bookings', async(req,res)=>{
            const booking = req.body;
            console.log(booking);
            const query ={
                title:booking.title
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length){
                const message = `You already have a booking on ${booking.title}`
                return res.send({acknowledged: false, message})
            }
            const result=await bookingsCollection.insertOne(booking);
            res.send(result)
        })

        

    }
    finally{

    }
}
run().catch(console.dir);



app.get('/', async(req,res)=>{
    res.send('Xanthous server is running');
})
app.listen(port, ()=>console.log(`xanthous server is running on: ${port}`));