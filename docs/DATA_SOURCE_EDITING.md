# Data Source Editing Documentation

## 📋 Overview

The Data Source Editing feature allows users to select collections and products from dropdown menus in the editor, instead of manually typing handles. This provides a better UX and prevents errors from invalid handles.

### Key Features

- **Visual Selection**: Dropdown menus for collections/products
- **Server-Side Fetching**: Options fetched server-side (250 items max)
- **Real-Time Updates**: Changes trigger automatic data refetch
- **Multi-Select Support**: `PRODUCTS_BY_HANDLES` supports adding/removing multiple products

### Supported Data Source Types

| Type                  | UI Mode       | Editable Param | Storage Format             |
| --------------------- | ------------- | -------------- | -------------------------- |
| `COLLECTION`          | Single-select | `handle`       | `params.handle: string`    |
| `PRODUCT`             | Single-select | `handle`       | `params.handle: string`    |
| `PRODUCTS_BY_HANDLES` | Multi-select  | `handles`      | `params.handles: string[]` |

## 🏗️ Architecture

```
Client (Browser)                    Server (Node.js)
─────────────────                  ─────────────────
DataSourceEditor                    /editor/api/data-source-options
  ├─ useDataSourceOptions()  ──→   ├─ OPTION_FETCHERS registry
  │   └─ POST /api/...             │   └─ getCommerceClient()
  │                                │       └─ getCollections()/getProducts()
  └─ SimpleSelect dropdown         │           └─ Returns [{value, label}]
      └─ onUpdateParams()          │
          └─ updateDataSource()    /editor/api/editor-data
              └─ pageDataStale     ├─ aggregateData()
                  └─ refetch       │   └─ fetchDataForRequirements()
                                   │       └─ getCollection()/getProduct()
                                   └─ Returns full data objects
```

## 🔄 Data Flow

### 1. Load Dropdown Options

```
User selects widget
  ↓
DataSourceEditor renders
  ↓
useDataSourceOptions("collections" | "products")
  ↓
POST /editor/api/data-source-options
  ↓
OPTION_FETCHERS[type](client)
  ↓
client.getCollections() or getProducts()
  ↓
Returns [{value: handle, label: title}]
  ↓
SimpleSelect displays options
```

### 2. User Selection

```
User selects from dropdown
  ↓
onUpdateParams({ handle: "collection-name" })
  ↓
updateDataSource(dataSourceKey, { params: {...} })
  ↓
pendingPageConfig updated
  ↓
pageDataStale = true
  ↓
TemplateEditor detects change
```

### 3. Data Refetch

```
TemplateEditor useEffect triggers
  ↓
POST /editor/api/editor-data
  ↓
aggregateData() → fetchDataForRequirements()
  ↓
commerceClient.getCollection({ handle }) or getProduct({ handle })
  ↓
Returns full data object
  ↓
Page re-renders with new data
```

## 📝 Parameters

### Editable Parameters

Parameters that can be changed via the editor UI:

- `handle` (string) - Single collection/product handle
- `handles` (array) - Array of product handles (multi-select)

### Template-Only Parameters

Parameters set in template files, not editable in UI:

- `query` - Custom GraphQL query (merchant-specific)
- `variables` - GraphQL query variables
- `id` - Alternative identifier (used when handle not available)
- `first` - Number of items to fetch (pagination)
- `sortKey` - Sort order
- Other pagination/filtering params

**Why template-only?**

- `query`/`variables`: Merchant-specific GraphQL queries
- `id`: Rarely used, typically resolved from route context
- `first`/`sortKey`: Set at template level for consistency

### By Data Source Type

#### COLLECTION

**Editable:** `handle` (string)

**Template-Only:** `id`, `query`, `variables`, `first`, `sortKey`, etc.

```typescript
{
  type: DATA_SOURCE_TYPES.COLLECTION,
  params: {
    handle: "most-loved-home-page",  // ✅ Editable
    first: 12,                        // ❌ Template-only
    query: GET_COLLECTION,            // ❌ Template-only
  },
}
```

#### PRODUCT

**Editable:** `handle` (string)

**Template-Only:** `id`, `query`, `variables`

```typescript
{
  type: DATA_SOURCE_TYPES.PRODUCT,
  params: {
    handle: "product-handle",  // ✅ Editable
    query: GET_PRODUCT,        // ❌ Template-only
  },
}
```

#### PRODUCTS_BY_HANDLES

