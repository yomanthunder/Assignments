class TableManager {
  constructor(db) {
    this.db = db;
  }

  async createTable(tableName, fields) {
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${fields})`;
    return this.db.runQuery(sql, []);
  }

  async insertData(tableName, data) {
    if (!Array.isArray(data) || !data[0]) {
      console.error(`Data for table ${tableName} is invalid`);
      return;
    }

    const columns = Object.keys(data[0]).map((columnName) => columnName);
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(",");
    const values = data.map((item) => Object.values(item));

    const sql = `INSERT INTO ${tableName} (${columns.join(
      ","
    )}) VALUES (${placeholders})`;

    return this.db.runQuery(sql, values.flat());
  }
}

export default TableManager;
