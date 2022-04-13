const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
const bodyParser = require('body-parser');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const res = require('express/lib/response');
const { initializeApp } = require('firebase-admin/app');
require('dotenv').config();

const app = express();
app.use(bodyParser.json())
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(cors());
const port = process.env.PORT || 5000;


const admin = require("firebase-admin");

const serviceAccount = require("./configs/alam-egg-villa-firebase-adminsdk-mp4gw-c6dbc3fb8e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


app.get('/', (req, res) => {
  res.send('Hello from server!')
})

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.bwohy.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  console.log('DB connected');
  const productsCollection = client.db("alamEggVillaDb").collection("products");
  const shipmentCollection = client.db("alamEggVillaDb").collection("shipment");
  const ordersCollection = client.db("alamEggVillaDb").collection("orders");
  const commentsCollection = client.db("alamEggVillaDb").collection("comments");
  const adminUsersCollection = client.db("alamEggVillaDb").collection("adminUsers");

  app.post('/addProduct', (req, res) => {
    const product = req.body;
    productsCollection.insertOne(product)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })

  app.get('/products', (req, res) => {
    productsCollection.find()
    .toArray((err,documents) => {
      res.send(documents);
    })
  })

  app.get('/productsPaginate', (req, res) => {
    productsCollection.find()
    .toArray((err,documents) => {
      res.send(documents);
    })
  })

  app.get('/searchProducts', (req, res) => {
    const searchValue = req.query.search
    productsCollection.find({productName: {$regex : searchValue }})
    .toArray((err,documents) => {
      res.send(documents);
    })
  })

 
  app.get('/products/:id', (req, res) => {
    productsCollection.find({_id:ObjectId(req.params.id)})
    .toArray((err,documents) => {
      if(!err){
        res.send(documents[0]);
      }
      
    })
  })

  app.patch('/updateProduct/:id', (req, res) => {
    
    productsCollection.updateOne({_id:ObjectId(req.params.id)},
    
    {
      $set: {productName: req.body.productName, description:req.body.description, amount: req.body.amount, keyPrice: req.body.keyPrice, discount: req.body.discount, price: req.body.price, image: req.body.image}
    } )
    .then( result => {
      res.send(result.modifiedCount>0)
    })
  })

  app.delete('/delete/:id', (req, res) => {
    productsCollection.deleteOne({_id:ObjectId(req.params.id)})
    .then(result => {
      res.send(result.deletedCount>0)
    })
    
  })

  
  app.post('/addShipment', (req, res) => {
    const shipment = req.body;
    shipmentCollection.insertOne(shipment)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })

  // app.get('/shipment', (req, res) => {
  //   shipmentCollection.find({email:req.query.email})
  //   .toArray((err,documents) => {
  //     res.send(documents[0]);
  //   })
  // })

  app.get('/shipment', (req, res) => {
    
    const bearer = req.headers.authorization;

    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      const tokenEmail = decodedToken.email;
      const queryEmail = req.query.email;
      if(tokenEmail === queryEmail) {
        shipmentCollection.find({email:queryEmail})
        .toArray((err,documents) => {
          res.status(200).send(documents[0]);
        })

      }else{
        res.status(401).send("unauthorized access")
      }
      
    })
    .catch((error) => {
      res.status(401).send("unauthorized access")
    });
   
    }else{
      res.status(401).send("unauthorized access")
    }
    
    
  })


  app.get('/allShipment', (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
        shipmentCollection.find()
        .toArray((err,documents) => {
          res.status(200).send(documents);
        })
    })
    .catch((error) => {
      res.status(401).send("unauthorized access")
    });
  
    }else{
      res.status(401).send("unauthorized access")
    }
  })

  app.patch('/updateShipment/:id', (req, res) => {
    shipmentCollection.updateOne({_id:ObjectId(req.params.id)},
    
    {
      $set: {address: req.body.address, phone:req.body.phone}
    } )
    .then( result => {
      res.send(result.modifiedCount>0)
    })
  })

  app.post('/addOrders', (req, res) => {
    const orders = req.body;
    ordersCollection.insertOne(orders)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })

  
  app.get('/orders', (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      ordersCollection.find()
        .toArray((err,documents) => {
          res.status(200).send(documents);
        })
    })
    .catch((error) => {
      res.status(401).send("unauthorized access")
    });
  
    }else{
      res.status(401).send("unauthorized access")
    }
  })

  app.get('/orders/:id', (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      ordersCollection.find({_id:ObjectId(req.params.id)})
        .toArray((err,documents) => {
    
          res.status(200).send(documents[0]);
          
        })
    })
    .catch((error) => {
      res.status(401).send("unauthorized access")
    });
  
    }else{
      res.status(401).send("unauthorized access")
    }
  })



  app.patch('/updateOrderStatus', (req, res) => {
    const { id, status } = req.body;
    ordersCollection.findOneAndUpdate(
      { _id: ObjectId(id) },
      {
          $set: { status },
      }
  )
    .then( result => {
      res.send(result.modifiedCount>0)
    })
  })

  app.get('/ordersByUser', (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const uid = decodedToken.uid;
      const tokenEmail = decodedToken.email;
      const queryEmail = req.query.email;
      if(tokenEmail === queryEmail) {
         ordersCollection.find({email:queryEmail})
        .toArray((err,documents) => {
          res.status(200).send(documents);
        })

      }else{
        res.status(401).send("unauthorized access")
      }
      
    })
    .catch((error) => {
      res.status(401).send("unauthorized access")
    });
   
    }else{
      res.status(401).send("unauthorized access")
    }  
  })

  app.delete('/deleteOrder/:id', (req, res) => {
    ordersCollection.deleteOne({_id:ObjectId(req.params.id)})
    .then(result => {
      res.send(result.deletedCount>0)
    })
    
  })

  app.post('/addComments', (req, res) => {
    const comments = req.body;
    commentsCollection.insertOne(comments)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })


  app.get('/allComments/:id', (req, res) => {
      commentsCollection.find({productId:req.params.id})
      .toArray((err,documents) => {
          res.send(documents);
      })
  })

  app.get('/allComments', (req, res) => {
    commentsCollection.find()
    .toArray((err,documents) => {
        res.send(documents);
    })
})

app.delete('/deleteComment/:id', (req, res) => {
  commentsCollection.deleteOne({_id:ObjectId(req.params.id)})
  .then(result => {
    res.send(result.deletedCount>0)
  })
  
})

  app.post('/addAdminUser', (req, res) => {
    const adminUser = req.body;
    adminUsersCollection.insertOne(adminUser)
    .then(result => {
      res.send(result.insertedCount > 0)
    })
  })

  app.get('/adminUsers', (req, res) => {
    adminUsersCollection.find()
    .toArray((err,documents) => {
      res.send(documents);
    })
  })


  app.delete('/deleteAdminUser/:id',  (req, res) => {
     adminUsersCollection.deleteOne({_id:ObjectId(req.params.id)})
    .then(result => {
      res.send(result.deletedCount>0)
    })
    
  })

});




app.listen(port)