const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const storeAuth = require('../middleware/store.auth');
const userAuth = require('../middleware/user.auth');
const { type } = require('os');
const { profile } = require('console');
const secretkey = '1234';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "../uploads"); // تأكد من أن المسار صحيح وأن المجلد موجود
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniquename = `${Date.now()}-${Math.round(Math.random() * 1E9)}`; // استخدم Math.random() لتوليد رقم عشوائي
    const ext = path.extname(file.originalname);
    cb(null, `${uniquename}${ext}`); // استخدم القوالب النصية لدمج الاسم الفريد والامتداد
  }
});

const upload = multer({ storage: storage });


const storeSchema = new mongoose.Schema({
    profileImage: {
      type: String,
      required: true
    },
    name: String,
    address: {
      areaName: {
        type: String,
        required: true
      },
      streetName: {
        type: String,
        required: true
      },
      buildingNameorNumber: {
        type: String,
        required: true
      },
      floor: {
        type: String,
        required: false
      }
    },
    longitude: Number,
    latitude: Number,
    phoneNumbers: {
      type: [Number],
      required: true
    },
    landlines: {
      type: [Number],
      required: false
    },
    whatsappNumber: {
      type: Number,
      required: true
    },
    category: String,
    email: String,
    facebookPage: {
      type: String,
      required: false
    },
    facebookUsername: {
      type: String,
      required: false
    },
    instagramAccount: {
      type: String,
      required: false
    },
    instagramUsername: {
      type: String,
      required: false
    },
    WbsiteUrl: {
      type: String,
      required: false
    },
    WebsiteTitle: {
      type: String,
      required: false
    },
    password: String
  });

const Store = mongoose.model('Store', storeSchema);

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  storeId: String
});
const Product = mongoose.model('Product', productSchema);


  // signup store
