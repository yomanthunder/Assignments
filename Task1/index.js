import sqlite3 from "sqlite3";
import fetchSchema from "./api/graphql.js";
import axios from "axios";
import { constants } from "./utils/constants.js";

async function fetchData(entityName) {
  try {
    const response = await axios.post(
      constants.GRAPHQL_ENDPOINT,
      {
        query: constants.INTROSPECTION_QUERY,
      },
      {
        headers: {
          "mb-api-key": constants.MB_API_KEY,
        },
      }
    );

    const typeInfo = response.data.data.__schema.types.find(
      (type) => type.name === entityName
    );

    return typeInfo && typeInfo.fields ? typeInfo.fields : [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function insertData(db, tableName, data) {
  if (!Array.isArray(data)) {
    console.error("Data is not an array");
    return;
  }

  if (!data[0].hasOwnProperty("name")) {
    console.error("Data items do not have a 'name' property");
    return;
  }

  const extractedData = data.map((field) => ({
    name: field.name,
  }));

  // Get the column names from the table dynamically
  const columnNames = await new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
      if (err) {
        reject(err);
      } else {
        resolve(columns.map((column) => column.name));
      }
    });
  });

  // Filter out the columns that are not present in the extractedData object
  const filteredExtractedData = extractedData.filter((field) =>
    columnNames.includes(field.name)
  );

  let placeholders = filteredExtractedData
    .map((_, index) => `$${index + 1}`)
    .join(",");
  let columns = Object.keys(filteredExtractedData[0]).join(",");
  let sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

  const values = filteredExtractedData.map((field) => field.name);

  db.run(sql, values, function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Rows inserted ${this.changes} into ${tableName}`);
  });
}

async function main() {
  const db = new sqlite3.Database("database.db");

  const schema = await fetchSchema();
  const entities = schema.types.filter(
    (entity) =>
      entity.fields !== null &&
      entity.fields !== "" &&
      entity.fields !== undefined &&
      entity.fields.length > 0 &&
      !entity.name.startsWith("_")
  );

  for (const entity of entities) {
    const fields = entity.fields
      .map((field) => `${field.name} text`)
      .join(", ");
    const sql = `CREATE TABLE ${entity.name} (${fields})`;

    db.run(sql, (error) => {
      if (error) {
        return console.error(error.message);
      }
      console.log(`Created table ${entity.name} ${fields}`);
    });
  }

  const selectedEntities = entities.slice(0, 3);

  for (const entity of selectedEntities) {
    const data = await fetchData(entity.name);
    // console.log("Data to be inserted:", data);
    if (data && data.length > 0) {
      await insertData(db, entity.name, data);
    } else {
      console.error(`No data found for entity ${entity.name}`);
    }
  }

  await new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  console.log("Closed the database connection.");
}

main();
