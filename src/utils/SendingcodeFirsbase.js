// src/utils/FirestoreChat.js
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ErrorHandler } from './ErrorHandler';

export async function saveMessageToFirestore ({ userId, threadId, role, text = "", html = "", timestamp = Date.now() }) {
  if (!userId || !threadId || !role) return;
    
  const messagesRef = collection(db, "users", userId, "threads", threadId, "messages");
  try{
    await addDoc(messagesRef, {
    role,
    text,
    html,
    timestamp
  });
  }catch(err){
    console.error("Error saving message to Firestore:", err);
    ErrorHandler("Missing chat metadata");
  }
  
}