router.post('/signup/store',upload.single('profileImage'), async (req, res) => {
    try {
      const {
        name, latitude, longitude, phoneNumbers, landlines, areaName, streetName, buildingNameorNumber, floor, email, whatsappNumber, instagramAccount, instagramUsername, facebookPage, facebookUsername, WbsiteUrl, WebsiteTitle, category, password,
      } = req.body;
  
      if (!password || !phoneNumbers || !email || !areaName  || !streetName  ||  !buildingNameorNumber || !whatsappNumber ) {
        return res.status(400).send({ error: 'الهاتف والبريد الإلكتروني وكلمة المرور مطلوبة' });
      }
  
      const existingStore = await Store.findOne({ $or: [{ email }, { phoneNumbers }, {areaName}, {streetName}, {buildingNameorNumber}, {whatsappNumber}] });
      if (existingStore) {
        return res.status(400).send({ error: 'البريد الإلكتروني أو الهاتف موجود بالفعل' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const address ={
        areaName,
        streetName,
        buildingNameorNumber,
        floor
      };

      if (!req.file) {
        return res.status(400).send({error:'الصورة مطلوبة'});
      }


      const store = new Store({
        profileImage:req.file.path, name, latitude, longitude, phoneNumbers, landlines, address, email, whatsappNumber, instagramAccount, instagramUsername, facebookPage, facebookUsername, WbsiteUrl, WebsiteTitle, category, password: hashedPassword,
      });
  
      await store.save();
      res.send('تم التسجيل بنجاح');
    } catch (error) {
      console.error('Error occurred during store signup:', error);
      res.status(500).send({ error: 'حدث خطأ أثناء إنشاء الحساب' });
    }
  });
  
  // login store
router.post('/login/store', async (req, res) => {
    const { email, password } = req.body;
    const store = await Store.findOne({ email });
  
    if (!store) {
      return res.status(401).send('فشل تسجيل الدخول');
    }
  
    const isValidPassword = await bcrypt.compare(password, store.password);
    if (!isValidPassword) {
      return res.status(401).send('فشل تسجيل الدخول');
    }
  
    const token = jwt.sign({ email: store.email }, secretkey);
    res.status(200).json({token , id: store._id});
  });

  // show all stores
router.get('/stores', async (req,res)=>{
  try{
      const stores=await Store.find({}).select('-password');
      res.status(200).json({'data':stores});
  }catch (error){
      res.status(500).json({message:error.message})
  }
});

// Add Store
router.post('/store', async (req, res) => {
  const newStore = new Store(req.body);
  try {
      await newStore.save();
      res.status(201).send(newStore);
  } catch (err) {
      res.status(400).send(err);
  }
});

// Update Store
router.put('/stores/:storeId',storeAuth, async (req, res) => {
  try {
      const store = await Store.findByIdAndUpdate(req.params.storeId, req.body, { new: true });
      if (!store) {
          return res.status(404).send();
      }
      res.send(store);
  } catch (err) {
      res.status(400).send(err);
  }
});

// Get Store by ID
router.get('/store/:id', async (req, res) => {
  try {
      const store = await Store.findById(req.params.id);
      if (!store) {
          return res.status(404).send();
      }
      res.send(store);
  } catch (err) {
      res.status(500).send(err);
  }
});

// Delete Store
router.delete('/store/:id', async (req, res) => {
  try {
      const store = await Store.findByIdAndDelete(req.params.id);
      if (!store) {
          return res.status(404).send();
      }
      res.send(store);
  } catch (err) {
      res.status(500).send(err);
  }
});

//filter
router.get('/stores/filter', async (req, res) => {
  try {
      let filters = {};

      // تحديد المعايير للفلترة
      if (req.query.areaName) {
          filters[address.areaName] = req.query.areaName;
      }

      if (req.query.category) {
          filters.category = req.query.category.split(',');
      }

      // تنفيذ الفلترة
      const stores = await Store.find(filters);
      res.json(stores);
  } catch (error) {
      res.status(500).json({ message: 'Failed to filter stores' });
  }
});

// search 
router.get('/stores/search', async (req, res) => {
  const { name } = req.query;
  try {
      const stores = await Store.find({ name: { $regex: name, $options: 'i' } });
      res.status(200).json({ message: 'تم العثور على المتجر', stores });
  } catch (error) {
      console.error('حدث خطا في عملية البحث', error);
      res.status(500).json({ message: 'حدث خطا في عملية البحث' });
  }
});


  // profile
router.get('/store-info/:storeId', async (req, res) => {
    try {
      const storeInfo = await Store.findById(req.params.storeId);
      res.json(storeInfo);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  //update profile
router.put('/store-info/:storeId',storeAuth , async (req, res) => {
    try {
      const storeInfo = await Store.findById(req.params.storeId);
      if (!storeInfo) {
        return res.status(404).json({ message: 'المتجر غير موجود' });
      }
      storeInfo.name = req.body.name || storeInfo.name;
      storeInfo.address.areaName = req.body.areaName || storeInfo.address.areaName;
      storeInfo.address.streetName = req.body.streetName || storeInfo.address.streetName;
      storeInfo.address.buildingNameorNumber = req.body.buildingNameorNumber || storeInfo.address.buildingNameorNumber;
      storeInfo.address.floor = req.body.floor || storeInfo.address.floor;
      storeInfo.whatsappNumber = req.body.whatsappNumber || storeInfo.whatsappNumber;
      await storeInfo.save();
      res.json(storeInfo);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


  // Add Product
router.post('/store/:storeId/products',storeAuth, async (req, res) => {
    const storeId = req.params.storeId;
    const { name, price } = req.body;

    try {
        const newProduct = new Product({
            name,
            price,
            storeId
        });

        await newProduct.save();
        res.json({ message: 'تمت إضافة المنتج بنجاح' });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Get prouduct by ID
router.get('/products/:id', async (req, res) => {
  try {
      const product = await Product.findById(req.params.id);
      if (!product) {
          return res.status(404).send();
      }
      res.send(product);
  } catch (err) {
      res.status(500).send(err);
  }
});

// Delete Product
router.delete('/products/:id',storeAuth, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.send('Product deleted successfully');
});

// Update Product
router.put('/products/:id',storeAuth, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, {
      name: req.body.name,
      price: req.body.price
  }, { new: true });
  res.send(product);
});

// Get All Products
router.get('/products', async (req, res) => {
  const products = await Product.find();
  res.send(products);
});


router.get('/store/:storeId/products', async (req, res) => {
  const storeId = req.params.storeId;
  try {
      const products = await Product.find({ storeId: storeId });
      res.json(products);
  } catch (err) {
      res.status(500).send(err);
  }
});

// حماية الوصول باستخدام التوكن
router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'Protected route' });
});

// Middleware للتحقق من صحة التوكن
function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, '1234', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = decoded;

      
        User.findOne({ randomCode: req.user.randomCode }, (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Internal Server Error' });
            }

            if (!user || user.expirationDate < new Date()) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            next();
        });
    });
}


  
  module.exports.Store = Store;
  module.exports.storeRouter = router;
