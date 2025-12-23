# Unified Data Source Registry Proposal

## 📋 Overview

This document proposes a unified registry architecture for data source types that would serve as a single source of truth for both editor behavior and runtime fetching logic.

## 🎯 Problem Statement

Currently, data source type definitions are scattered across multiple files:

1. **Editor Registry** (`data-source-editor.ts`) - Defines UI behavior
2. **Runtime Fetch** (`fetch-data-for-requirements.ts`) - Defines how to fetch data
3. **Route Resolver** (`resolveRouteSpecificParams`) - Defines route-based defaults
4. **Option Fetchers** (`data-source-options/route.ts`) - Defines dropdown options

### Problems This Causes

1. **Scattered Logic**: Adding a new data source type requires updating 4+ places
2. **Sync Issues**: Editor and runtime can drift out of sync
3. **No Validation**: Can't verify editor params match runtime expectations
4. **Duplication**: Same knowledge repeated in multiple places

## 💡 Proposed Solution

### Unified Registry Structure

```typescript
export const DATA_SOURCE_REGISTRY = {
  [DATA_SOURCE_TYPES.COLLECTION]: {
    // Editor behavior
    editor: {
      mode: "single-select",
      optionSource: "collections",
      paramKey: "handle",
      label: "Collection",
      placeholder: "Select collection",
    },

    // Runtime behavior
    runtime: {
      // How to fetch data
      fetcher: async (client, params) => {
        return await client.getCollection(
          { handle: params.handle, id: params.id },
          { query: params.query, variables: params.variables }
        );
      },

      // Required/optional params
      params: {
        handle: { required: false, type: "string" },
        id: { required: false, type: "string" },
        query: { required: false, type: "object" },
        variables: { required: false, type: "object" },
      },

      // Route resolution (if needed)
      routeResolver: (routeContext, merchantName) => {
        return { handle: routeContext.collectionHandle };
      },
    },
  },

  // ... other types
};
```

## ✅ Benefits

### 1. Single Source of Truth

- Add new type in ONE place
- Editor and runtime automatically stay in sync
- No scattered updates

### 2. Type Safety

- TypeScript ensures consistency
- Compile-time validation
- Editor paramKey must exist in runtime.params

### 3. Eliminates Duplication

- Runtime fetch uses registry (no switch statement)
- Option fetchers derive from registry
- Route resolvers derive from registry

### 4. Self-Documenting

- All behavior in one place
- Clear param requirements
- Easy to understand

## 📝 Implementation Example

### Current Approach (4 places to update)

```typescript
// 1. Editor registry
DATA_SOURCE_EDITOR_REGISTRY[DATA_SOURCE_TYPES.COLLECTION] = { ... }

// 2. Runtime fetch
case DATA_SOURCE_TYPES.COLLECTION:
  return await commerceClient.getCollection(...);

// 3. Route resolver
case DATA_SOURCE_TYPES.COLLECTION:
  // resolve handle...

// 4. Option fetcher
collections: async (client) => { ... }
```

### Unified Approach (1 place)

```typescript
// ✅ ONE place
DATA_SOURCE_REGISTRY[DATA_SOURCE_TYPES.COLLECTION] = {
  editor: { ... },
  runtime: { fetcher: ..., params: ... },
};
```

## 🔄 Migration Path

1. Create unified registry structure
2. Migrate existing types one by one
3. Update runtime fetch to use registry
4. Update editor config to use registry
5. Remove old switch statements

## ⚖️ Trade-offs

### Pros

- ✅ Single source of truth
- ✅ Type safety & validation
- ✅ Easier maintenance
- ✅ Less duplication
- ✅ Self-documenting

### Cons

- ⚠️ More upfront complexity
- ⚠️ Requires refactoring existing code
- ⚠️ Slightly more abstraction

## 🎯 When to Implement

**Implement if:**

- You plan to add many new data source types
- You want stronger type safety
- You want to reduce maintenance burden

**Defer if:**

- Current set of types is stable
- Current approach works well
- Team prefers simpler, more explicit code

## 📚 Related Files

- `src/app/editor/config/data-source-editor.ts` - Current editor registry
- `src/lib/page-builder/core/data-aggregator/fetch-data-for-requirements.ts` - Current runtime fetch
- `src/app/editor/api/data-source-options/route.ts` - Current option fetchers

## 🔮 Future Considerations

- Could extend to support param validation
- Could add param schemas for dynamic form generation
- Could support custom fetchers per merchant
- Could add caching strategies per type
