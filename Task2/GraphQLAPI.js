// graphqlAPI.js
import axios from "axios";
import { constants } from "./constants.js";

class GraphQLAPI {
  async fetchData(entityName) {
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

      const schema = response.data.data && response.data.data.__schema;

      if (!schema || !schema.types) {
        console.error("Invalid GraphQL schema");
        return [];
      }

      const typeInfo = schema.types.find((type) => type.name === entityName);

      return typeInfo && typeInfo.fields ? typeInfo.fields : [];
    } catch (error) {
      console.error("Error in fetchData method:", error);
      return [];
    }
  }
}

export default GraphQLAPI;
