# Data Source Dropdown Flow Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Complete Data Flow](#complete-data-flow)
4. [Component Details](#component-details)
5. [API Routes](#api-routes)
6. [State Management](#state-management)
7. [Multi-Select Handling](#multi-select-handling)
8. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Data Source Dropdown feature allows users to select collections and products from dropdown menus instead of manually typing handles. This provides a better user experience and prevents errors from invalid handles.

### Key Features

- **Dropdown Selection**: Visual selection of collections/products instead of text input
- **Server-Side Fetching**: Handles lists fetched from server (250 items max)
- **Real-Time Updates**: Changes immediately trigger data refetch
- **Multi-Select Support**: `PRODUCTS_BY_HANDLES` supports adding multiple products
- **Scrolling Support**: Dropdowns scroll when there are many options (max-height: 300px)

### Supported Data Source Types

| Type                      | UI                        | Storage Format                 |
| ------------------------- | ------------------------- | ------------------------------ |
| `COLLECTION_BY_HANDLES`   | Single dropdown           | `params.handle: string`        |
| `PRODUCT`                 | Single dropdown           | `params.handle: string`        |
| `PRODUCTS_BY_HANDLES`     | Multi-select (add/remove) | `params.handles: string[]`     |
| `PRODUCT_RECOMMENDATIONS` | Single dropdown           | `params.productHandle: string` |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE (Browser)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BuilderToolbar.tsx                                          │
│    ├─ useDataSourceOptions() hook                           │
│    │   └─ Fetches options via API                           │
│    │                                                         │
│    └─ renderDataSourceEditor()                              │
│        └─ Renders SimpleSelect dropdowns                    │
│            └─ Calls updateDataSource() on selection        │
│                                                              │
│  useEditorState.ts                                           │
│    └─ updateDataSource()                                    │
│        └─ Updates pendingPageConfig                         │
│            └─ Sets pageDataStale: true                      │
│                                                              │
│  TemplateEditor.tsx                                          │
│    └─ Watches pageDataStale                                 │
│        └─ Triggers data refetch                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP POST
┌─────────────────────────────────────────────────────────────┐
│                    SERVER SIDE (Node.js)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  /editor/api/data-source-options                            │
│    └─ getCommerceClient() ✅                                 │
│        └─ getCollections() / getProducts()                  │
│            └─ Returns: [{value: handle, label: title}]      │
│                                                              │
│  /editor/api/editor-data                                     │
│    └─ aggregateData()                                        │
│        └─ getCommerceClient() ✅                             │
│            └─ getCollection() / getProduct()                │
│                └─ Returns: Full data objects                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Complete Data Flow

### Phase 1: Initial Load - Fetching Dropdown Options

```
1. User selects a widget with a data source
   ↓
2. BuilderToolbar.tsx detects selectedDataSource?.type
   ↓
3. useDataSourceOptions hook is called with data source type
   ↓
4. Hook calls api.editor.getDataSourceOptions("collections" | "products")
   ↓
5. API service makes POST to /editor/api/data-source-options
   ↓
6. Server route (data-source-options/route.ts):
   - Uses getCommerceClient() [SERVER-SIDE ONLY ✅]
   - Calls commerceClient.getCollections() or getProducts()
   - Returns formatted data: [{value: handle, label: title}, ...]
   ↓
7. Hook receives data and updates state
   ↓
8. BuilderToolbar renders SimpleSelect dropdown with options
```

**Code Flow:**

```typescript
// BuilderToolbar.tsx
const { options: dataSourceOptions, loading } =
  useDataSourceOptions(selectedDataSource?.type || null);

// useDataSourceOptions.ts
useEffect(() => {
  if (dataSourceType === DATA_SOURCE_TYPES.COLLECTION_BY_HANDLES) {
    const data = await api.editor.getDataSourceOptions("collections");
    setOptions(data);
  }
  // ...
}, [dataSourceType]);

// api.ts
static async getDataSourceOptions(type: "collections" | "products") {
  const response = await fetch(`/editor/api/data-source-options`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
  return response.json().data;
}

// data-source-options/route.ts
const commerceClient = getCommerceClient(); // ✅ Server-side only
const response = await commerceClient.getCollections({ first: 250 });
return NextResponse.json({
  data: response.collections.map(c => ({
    value: c.handle,
    label: c.title,
  })),
});
```

### Phase 2: User Selection - Updating Data Source

```
1. User selects option from dropdown (e.g., "Best Sellers" collection)
   ↓
2. handleSelect() or handleProductSelect() is called with handle
   ↓
3. updateDataSource(dataSourceKey, { params: { handle: "best-sellers" } })
   ↓
4. useEditorState.updateDataSource():
   - Updates pendingPageConfig.dataSources[dataSourceKey].params.handle
   - Sets pageDataStale: true
   ↓
5. TemplateEditor detects pageDataStale change via useEffect
```

**Code Flow:**

```typescript
// BuilderToolbar.tsx
const handleSelect = (handle: string) => {
  updateDataSource(dataSourceKey, {
    params: { ...params, handle },
  });
};

// useEditorState.ts
updateDataSource: (key, updates) => {
  set((state) => {
    const baseConfig = state.pendingPageConfig || state.pageConfig || {};
    const nextDataSources = {
      ...baseConfig.dataSources,
      [key]: {
        ...baseConfig.dataSources[key],
        ...updates,
      },
    };
    return {
      pendingPageConfig: {
        ...baseConfig,
        dataSources: nextDataSources,
      },
      pageDataStale: true, // ← Triggers refetch
    };
  });
};
```

### Phase 3: Data Refetch - Getting Real Data

```
1. TemplateEditor useEffect triggers refetchData()
   ↓
2. Calls api.editor.fetchEditorData() with updated pageConfig
   ↓
3. POST to /editor/api/editor-data
   ↓
4. Server route (editor-data/route.ts):
   - Uses aggregateData() function
   - aggregateData() uses getCommerceClient() [SERVER-SIDE ✅]
   - collectDataRequirements() extracts data requirements
   - fetchDataForRequirements() makes actual API calls:
     * commerceClient.getCollection({ handle: "best-sellers" })
     * or commerceClient.getProduct({ handle: "product-handle" })
   ↓
5. Returns aggregated data (products, collections, etc.)
   ↓
6. TemplateEditor updates pageData state
   ↓
7. Page re-renders with new data
   ↓
8. Widgets display the selected collection/product data
```

**Code Flow:**

```typescript
// TemplateEditor.tsx
useEffect(() => {
  const refetchData = async () => {
    if (!pageDataStale) return;

    const realData = await api.editor.fetchEditorData({
      pageConfig: pendingPageConfig || pageConfig,
      routeContext,
      merchantName,
    });

    setPageData(realData);
    setPageDataStale(false);
  };
  refetchData();
}, [pageDataStale, pendingPageConfig]);

// editor-data/route.ts
const data = await aggregateData({
  merchantName,
  pageConfig,
  routeContext,
});

// fetch-data-for-requirements.ts
case DATA_SOURCE_TYPES.COLLECTION_BY_HANDLES:
  result = await commerceClient.getCollection({
    handle: resolvedParams.handle
  });
  break;

case DATA_SOURCE_TYPES.PRODUCT:
  result = await commerceClient.getProduct({
    handle: resolvedParams.handle
  });
  break;
```

## 🧩 Component Details

### 1. useDataSourceOptions Hook

**File:** `src/app/editor/hooks/useDataSourceOptions.ts`

**Purpose:** Fetches collections or products list for dropdown options

**Usage:**

```typescript
const { options, loading, error } = useDataSourceOptions(
  selectedDataSource?.type || null
);
```

**Returns:**

- `options`: Array of `{value: string, label: string}`
- `loading`: Boolean indicating fetch status
- `error`: Error object if fetch fails

**Implementation:**

```typescript
export function useDataSourceOptions(
  dataSourceType: DataSourceType | null
): UseDataSourceOptionsResult {
  const [options, setOptions] = useState<SimpleSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!dataSourceType) {
      setOptions([]);
      return;
    }

    const fetchOptions = async () => {
      setLoading(true);
      try {
        if (dataSourceType === DATA_SOURCE_TYPES.COLLECTION_BY_HANDLES) {
          const data = await api.editor.getDataSourceOptions("collections");
          setOptions(data);
        } else if (
          dataSourceType === DATA_SOURCE_TYPES.PRODUCT ||
          dataSourceType === DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES ||
          dataSourceType === DATA_SOURCE_TYPES.PRODUCT_RECOMMENDATIONS
        ) {
          const data = await api.editor.getDataSourceOptions("products");
          setOptions(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [dataSourceType]);

  return { options, loading, error };
}
```

### 2. BuilderToolbar Component

**File:** `src/app/editor/components/ui/BuilderToolbar.tsx`

**Key Functions:**

#### renderDataSourceEditor()

Renders appropriate dropdown based on data source type:

```typescript
const renderDataSourceEditor = () => {
  if (!selectedWidget || !selectedDataSource) return null;

  const type = selectedDataSource.type;
  const params = selectedDataSource.params || {};
  const dataSourceKey = selectedWidget.dataSourceKey;

  // Single select handlers
  const handleSelect = (handle: string) => {
    updateDataSource(dataSourceKey, {
      params: { ...params, handle },
    });
  };

  // Collection dropdown
  if (type === DATA_SOURCE_TYPES.COLLECTION_BY_HANDLES) {
    return (
      <SimpleSelect
        options={dataSourceOptions}
        value={params.handle ?? ""}
        onSelect={handleSelect}
        placeholder="Select collection"
        size="sm"
      />
    );
  }

  // Product dropdown
  if (type === DATA_SOURCE_TYPES.PRODUCT) {
    return (
      <SimpleSelect
        options={dataSourceOptions}
        value={params.handle ?? ""}
        onSelect={handleSelect}
        placeholder="Select product"
        size="sm"
      />
    );
  }

  // ... other types
};
```

### 3. SimpleSelect Component

**File:** `src/app/editor/components/ui/SimpleSelect.tsx`

**Purpose:** Wrapper around Select component with simplified API

**Props:**

- `options`: Array of `{value: string, label: string}`
- `value`: Currently selected value
- `onSelect`: Callback when selection changes
- `placeholder`: Placeholder text
- `size`: "sm" | "md" | "lg"
- `disabled`: Boolean

**Features:**

- Uses editor Select component (with scrolling support)
- Max height: 300px with overflow scrolling
- Size variants for different contexts

## 🌐 API Routes

### 1. /editor/api/data-source-options

**File:** `src/app/editor/api/data-source-options/route.ts`

**Method:** POST

**Request Body:**

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

```typescript
export async function POST(request: NextRequest) {
  const { type } = await request.json();
  const commerceClient = getCommerceClient(); // ✅ Server-side only

  if (type === "collections") {
    const response = await commerceClient.getCollections({ first: 250 });
    return NextResponse.json({
      data: response.collections.map((collection) => ({
        value: collection.handle,
        label: collection.title,
      })),
    });
  }

  if (type === "products") {
    const response = await commerceClient.getProducts({ first: 250 });
    return NextResponse.json({
      data: response.products.map((product) => ({
        value: product.handle,
        label: product.title,
      })),
    });
  }
}
```

**Why Server-Side?**

- `getCommerceClient()` requires server-side environment variables
- `process.env.PLATFORM`, `SHOPIFY_STORE_DOMAIN`, etc. are not available on client
- Follows same pattern as `/editor/api/editor-data`

### 2. /editor/api/editor-data

**File:** `src/app/editor/api/editor-data/route.ts`

**Method:** POST

**Purpose:** Fetches actual data for rendering (not just handles)

**Request Body:**

```json
{
  "pageConfig": {
    /* page configuration with data sources */
  },
  "routeContext": {
    /* route context */
  },
  "merchantName": "merchant1"
}
```

**Response:**

```json
{
  "bestSellersData": {
    /* full collection object */
  },
  "productData": {
    /* full product object */
  }
}
```

## 📊 State Management

### useEditorState Store

**File:** `src/app/editor/stores/useEditorState.ts`

**Key State:**

- `pageConfig`: Current committed page configuration
- `pendingPageConfig`: Staged configuration (before refetch)
- `pageDataStale`: Flag indicating data needs refetch

**Key Actions:**

#### updateDataSource()

Updates a data source and marks data as stale:

```typescript
updateDataSource: (key, updates) => {
  set((state) => {
    const baseConfig = state.pendingPageConfig || state.pageConfig || {};
    const nextDataSources = {
      ...baseConfig.dataSources,
      [key]: {
        ...baseConfig.dataSources[key],
        ...updates,
      },
    };

    return {
      pendingPageConfig: {
        ...baseConfig,
        dataSources: nextDataSources,
      },
      pageDataStale: true, // ← Triggers refetch in TemplateEditor
    };
  });
};
```

**Flow:**

1. User selects from dropdown
2. `updateDataSource()` called
3. `pendingPageConfig` updated with new handle
4. `pageDataStale` set to `true`
5. `TemplateEditor` detects change and refetches

## 🔀 Multi-Select Handling

### PRODUCTS_BY_HANDLES Type

**Storage Format:**

```json
{
  "dataSourceKey": {
    "type": "PRODUCTS_BY_HANDLES",
    "params": {
      "handles": ["product-1", "product-2", "product-3"]
    }
  }
}
```

**UI Implementation:**

```typescript
if (type === DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES) {
  const currentHandles = Array.isArray(params.handles) ? params.handles : [];

  const handleAddProduct = (handle: string) => {
    if (!currentHandles.includes(handle)) {
      updateDataSource(dataSourceKey, {
        params: { ...params, handles: [...currentHandles, handle] },
      });
    }
  };

  const handleRemoveProduct = (handle: string) => {
    updateDataSource(dataSourceKey, {
      params: {
        ...params,
        handles: currentHandles.filter((h: string) => h !== handle),
      },
    });
  };

  return (
    <>
      {/* Dropdown to add products (filters out already selected) */}
      <SimpleSelect
        options={dataSourceOptions.filter(
          (opt) => !currentHandles.includes(opt.value)
        )}
        onSelect={handleAddProduct}
        placeholder="Add product"
      />

      {/* List of selected products with remove buttons */}
      {currentHandles.map((handle: string) => (
        <div key={handle}>
          <span>{option?.label || handle}</span>
          <button onClick={() => handleRemoveProduct(handle)}>×</button>
        </div>
      ))}
    </>
  );
}
```

**Data Fetching:**

```typescript
// fetch-data-for-requirements.ts
case DATA_SOURCE_TYPES.PRODUCTS_BY_HANDLES:
  if (resolvedParams.handles && Array.isArray(resolvedParams.handles)) {
    // Map array to promises
    const productPromises = resolvedParams.handles.map(
      (handle: string) => commerceClient.getProduct({ handle })
    );

    // Fetch all in parallel
    const products = await Promise.all(productPromises);

    // Return as array
    result = {
      products: products.filter((product) => product !== null),
    };
  }
  break;
```

## 🔧 Troubleshooting

### Issue: Dropdown not showing options

**Symptoms:** Dropdown appears but is empty

**Possible Causes:**

1. API route not returning data
2. Hook not fetching correctly
3. Data source type not recognized

**Debug Steps:**

```typescript
// Check hook state
const { options, loading, error } = useDataSourceOptions(dataSourceType);
console.log("Options:", options);
console.log("Loading:", loading);
console.log("Error:", error);

// Check API response
// In browser DevTools → Network tab
// Look for POST /editor/api/data-source-options
```

### Issue: Selection not updating data source

**Symptoms:** Selecting option doesn't change data

**Possible Causes:**

1. `updateDataSource` not being called
2. Data source key mismatch
3. State not updating

**Debug Steps:**

```typescript
// Add logging in handleSelect
const handleSelect = (handle: string) => {
  console.log("Selecting:", handle);
  console.log("DataSourceKey:", dataSourceKey);
  console.log("Current params:", params);

  updateDataSource(dataSourceKey, {
    params: { ...params, handle },
  });
};

// Check state after update
// In useEditorState, add logging to updateDataSource
```

### Issue: Data not refetching after selection

**Symptoms:** Dropdown updates but page doesn't show new data

**Possible Causes:**

1. `pageDataStale` not being set
2. `TemplateEditor` not watching `pageDataStale`
3. Refetch failing silently

**Debug Steps:**

```typescript
// Check pageDataStale in TemplateEditor
useEffect(() => {
  console.log("pageDataStale changed:", pageDataStale);
  console.log("pendingPageConfig:", pendingPageConfig);
}, [pageDataStale, pendingPageConfig]);

// Check refetch function
const refetchData = async () => {
  console.log("Refetching data...");
  try {
    const realData = await api.editor.fetchEditorData({...});
    console.log("Refetched data:", realData);
  } catch (err) {
    console.error("Refetch error:", err);
  }
};
```

### Issue: Dropdown not scrolling

**Symptoms:** Many options but no scrollbar

**Possible Causes:**

1. Max-height not set on Viewport
2. Overflow not enabled

**Solution:**
Check `src/app/editor/components/ui/Select.tsx`:

```typescript
<SelectPrimitive.Viewport
  className={cn(
    "p-1 max-h-[300px] overflow-y-auto", // ← Must have these
    // ...
  )}
>
```

## 📝 Summary

### Key Points

1. **Server-Side Fetching**: Options are fetched server-side because `getCommerceClient()` requires environment variables
2. **Two-Step Process**:
   - First: Fetch handles list for dropdown (lightweight)
   - Second: Fetch full data after selection (heavy)
3. **State Management**: Uses `pendingPageConfig` to stage changes before refetch
4. **Automatic Refetch**: `pageDataStale` flag triggers automatic data refetch
5. **Multi-Select Support**: Arrays handled via add/remove UI pattern

### Data Flow Summary

```
User Action → Dropdown Selection
  → updateDataSource()
  → pendingPageConfig updated
  → pageDataStale = true
  → TemplateEditor refetches
  → Page updates with new data
```

### Files Involved

| File                                       | Purpose                  |
| ------------------------------------------ | ------------------------ |
| `hooks/useDataSourceOptions.ts`            | Fetches options list     |
| `components/ui/BuilderToolbar.tsx`         | Renders dropdowns        |
| `components/ui/SimpleSelect.tsx`           | Dropdown component       |
| `api/data-source-options/route.ts`         | Server route for options |
| `services/api.ts`                          | API client methods       |
| `stores/useEditorState.ts`                 | State management         |
| `components/containers/TemplateEditor.tsx` | Refetch orchestration    |

This architecture ensures clean separation of concerns, proper server-side data access, and a smooth user experience.
