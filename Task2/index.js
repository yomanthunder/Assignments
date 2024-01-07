import Database from "./database.js";
import GraphQLAPI from "./GraphQLAPI.js";
import TableManager from "./TableManager.js";

async function main() {
  const db = new Database("database.db");
  const graphqlAPI = new GraphQLAPI();
  const tableManager = new TableManager(db);

  const schema = await graphqlAPI.fetchSchema();
  const entities =
    schema.types.filter(/*... your entity filter condition ... */);

  for (const entity of entities) {
    const fields = entity.fields
      .map((field) => `${field.name} TEXT`)
      .join(", ");
    await tableManager.createTable(entity.name, fields);
  }

  const selectedEntities = entities.slice(0, 1);

  for (const entity of selectedEntities) {
    const data = await graphqlAPI.fetchData(entity.name);
    console.log(`Data to be inserted into ${entity.name}:`, data);

    if (data && data.length > 0) {
      await tableManager.insertData(entity.name, data);
    } else {
      console.error(`No data found for entity ${entity.name}`);
    }
  }

  await db.close();
  console.log("Closed the database connection.");
}

main();
