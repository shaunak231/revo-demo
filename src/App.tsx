import { useState } from "react";
import { Table } from "./components/Table";
import "./App.css";
import { initialData, mockSqlSchema } from "./data/sampleData";

function App() {
  const [data] = useState(initialData);

  return (
    <div className="App" style={{ padding: "20px" }}>
      <Table
        tableName="products"
        data={data}
        columns={[
          "id",
          "name",
          "status",
          "tags",
          "description",
          "price",
          "quantity",
          "category",
          "priority",
        ]}
        sqlSchema={mockSqlSchema}
        readonly={false}
      />
    </div>
  );
}

export default App;

