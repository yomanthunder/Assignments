const sqlite3 = require("sqlite3").verbose();
const { fetchSchema } = require("./api/graphql");

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

  entities.forEach((entity) => {
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
  });

  // Fetch data for each entity and insert it into the corresponding database table here

  db.close((error) => {
    if (error) {
      return console.error(error.message);
    }
    console.log("Closed the database connection.");
  });
}

main();
