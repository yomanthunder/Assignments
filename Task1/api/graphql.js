import axios from "axios";
const {
  GRAPHQL_ENDPOINT,
  MB_API_KEY,
  INTROSPECTION_QUERY,
} = require("../utils/constants");

async function fetchSchema() {
  try {
    const response = await axios.post(
      GRAPHQL_ENDPOINT,
      {
        query: INTROSPECTION_QUERY,
      },
      {
        headers: {
          "mb-api-key": MB_API_KEY,
        },
      }
    );

    return response.data.data.__schema;
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  fetchSchema,
};
