import { Admin, Resource, ListGuesser } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

const dataProvider = simpleRestProvider("/api"); // gateway proxies /api -> backend

export function App() {
  return (
    <Admin dataProvider={dataProvider}>
      <Resource name="hello" list={ListGuesser} />
    </Admin>
  );
}
