export const mockSqlSchema = {
  tables: {
    products: {
      fields: {
        id: { type: "Text", displayName: "ID" },
        name: { type: "Text", displayName: "Product Name" },
        description: { type: "LongText", displayName: "Description" },
        status: { type: "SingleSelect", displayName: "Status" },
        tags: { type: "MultiSelect", displayName: "Tags" },
      },
    },
  },
};

export const initialData = [
  {
    id: "1",
    name: "Product A",
    description: "This is product A",
    status: "Active",
    tags: ["New", "Featured"],
  },
  {
    id: "2",
    name: "Product B",
    description: "This is product B",
    status: "Active",
    tags: ["Clearance"],
  },
  {
    id: "3",
    name: "Product C",
    description: "This is product C",
    status: "Inactive",
    tags: ["Legacy"],
  },
  {
    id: "4",
    name: "Very Long Description Item",
    description:
      "This product has a very long description to test multi-line editing in the text cell. It should wrap across multiple lines when you open the portal editor and when rendered in the grid.",
  },
  {
    id: "5",
    name: "Negative Stock",
    description: "Negative values to test numeric sanitization and display.",
  },
  {
    id: "6",
    name: "Zero Price",
    description: "Zero price, large quantity.",
  },
  {
    id: "7",
    name: "Big Integer",
    description: "Very large integer value.",
  },
  {
    id: "8",
    name: "High Precision",
    description: "High-precision decimal number.",
  },
  {
    id: "9",
    name: "Scientific Input",
    description: "Value entered as scientific notation to test formatting.",
  },
  {
    id: "10",
    name: "Short Name",
    description: "Short text.",
  },
  {
    id: "11",
    name: "Another Product",
    description: "Standard product row.",
  },
  {
    id: "12",
    name: "Edge Case Text",
    description:
      "   Text with leading and trailing spaces to test trimming/handling.   ",
  },
  {
    id: "13",
    name: "Max Quantity",
    description: "Large quantity number.",
  },
  {
    id: "14",
    name: "Mixed Format",
    description: "Numbers with leading zeros and trailing decimal zeros.",
  },
  {
    id: "15",
    name: "Empty Description",
    description: "",
  },
  {
    id: "16",
    name: "Bulk Order 1",
    description: "First bulk order example row.",
  },
  {
    id: "17",
    name: "Bulk Order 2",
    description: "Second bulk order example row.",
  },
  {
    id: "18",
    name: "Bulk Order 3",
    description: "Third bulk order example row.",
  },
  {
    id: "19",
    name: "Seasonal Item 1",
    description: "Limited-time seasonal product.",
  },
  {
    id: "20",
    name: "Seasonal Item 2",
    description: "Another limited-time seasonal product.",
  },
  {
    id: "21",
    name: "Discontinued Item 1",
    description: "Discontinued product kept for history.",
  },
  {
    id: "22",
    name: "Discontinued Item 2",
    description: "Another discontinued product.",
  },
  {
    id: "23",
    name: "Sample Pack 1",
    description: "Small sample pack.",
  },
  {
    id: "24",
    name: "Sample Pack 2",
    description: "Medium sample pack.",
  },
  {
    id: "25",
    name: "Sample Pack 3",
    description: "Large sample pack.",
  },
  {
    id: "26",
    name: "Premium Product 1",
    description: "High value premium product.",
  },
  {
    id: "27",
    name: "Premium Product 2",
    description: "Second premium tier product.",
  },
  {
    id: "28",
    name: "Premium Product 3",
    description: "Top tier premium product.",
  },
  {
    id: "29",
    name: "Refurbished Item 1",
    description: "Refurbished product with discount.",
  },
  {
    id: "30",
    name: "Refurbished Item 2",
    description: "Another refurbished product.",
  },
  {
    id: "31",
    name: "Test SKU A",
    description: "Test SKU with very low price.",
  },
  {
    id: "32",
    name: "Test SKU B",
    description: "Another test SKU row.",
  },
  {
    id: "33",
    name: "Long Name Product XXXXXXXXXXXXXXXXXXXXX",
    description:
      "Product with an intentionally long name to test column width and overflow handling.",
  },
  {
    id: "34",
    name: "Unicode 商品",
    description: "Row containing unicode characters in the name.",
  },
  {
    id: "35",
    name: "Emoji 😀 Product",
    description: "Row with emoji in the name to test rendering.",
  },
];
