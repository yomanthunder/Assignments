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
    return []; // Return an empty array if there's an error
  }
}

async function insertData(db, tableName, data) {
  if (!Array.isArray(data)) {
    console.error("Data is not an array");
    return;
  }

  // Check if the first item has a 'name' property
  if (!data[0].hasOwnProperty("name")) {
    console.error("Data items do not have a 'name' property");
    return;
  }

  let placeholders = data.map((_, index) => `$${index + 1}`).join(",");
  let sql = `INSERT INTO ${tableName} VALUES (${placeholders})`;

  db.run(sql, ...data.map((field) => field.name), function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Rows inserted ${this.changes}`);
  });
}

async function main() {
  const db = new sqlite3.Database(":memory:");

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
      console.log(`Created table ${entity.name}`);
    });
  }

  // Select the first three entities
  const selectedEntities = entities.slice(0, 3);

  for (const entity of selectedEntities) {
    const data = await fetchData(entity.name);
    if (data && data.length > 0) {
      // Only insert data if it's not empty
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
