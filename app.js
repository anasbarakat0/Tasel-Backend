const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secretkey = '1234';

const app = express();

mongoose.connect('mongodb+srv://ghaithbirkdar:c4a@cluster0.jb1c741.mongodb.net/dalelcom?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("mongodb connect success.");
        app.listen(3003)
    })
    .catch(err => {
        console.log(err)
    });

const UserSchema = new mongoose.Schema({
    name: String,
    phone: String,
    email: String,
    Latitude: Number,
    Longitude: Number,
    password: String
});
const User = mongoose.model('User', UserSchema);

// signup user
app.post('/register', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      const user = new User({
        name: req.body.name,
        phone: req.body.phone,
        email: req.body.email,
        Latitude: req.body.Latitude,
        Longitude: req.body.Longitude,
        password: hashedPassword
      });
      await user.save();
      res.status(200).send({ message : 'تم انشاء الحساب بنجاح'});
    } catch {
      res.status(500).send();
    }
  });
  //login user
  app.post('/login', async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone });
    if (user == null) {
      return res.status(400).send('Cannot find user');
    }
    try {
      if (await bcrypt.compare(req.body.password, user.password)) {
      const token = jwt.sign({phone : user.phone}, secretkey);
        res.status(200).json(token);
      } else {
        res.send('Not Allowed');
      }
    } catch {
      res.status(500).send();
    }
  });
  


app.listen(3000, () => console.log('Server started'));