**Editable:** `handles` (array)

**Template-Only:** `query`, `variables`

```typescript
{
  type: DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES,
  params: {
    handles: ["prod-1", "prod-2"],  // ✅ Editable (add/remove)
    query: GET_PRODUCT,              // ❌ Template-only
  },
}
```

## 🧩 Components

### DataSourceEditor

**File:** `src/app/editor/components/ui/DataSourceEditor.tsx`

Main component that renders the editor UI based on `DATA_SOURCE_EDITOR_REGISTRY` config.

**Props:**

- `dataSource`: `{ type: string; params: Record<string, any> } | null`
- `onUpdateParams`: `(updates: Record<string, any>) => void`

**Behavior:**

- Uses `getDataSourceEditorConfig()` to get config for data source type
- Renders single-select or multi-select based on `config.mode`
- Calls `onUpdateParams()` when user makes selection

### useDataSourceOptions Hook

**File:** `src/app/editor/hooks/useDataSourceOptions.ts`

Fetches options list for dropdowns.

**Usage:**

```typescript
const { options, loading } = useDataSourceOptions("collections" | "products");
```

**Returns:**

- `options`: `Array<{value: string, label: string}>`
- `loading`: `boolean`
- `error`: `Error | null`

### Editor Config Registry

**File:** `src/app/editor/config/data-source-editor.ts`

Centralized configuration for each data source type:

```typescript
{
  mode: "single-select" | "multi-select" | "none",
  optionSource: "collections" | "products",
  paramKey: "handle" | "handles",
  label: "Collection" | "Product" | "Products",
  placeholder: "Select collection" | "Add product",
}
```

## 🌐 API Routes

### /editor/api/data-source-options

**File:** `src/app/editor/api/data-source-options/route.ts`

**Method:** POST

**Request:**

```json
{
  "type": "collections" | "products"
}
```

**Response:**

```json
{
  "data": [
    { "value": "best-sellers", "label": "Best Sellers" },
    { "value": "new-arrivals", "label": "New Arrivals" }
  ]
}
```

**Implementation:**

- Uses `OPTION_FETCHERS` registry pattern
- Calls `getCommerceClient().getCollections()` or `getProducts()`
- Returns formatted `{value, label}` array
- Server-side only (requires environment variables)

## 📊 State Management

### useEditorState Store

**File:** `src/app/editor/stores/useEditorState.ts`

**Key State:**

- `pageConfig`: Current committed configuration
- `pendingPageConfig`: Staged configuration (before refetch)
- `pageDataStale`: Flag indicating data needs refetch

**updateDataSource() Action:**

```typescript
updateDataSource(key, updates) {
  // Updates pendingPageConfig.dataSources[key]
  // Sets pageDataStale: true
  // Triggers refetch in TemplateEditor
}
```

## 🔀 Multi-Select Implementation

For `PRODUCTS_BY_HANDLES`:

1. **Add Product**: Dropdown filters out already-selected products
2. **Remove Product**: Each selected product has a remove button (×)
3. **Storage**: `params.handles: string[]`

**UI Pattern:**

- Dropdown to add (filters selected items)
- List of selected items with remove buttons
- Updates `params.handles` array on add/remove

## 📚 Related Files

| File                                                  | Purpose                       |
| ----------------------------------------------------- | ----------------------------- |
| `components/ui/DataSourceEditor.tsx`                  | Main editor component         |
| `hooks/useDataSourceOptions.ts`                       | Fetches dropdown options      |
| `config/data-source-editor.ts`                        | Editor configuration registry |
| `api/data-source-options/route.ts`                    | Server route for options      |
| `stores/useEditorState.ts`                            | State management              |
| `core/data-aggregator/fetch-data-for-requirements.ts` | Runtime data fetching         |

## 🔧 Troubleshooting

### Dropdown Empty

- Check Network tab for `/editor/api/data-source-options` response
- Verify `optionSource` matches data source type
- Check if Custom Backend adapter (may not support `getCollections`/`getProducts`)

### Selection Not Updating

- Verify `onUpdateParams` is called
- Check `dataSourceKey` matches widget's `dataSourceKey`
- Inspect `pendingPageConfig` in state

### Data Not Refetching

- Verify `pageDataStale` is set to `true`
- Check `TemplateEditor` useEffect watching `pageDataStale`
- Inspect Network tab for `/editor/api/editor-data` request
