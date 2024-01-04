import axios from "axios";
import { constants } from "../utils/constants.js";

async function fetchSchema() {
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

    return response.data.data.__schema;
  } catch (error) {
    console.error(error);
  }
}

export default fetchSchema;
