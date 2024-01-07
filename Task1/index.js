import sqlite3 from "sqlite3";
import fetchSchema from "./api/graphql.js";
import axios from "axios";
import { constants } from "./utils/constants.js";

async function fetchData(entityName) {
  try {
    // it's more efficient to allow other operations to proceed while waiting for the response.
    const response = await axios.post(
      //url of the api
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

  if (!data[0].hasOwnProperty("name")) {
    console.error("Data items do not have a 'name' property");
    return;
  }

  const extractedData = data.map((field) => ({
    name: field.name,
  }));

  let placeholders = extractedData.map((_, index) => `$${index + 1}`).join(",");
  let columns = Object.keys(extractedData[0]).join(",");
  let sql = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

  const values = extractedData.map((field) => field.name); // Use extractedData for values

  db.run(sql, values, function (err) {
    if (err) {
      return console.error(err.message);
    }
    console.log(`Rows inserted ${this.changes} into ${tableName}`);
  });
}

async function main() {
  // in-memory database
  const db = new sqlite3.Database("database.db");

  const schema = await fetchSchema();
  // aldready provide in the assignment
  const entities = schema.types.filter(
    (entity) =>
      entity.fields !== null &&
      entity.fields !== "" &&
      entity.fields !== undefined &&
      entity.fields.length > 0 &&
      !entity.name.startsWith("_")
  );
  // before i was using forEach but forEach doesn't wait for asynchronous operations to complete,
  //potentially causing issues with the order of execution.
  // used some help from stackover flow
  // entity represents the current item
  for (const entity of entities) {
    //necessary for defining the columns of the table.
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

  // Select the first three entities
  const selectedEntities = entities.slice(0, 1);

  for (const entity of selectedEntities) {
    const data = await fetchData(entity.name);
    console.log("Data to be inserted:", data);
    if (data && data.length > 0) {
      // Only insert data if it's not empty
      await insertData(db, entity.name, data);
    } else {
      console.error(`No data found for entity ${entity.name}`);
    }
  }
  // a bit of help from stackover flow , for closing the database connection (best practice)
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
