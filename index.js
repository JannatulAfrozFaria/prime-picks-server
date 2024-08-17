const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sirqfba.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const medicineCollection = client.db("primePricksDB").collection("medicineSet");
    
    // app.get('/medicines', async(req,res)=>{
    //   const result = await medicineCollection.find().toArray();
    //   res.send(result);
    // })
    
    const itemsPerPage = 9;
    app.get('/medicines', async (req, res) => {
      const page = req.query.page || 1;
      const searchedItem = req.query.search || '';
      const brandFilter = req.query.brand || '';
      const categoryFilter = req.query.category || '';
      const priceMinimum = parseFloat(req.query.priceMin);
      const priceMaximum = parseFloat(req.query.priceMax);
      const sortByPrice = req.query.order === 'asc' ? 1 : req.query.order === 'dsc' ? -1 : 1
      const query = {}
      if(brandFilter){
        query.brandName = decodeURIComponent(brandFilter)
      }
      if(categoryFilter){
        query.categoryName = decodeURIComponent(categoryFilter)
      }
      if(priceMinimum && priceMaximum){
        query.price = {$gte: priceMinimum, $lte: priceMaximum}
      }
      const count = await medicineCollection.estimatedDocumentCount(query)
      const items = await medicineCollection.find(query, {$text: { $search: searchedItem }}).sort({"price": sortByPrice}).skip(9 * (page - 1)).limit(9).toArray();
      const pageCount = Math.ceil(count / itemsPerPage); //40 items/9 =4
      console.log(brandFilter);
      // console.log(page, count, items);
      res.send(JSON.stringify({
        pagination: {
          count,
          pageCount,
        },
        items
      })
      )
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('prime picks is running')
})

app.listen(port, ()=>{
    console.log(`Prime Picks is running on port ${port}`);
})