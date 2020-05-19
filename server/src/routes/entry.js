const express = require("express");
const multer  = require("multer");
const upload = multer();
const authenticate = require("../../middleware/authenticate.js");
const router = new express.Router();
const Entry = require("../db/models/entry.js");

// pull all entries/index thereof
router.get("/", async (req, res) => {
    try {
        // no query param provided, return full index
        if (req.query.search === "undefined") {
            const entries = await Entry.find({ deleted: false }).skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit)).sort({ createdAt: "desc" });
            res.send(entries);
        } 
        // query param provided, return cooresponding filtered index
        else if (typeof(req.query.search) !== undefined){
            const entries = await Entry.find({ deleted: false,  tags: { $in: [req.query.search] }}).sort({ createdAt: "desc" });
            res.send(entries);
        }
    } catch(err) {
        res.status(500).send(err);
    }
});


// view entry
router.get("/entry/:slug", async (req, res) => {
    try {
        const entry = await Entry.findOne({ slug: req.params.slug, deleted: false })
        if (entry === null) {
            return res.status(500).end(); 
        }
        res.send(entry);
    } catch(err) {
        res.status(500).send(err);
    }
});

// new entry
router.post("/entry/new", authenticate, upload.none(), async (req, res) => {
    const entry = new Entry({
        ...req.body,
        author: req.user._id
    });
    try {
        await entry.save();
        res.status(201).send(entry.slug);
    } catch(err) {
        res.status(400).send(err);
    }
});

// update entry
router.patch("/entry/:id", authenticate, upload.none(), async (req, res) => {
    try { 
        let entry = await Entry.findOne({ _id: req.params.id, author: req.user._id });
        if (!entry) {
            return res.status(401).send({ error: "Authentication required. This transaction has been logged."});
        }

        Object.keys(req.body).forEach(key => {
            entry[key] = req.body[key]
        });

        entry = await entry.save();

        if (entry.deleted) {
            return res.status(204).end()
        }
        res.status(201).send(entry.slug);
        } catch(err) {
            res.status(500).send(err);
        }
    });

module.exports = router