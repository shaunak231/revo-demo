# RevoGrid Minimal Reproduction

This folder contains a minimal reproduction of our RevoGrid implementation with custom React components. This demonstrates how we're using RevoGrid with custom cell components and may help identify rerendering issues.

## Structure

```
revogrid-minimal-reproduction/
├── README.md
├── package.json
├── src/
│   ├── App.tsx                 # Main app with RevoGrid setup
│   ├── components/
│   │   ├── Table.tsx            # Main table component
│   │   ├── CellDisplay.tsx      # Cell router component
│   │   ├── CellNumber.tsx       # Example custom cell component
│   │   └── ColHeader.tsx        # Column header component
│   └── utils/
│       ├── withAllProviders.tsx # HOC wrapper for providers
│       └── templateFactory.tsx  # Template factory functions
```

## Key Implementation Details

### 1. Template Wrapper Pattern
We use RevoGrid's `Template` function to wrap React components:
```typescript
Template(withAllProviders(CellDisplay), {
  key: `${tableName}-${columnName}`,
  readonly,
  tableName,
  sqlSchema,
  hideOpenButton,
})
```

### 2. withAllProviders HOC
We wrap components in providers because RevoGrid removes access to root providers:
```typescript
export const withAllProviders = (Component: React.ComponentType<any>) => {
  const WrappedComponent = memo((props: any) => (
    <AllProviders>
      <Component {...props} />
    </AllProviders>
  ));
  return WrappedComponent;
};
```

### 3. CellDisplay Router
The `CellDisplay` component routes to different cell types based on field type:
- CellNumber for Number/Float fields
- CellText for Text/LongText fields
- etc.

### 4. Custom Cell Components
Custom cells (like `CellNumber`) use:
- Portal-based editing (createPortal)
- Custom event dispatching for save operations
- State management for editing mode
- Position tracking for portal positioning

## Rerendering Issue

We're experiencing rerendering issues where custom cell components re-render unnecessarily, potentially causing performance problems. This minimal reproduction should help identify the root cause.

## Running the Example

```bash
cd revogrid-minimal-reproduction
npm install
npm run dev
```

## Dependencies

- `@revolist/react-datagrid`: ^4.13.3
- `@revolist/revogrid-pro`: (local package)
- React 18+
- TypeScript

