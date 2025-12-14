import { Admin, Resource, List, Show, Datagrid, TextField, EmailField, DateField, SimpleShowLayout } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

// Custom data provider that wraps simple-rest to handle our API format
const baseDataProvider = simpleRestProvider("/api/admin");

// Override to handle our response format
const dataProvider = {
  ...baseDataProvider,
  getList: async (resource: string, params: { pagination?: { page: number; perPage: number }; sort?: { field: string; order: string }; filter?: Record<string, unknown> }) => {
    const { page = 1, perPage = 25 } = params.pagination || {};
    const { field = "created_at", order = "DESC" } = params.sort || {};

    const rangeStart = (page - 1) * perPage;
    const rangeEnd = page * perPage - 1;

    const url = new URL(`/api/admin/${resource}`, window.location.origin);
    url.searchParams.set("range", JSON.stringify([rangeStart, rangeEnd]));
    url.searchParams.set("sort", JSON.stringify([field, order]));

    const response = await fetch(url.toString());
    const json = await response.json();

    return {
      data: json.data,
      total: json.total,
    };
  },
  getOne: async (resource: string, params: { id: string | number }) => {
    const response = await fetch(`/api/admin/${resource}/${params.id}`);
    const json = await response.json();
    return { data: json.data };
  },
};

// Users List Component
const UserList = () => (
  <List>
    <Datagrid rowClick="show">
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <DateField source="created_at" showTime />
      <DateField source="updated_at" showTime />
    </Datagrid>
  </List>
);

// Users Show Component
const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" />
      <TextField source="name" />
      <EmailField source="email" />
      <DateField source="created_at" showTime />
      <DateField source="updated_at" showTime />
    </SimpleShowLayout>
  </Show>
);

export function App() {
  return (
    <Admin dataProvider={dataProvider} basename="/admin">
      <Resource
        name="users"
        list={UserList}
        show={UserShow}
        options={{ label: "Users" }}
      />
    </Admin>
  );
}
