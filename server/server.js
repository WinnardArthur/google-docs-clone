const express = require('express');
const mongoose = require('mongoose');
const Document = require('./document');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();


mongoose.connect('mongodb+srv://JadenXmith:Gibbwizze,.7@cluster0.hr3srcd.mongodb.net/?retryWrites=true&w=majority')
    .then(() => console.log('connected'))
    .catch((err) => console.log(err))


app.get("/", (req, res) => {
    res.send("Google Docs Clone API running successfully")
})

const server = app.listen(port)

const io = require('socket.io')(server, {
    cors: {
        origin: 'https://google-clone-docs.vercel.app/',
        method: ['GET', 'POST']
    },
})

io.on('connection', socket => {
    socket.on('get-document', async documentId => {
        const document = await findOrCreateDocument(documentId);
        socket.join(documentId)
        socket.emit('load-document', document.data) 
        
        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta)
        })

        socket.on('save-document', async data => {
            await Document.findByIdAndUpdate(documentId, { data })
        })
    })

})

const defaultValue = "";

async function findOrCreateDocument(id) {
    if (id == null) return;

    const document = await Document.findById(id);
    if (document) return document;

    return await Document.create({_id: id, data: defaultValue })
}

module.exports = app;