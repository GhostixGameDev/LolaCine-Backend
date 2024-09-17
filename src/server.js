//Imports
//============================================================================
import express from 'express';
import db from './database.js';
import cookieParser from 'cookie-parser'
import cors from 'cors';
import admin from 'firebase-admin';
import dotenv from "dotenv";

dotenv.config();
//Express setup
//============================================================================
const app = express();
const port = 3304;
app.use(express.json());
const allowedOrigins = ['http://localhost:5173', 'https://lolacine-3d94c.web.app/', "https://lolacine.ghostix.com.ar", "https://lolacine-3d94c.web.app", "https://lolacine-3d94c.web.app/admin"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)){
      callback(null, true);
    }else{
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser())

// Firebase setup
//=============================================================
const firebaseConfig = {
  type: "service_account",
  project_id: "lolacine-3d94c",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com"
};

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig)
});

const verifyToken = async (request, result, next) => {
  const token = request.headers.authorization?.split('Bearer ')[1];
  if (!token){
    return result.status(401).json({ error: 'No token provided' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    request.user = decodedToken;
    next();
  }catch(error){
    console.log(error);
    return result.status(401).json({ error: 'Invalid token' });
  }
};


//Routes setup for the users page functions
//============================================================================
//Enable or disable voting.
app.get("/enable-votes", (request, response) => {
  db.query("UPDATE state SET enabled = TRUE WHERE ID = 1", function(error){
    if(error) return response.status(500).json({ error: error.message});
    console.log("Votes enabled.");
    response.json({ enabled: true });
  })
})
app.get("/disable-votes", (request, response) => {
  db.query("UPDATE state SET enabled = FALSE WHERE ID = 1", function(error){
    if(error) return response.status(500).json({ error: error.message});
    console.log("Votes disabled.");
    response.json({ enabled: false });
  })
})

//Get if user voted
app.get("/user-vote-status", verifyToken, (request, response) => {
  const userId = request.user.uid;
  db.query("SELECT * FROM users WHERE UID = ?", [userId], (error, result) => {
    if (error) return response.status(500).json({ error: error.message });
    response.json({ hasVoted: result.length > 0 });
  });
});
//Get if user has admin perms
app.get("/user-is-admin", verifyToken, (request, response) => {
  const userId = request.user.uid;
  db.query("SELECT * FROM users WHERE UID = ? AND is_admin = TRUE", [userId], (error, result) => {
    if (error) return response.status(500).json({ error: error.message });
    response.json({ isAdmin: result.length > 0 });
  });
})

//Get vote amount of a given id
app.get('/votes/:id', (request, response) => {
  const { id } = request.params;
  //Makes the database retrieve the vote count from the votes table for the given id.
  db.query("SELECT votes FROM votos WHERE ID = ?", [id], (error, result) => {
    if (error) return response.status(500).json({ error: error.message });
    if (result.length > 0) {
      console.log(`Votes for ID ${id}: ${result[0].votes}`); //We log into the console the vote amount for debug porpouses.
      response.json({ votes: result[0].votes }); //If found, returns the vote count, else changes the response status and returns the corresponding error.
    } else {
      response.status(404).json({ error: "No entry found with the given ID" });
    }
  });
});

//Add a vote to a given ID
app.post('/votes/:id', verifyToken, (request, response) => {
  const { id } = request.params;
  const userId  = request.user.uid;
  console.log("Vote request received for ID:", id, "by user: ", userId);
  if (!userId) return response.status(400).json({ error: "User ID is missing" });
  //First check if voting is enabled.
  db.query("SELECT enabled FROM state WHERE ID = 1", (error, result) =>{
    if(error) return response.status(500).json({ error: error.message });
    if(result[0].enabled == 0) return response.status(403).json({ error: "La votación esta deshabilitada, solo puedes votar durante el evento." })
    // Check if user has already voted
    console.log("Votes are enabled? Yes.");
    db.query("SELECT * FROM users WHERE UID = ?", [userId], (error, result) => { 
      if (error) return response.status(500).json({ error: error.message });
      
      
      if (result.length > 0 && result[0].UID != process.env.VOTE_MASTER) {
        // User has already voted, do  not take into account if is the vote master account.
        console.log("Vote request refused. User already voted.");
        return response.status(403).json({ error: "ERROR: User tried to vote but has already voted. Is this correct?" });
        
      }
      // Now that we know user hasn't voted yet, handle the vote logic.
      db.query("SELECT * FROM votos WHERE ID = ?", [id], (error, result) => {
        if (error) return response.status(500).json({ error: error.message });
        const group = result[0].group;
        if (result.length > 0){
          const newVotes = result[0].votes + 1;
          db.query("UPDATE votos SET votes = ? WHERE ID = ?", [newVotes, id], (updateError) => {
            if (updateError) return response.status(500).json({ error: updateError.message });
            //Primary schools (Group 0) dont have security measures. : OUTDATED
            //if(group != 0){
            // Insert the user vote in users table
            db.query("INSERT INTO users (UID) VALUES (?)", [userId], (insertError) => {
              if (insertError) return response.status(500).json({ error: insertError.message });
              //Return the response.
              console.log(`Vote recorded for proposal ${id}. Updated votes to ${newVotes}. User ID: ${userId}`);
              return response.json({ message: `Vote recorded for proposal ${id}. Updated votes to ${newVotes}. User ID: ${userId}` });
            });
           /*  }else{
              //Return the response.
              console.log(`Vote recorded for proposal ${id}. Updated votes to ${newVotes}. User ID: ${userId}`)
              return response.json({ message: `Vote recorded for proposal ${id}. Updated votes to ${newVotes}. User ID: ${userId}` });
            } */
          });
        }else{
          console.log("No entries found with the given ID, sending 404 response");
          return response.status(404).json({ error: "No entries found with the given ID" });
        }  
      });
    });
  });
});

//Get all proposals
app.get('/proposals', verifyToken, (request, response) => {
  db.query("SELECT * FROM votos", (error, result) => {
    if (error) return response.status(500).json({ error: error.message });
    console.log("Website requested proposal list...")
    response.json(result);
  });
});

//Routes setup for the admins page functions
//============================================================================
//Create a new proposal
app.post('/proposals', (request, response) => {
  const { name, logo, group } = request.body;
  db.query("INSERT INTO votos (name, logo, group) VALUES (?, ?, ?)", [name, logo, group], (error, result) => {
    if (error) return response.status(500).json({ error: error.message });
    console.log('All proposals:'); //We log into the console all the current existing proposals
    console.log(result);
    response.json({ message: "Proposal created successfully", proposalId: result.insertId });
  });
});





//Server Listen
//============================================================================
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});