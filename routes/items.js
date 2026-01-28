const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../database/mongo');

const router = express.Router();

// GET /api/items
router.get('/', async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection('items');

    const filter = {};
    const options = {};

    if (req.query.sort) {
      options.sort = { [req.query.sort]: 1 };
    }

    if (req.query.fields) {
      options.projection = {};
      req.query.fields.split(',').forEach(f => {
        options.projection[f] = 1;
      });
    }

    const items = await collection.find(filter, options).toArray();
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/items/:id
router.get('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const db = await connectDB();
    const item = await db
      .collection('items')
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.status(200).json(item);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/items
router.post('/', async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const db = await connectDB();
    const result = await db.collection('items').insertOne(req.body);

    res.status(201).json(result);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/items/:id
router.put('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const db = await connectDB();
    const result = await db.collection('items').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.status(200).json({ message: 'Updated' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    const db = await connectDB();
    const result = await db.collection('items').deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.status(200).json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;