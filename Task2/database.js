import sqlite3 from "sqlite3";

class Database {
  constructor(databaseName) {
    this.db = new sqlite3.Database(databaseName);
  }

  runQuery(sql, values) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, values, function (error) {
        if (error) {
          reject(error);
        } else {
          resolve({ changes: this.changes, lastID: this.lastID });
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

export default Database;
