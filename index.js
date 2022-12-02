const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express()

const cors = require('cors');
const port = 5000

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3y3ilq1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true, useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});


// ===================jwt auth middleware===========================
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

// ===================verify admin middleware===========================
// NOTE: make sure you use verifyAdmin after verifyJWT
const verifyAdmin = async (req, res, next) => {
    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail };
    const user = await usersCollection.findOne(query);

    if (user?.role !== 'admin') {
        return res.status(403).send({ message: 'forbidden access' })
    }
    next();
}

async function run() {
    try {
        const usersCollection = client.db('sristiMart').collection('users');
        const categoryCollection = client.db('sristiMart').collection('categories');
        const productCollection = client.db('sristiMart').collection('products');

        // ===================jwt createtor routes===========================
        app.post('/jwt-creator', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send({ token })
        })

        // ===================categories routes===========================
        app.get('/categories', async (req, res) => {
            const cursor = await categoryCollection.find({})
            const categories = await cursor.toArray();
            res.send(categories);
        });

        app.post('/categories', verifyJWT, async (req, res) => {
            // app.post('/categories', async (req, res) => {
            // const categoryData = req.body;
            // const categoryData = {
            //     name: 'Suzuki'
            // };

            const category = await categoryCollection.insertOne(categoryData)
            res.send(category);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const category = await categoryCollection.findOne(query);
            res.send(category);
        })

        // ===================products routes===========================
        app.post('/products', async (req, res) => {
            const productData = {
                ...req.body,
                "date": new Date(Date.now())
            };
            const product = await productCollection.insertOne(productData)
            res.send(product);
        });

        app.get('/products/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category: id };
            const productCursor = await productCollection.find(query);
            const products = await productCursor.toArray();
            res.send(products);
        })

        app.get('/products/seller/:id', async (req, res) => {
            const id = req.params.id;
            const query = { seller: id };
            const productCursor = await productCollection.find(query);
            const products = await productCursor.toArray();
            res.send(products);
        })


        // ===================user routes===========================
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const userInput = {
                ...user,
                isVerified: false
            };
            console.log(userInput);
            const result = await usersCollection.insertOne(userInput);
            res.send(result);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })

        app.get('/users/one/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const userCursor = await usersCollection.findOne(query);
            // const user = await userCursor.toArray();
            res.send(userCursor);
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })



    } finally {

    }
}
run().catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send('sristi mart node mongo crud server');
});

app.listen(port, () => {
    console.log(`sristi-mart-server running on port ${port}`)
})