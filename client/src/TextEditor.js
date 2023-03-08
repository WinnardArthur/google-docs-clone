import React, { useEffect, useCallback, useState } from 'react';
import Quill from 'quill'; 
import "quill/dist/quill.snow.css";
import './styles.css';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const SAVE_INTERVAL_MS = 2000;  

const TOOLBAR_OPTIONS = [
    [{header: [1, 2, 3, 4, 5, 6, false]}],
    [{ font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{color: []}, { background: []}],
    [{script: "sub"}, { script: "super"}],
    [{align: []}],
    ["image", "blockquote", "code-block"],
    ["clean"]
]
 
const TextEditor = () => {
    const [socket, setSocket] = useState();
    const [quill, setQuill] = useState();

    const { id: documentId } = useParams();

    // Connect to server
    useEffect(() => {
        const s = io("https://vercel.com/jadenxmith-gmailcom/google-clone-docs/");
        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [])

    // Get and load document
    useEffect(() => {
        if (socket == null || quill == null) return;

        socket.once('load-document', document => {
            quill.setContents(document);
            quill.enable(); 
        })

        socket.emit('get-document', documentId);
    }, [socket, quill, documentId])

    // Send changes to server
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = (delta, oldDelta, source) => {
            if (source !== 'user') return;
            socket.emit('send-changes', delta)
        }

        quill.on('text-change', handler)

        return () => {
            quill.off('text-change', handler)
        }
    }, [socket, quill])

    // Receive and update changes
    useEffect(() => {
        if (socket == null || quill == null) return;

        const handler = delta => {
            quill.updateContents(delta)
        }

        socket.on("receive-changes", handler);

        return () => {
            socket.off("receive-changes", handler)
        }
    }, [socket, quill])
    
    // Save changes made
    useEffect(() => {
        if (socket == null || quill == null) return;

        const interval = setInterval(() => {
            socket.emit('save-document', quill.getContents())
        }, SAVE_INTERVAL_MS)

        return () => {
            clearInterval(interval)
        }
    }, [socket, quill])

    // Initialize quill editor properly
    const wrapperRef = useCallback((wrapper) => {
        if(wrapper == null) return 
        wrapper.innerHTML = "";

        const editor = document.createElement('div')
        wrapper.append(editor)
        
        const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS} })
        q.disable();
        q.setText('Loading...')
        setQuill(q);
    }, [])

  return (
    <div className='container' ref={wrapperRef}>
        
    </div>
  )
}

export default TextEditor