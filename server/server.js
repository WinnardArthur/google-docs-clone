const express = require('express');
const mongoose = require('mongoose');
const Document = require('./document');
const port = process.env.PORT || 5000;
const app = express();
const path = require('path');


mongoose.connect('mongodb+srv://JadenXmith:Gibbwizze,.7@cluster0.hr3srcd.mongodb.net/?retryWrites=true&w=majority')
    .then(() => console.log('connected'))
    .catch((err) => console.log(err))


console.log(path.join(__dirname, '../'))

if(process.env.NODE_ENV === 'production') {
    const __dirname = path.resolve();

    app.use(express.static(path.join(__dirname, "../client/build")))

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/build/index.html"))
    })
} else {
    app.get("/", (req, res) => {
        res.send("Google Docs Clone API running successfully")
    })
}


const server = app.listen(port)

const io = require('socket.io')(server, {
    cors: {
        origin: 'https://google-docs-clone-4rex.onrender.com/',
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