//Imports
import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

//Create connection.
const db = mysql.createConnection(process.env.SQL_URL);
db.connect(function(error) {
  if(error) throw error;
  console.log("Connected!");
  // Create tables if not exist
  const setupQueries = [
    `CREATE TABLE IF NOT EXISTS \`votos\` (
      ID tinyint AUTO_INCREMENT PRIMARY KEY,
      school tinytext NOT NULL,
      name text NOT NULL,
      logo tinytext NOT NULL,
      votes smallint UNSIGNED NOT NULL DEFAULT 0,
      \`group\` smallint UNSIGNED NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS \`users2\` (
      ID int AUTO_INCREMENT PRIMARY KEY,
      UID text NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT FALSE
    )`,
    `CREATE TABLE IF NOT EXISTS \`state\` (
      ID tinyint AUTO_INCREMENT PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT FALSE
    )`
  ];

  // Execute each setup query
  setupQueries.forEach(function (query) {
    db.query(query, function (error) {
      if (error) throw error;
      console.log("Table or data setup successfully");
    });
  });


  //courtesy of chatGPT
    // Step 1: Copy data from users to users2
    db.query("INSERT INTO users2 (ID, UID, is_admin) SELECT ID, UID, is_admin FROM users", function(error) {
      if (error) throw error;
      console.log("Data copied from users to users2");
  
      // Step 2: Drop the users table
      db.query("DROP TABLE users", function(error) {
        if (error) throw error;
        console.log("Users table dropped");
  
        // Step 3: Recreate the users table with the new structure
        const createUsersQuery = `
          CREATE TABLE users (
            ID int AUTO_INCREMENT PRIMARY KEY,
            UID text NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT FALSE
          )`;
        db.query(createUsersQuery, function(error) {
          if (error) throw error;
          console.log("Users table recreated with new structure");
  
          // Step 4: Copy data back from users2 to users
          db.query("INSERT INTO users (ID, UID, is_admin) SELECT ID, UID, is_admin FROM users2", function(error) {
            if (error) throw error;
            console.log("Data copied back from users2 to users");
  
            // Step 5: Drop users2 table
            db.query("DROP TABLE users2", function(error) {
              if (error) throw error;
              console.log("Users2 table dropped");
            });
          });
        });
      });
    });
  //Make myself admin. (Rudimentary, but there is no time.)
  db.query("SELECT * FROM users WHERE UID = ?", [process.env.ADMIN_UID], (error, result) => {
    if(error) throw error;
    if(result.length == 0){
      db.query("INSERT INTO users (ID, UID, is_admin) VALUES (0, ?, TRUE)", [process.env.ADMIN_UID], function(error){
        if(error) throw error;
        console.log("Admin registered correctly")
      })
    }
  });
  //Initialize state if not initialized
  db.query("SELECT * FROM state WHERE ID = 1", (error, result) => {
    if(error) throw error;
    if(result.length == 0){
      db.query("INSERT INTO state (ID, enabled) VALUES (1, FALSE)", function(error){
        if(error) throw error;
        console.log("State initialized as False")
      });
    }else{
      console.log("Votes are: " + result[0].enabled);
    }
  });
});
//Exports
export default db;


