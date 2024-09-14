//Imports
import mysql from "mysql";
import dotenv from "dotenv";

dotenv.config();
//Create connection.
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
  });
  
  db.connect(function(error) {
    if(error) throw error;
    console.log("Connected!");
    // Create the database if not exists.
    db.query("CREATE DATABASE IF NOT EXISTS lolacine", function (error) {
      if (error) throw error;
      console.log("Database created or exists already");
  
      // Select the database
      db.changeUser({ database: "lolacine" }, function (error) {
        if (error) throw error;
        console.log("Switched to lolacine database");
  
        // Create tables if not exist
        const setupQueries = [
          `CREATE TABLE IF NOT EXISTS \`votos\` (
            ID tinyint AUTO_INCREMENT PRIMARY KEY,
            name tinytext NOT NULL DEFAULT 'Propuesta',
            logo tinytext NOT NULL DEFAULT './assets/propuestas/',
            votes smallint UNSIGNED NOT NULL DEFAULT 0,
            \`group\` smallint UNSIGNED NOT NULL DEFAULT 0
          )`,
          `CREATE TABLE IF NOT EXISTS \`users\` (
            ID tinyint AUTO_INCREMENT PRIMARY KEY,
            UID text NOT NULL DEFAULT '',
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
    });
 });
//Exports
export default db;


