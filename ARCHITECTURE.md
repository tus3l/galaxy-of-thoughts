# 🌌 Galaxy of Thoughts - System Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Next.js App                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              app/page.tsx (Main)                    │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │          HUD Overlay (HTML/CSS)              │  │  │  │
│  │  │  │  • Title                                     │  │  │  │
│  │  │  │  • Instructions                              │  │  │  │
│  │  │  │  • "Add Star" Button                         │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  │                                                      │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │       components/Scene.tsx (3D)              │  │  │  │
│  │  │  │                                               │  │  │  │
│  │  │  │  ┌────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │    React Three Fiber Canvas           │  │  │  │  │
│  │  │  │  │                                        │  │  │  │  │
│  │  │  │  │  ┌──────────────────────────────────┐ │  │  │  │  │
│  │  │  │  │  │  components/Galaxy.tsx          │ │  │  │  │  │
│  │  │  │  │  │                                  │ │  │  │  │  │
│  │  │  │  │  │  • InstancedMesh (5000 stars)   │ │  │  │  │  │
│  │  │  │  │  │  • Pulsation animation          │ │  │  │  │  │
│  │  │  │  │  │  • Hover detection              │ │  │  │  │  │
│  │  │  │  │  │  • Click handlers               │ │  │  │  │  │
│  │  │  │  │  └──────────────────────────────────┘ │  │  │  │  │
│  │  │  │  │                                        │  │  │  │  │
│  │  │  │  │  • Lighting                            │  │  │  │  │
│  │  │  │  │  • Environment                         │  │  │  │  │
│  │  │  │  │  • OrbitControls                       │  │  │  │  │
│  │  │  │  │  • Background Stars                    │  │  │  │  │
│  │  │  │  │                                        │  │  │  │  │
│  │  │  │  │  ┌──────────────────────────────────┐ │  │  │  │  │
│  │  │  │  │  │  EffectComposer (Post-Proc)     │ │  │  │  │  │
│  │  │  │  │  │  • Bloom (glow)                 │ │  │  │  │  │
│  │  │  │  │  │  • Noise (grain)                │ │  │  │  │  │
│  │  │  │  │  │  • Vignette (focus)             │ │  │  │  │  │
│  │  │  │  │  │  • DepthOfField (blur)          │ │  │  │  │  │
│  │  │  │  │  └──────────────────────────────────┘ │  │  │  │  │
│  │  │  │  └────────────────────────────────────────┘  │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ config/      │  │ lib/         │  │ types/       │          │
│  │ constants.ts │  │ utils.ts     │  │ index.ts     │          │
│  │              │  │              │  │              │          │
│  │ • Colors     │  │ • Star gen   │  │ • StarData   │          │
│  │ • Timings    │  │ • Validation │  │ • Props      │          │
│  │ • Settings   │  │ • Formatters │  │ • Configs    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Star Rendering Flow
```
generateStarData()
      ↓
[StarData Array] (5000 objects)
      ↓
useEffect() → Setup InstancedMesh
      ↓
Set Matrix for each star
      ↓
Set Color for each star
      ↓
useFrame() → Animation Loop
      ↓
Update scales (pulsation + hover)
      ↓
GPU renders all stars in 1 draw call
```

### User Interaction Flow
```
User Hovers Star
      ↓
onPointerMove() triggered
      ↓
Get instanceId from event
      ↓
Update hovered state
      ↓
useFrame() scales up hovered star
      ↓
Cursor changes to pointer
```

```
User Clicks Star
      ↓
onClick() triggered
      ↓
Get instanceId from event
      ↓
Retrieve StarData[instanceId]
      ↓
Log to console (Phase 2)
      ↓
[FUTURE] Trigger camera animation (Phase 3)
      ↓
[FUTURE] Show message overlay (Phase 3)
```

---

## 🎨 Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│  SCENE GRAPH                                                 │
│                                                              │
│  Canvas (WebGL Context)                                      │
│    │                                                         │
│    ├─ Camera (Perspective)                                   │
│    │   └─ position: [0, 0, 50]                              │
│    │                                                         │
│    ├─ Lights                                                 │
│    │   ├─ AmbientLight (intensity: 0.2)                     │
│    │   └─ PointLight (intensity: 1.0)                       │
│    │                                                         │
│    ├─ Environment (preset: "night")                          │
│    │                                                         │
│    ├─ Stars (background, static)                             │
│    │   └─ 5000 particles (drei component)                   │
│    │                                                         │
│    ├─ Galaxy (InstancedMesh) ⭐⭐⭐                            │
│    │   ├─ Geometry: SphereGeometry(1, 12, 12)              │
│    │   ├─ Material: MeshBasicMaterial                       │
│    │   ├─ Instances: 5000                                   │
│    │   └─ Attributes: Matrix, Color                         │
│    │                                                         │
│    └─ OrbitControls                                          │
│        ├─ autoRotate: true                                  │
│        ├─ dampingFactor: 0.05                               │
│        └─ limits: [20, 150]                                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POST-PROCESSING EFFECTS                               │ │
│  │                                                         │ │
│  │  Scene → Render → Bloom → Noise → Vignette → DOF      │ │
│  │           ↓         ↓       ↓        ↓         ↓       │ │
│  │        Glow    Grain   Dark    Blur    Final            │ │
│  │                     edges              Image            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Component Hierarchy

```
App
└── RootLayout
    └── HomePage
        ├── Scene (3D)
        │   ├── Lighting
        │   ├── Environment
        │   ├── Background Stars
        │   ├── Galaxy (InstancedMesh)
        │   ├── OrbitControls
        │   └── EffectComposer
        │       ├── Bloom
        │       ├── Noise
        │       ├── Vignette
        │       └── DepthOfField
        │
        └── HUD Overlay (HTML)
            ├── Title
            ├── Instructions
            └── Add Star Button

[FUTURE - Phase 3]
        └── MessageOverlay (Modal)
            ├── Star Message
            ├── Metadata
            └── Close Button

[FUTURE - Phase 4]
        └── AddStarModal
            ├── Form
            ├── Mood Selector
            └── Submit Button
```

---

## ⚡ Performance Optimization Strategy

### InstancedMesh Benefits
```
Traditional Approach:
  5000 stars × 1 mesh each = 5000 draw calls ❌
  GPU: Overloaded
  FPS: ~15-20

Instanced Approach:
  5000 stars × 1 InstancedMesh = 1 draw call ✅
  GPU: Happy
  FPS: 60
```

### Update Strategy
```
Only update when needed:
  ✅ Matrices: Every frame (animation)
  ✅ Colors: On setup only
  ❌ Geometry: Never (static)
  ❌ Material: Never (static)
```

### Memory Layout
```
InstancedMesh stores:
  • Matrix buffer: 5000 × 16 floats = 320KB
  • Color buffer: 5000 × 3 floats = 60KB
  • Geometry: 1 sphere (shared) = ~2KB
  • Material: 1 material (shared) = ~1KB
  
Total: ~383KB for 5000 stars ✅
```

---

## 🎯 Event System

```
Browser Events
      ↓
React Three Fiber
      ↓
Raycaster (auto)
      ↓
Intersection Detection
      ↓
event.instanceId
      ↓
Handler Functions
```

### Supported Events
- `onClick` → Star click
- `onPointerMove` → Hover detection
- `onPointerOut` → Hover exit
- [Future] `onDoubleClick`
- [Future] `onContextMenu`

---

## 🔮 Future Architecture (Phase 3-5)

```
┌──────────────────────────────────────────────────────────┐
│  BACKEND (Phase 4)                                        │
│                                                           │
│  Supabase (PostgreSQL)                                    │
│    ├─ stars table                                         │
│    ├─ Row Level Security                                  │
│    └─ Real-time subscriptions                             │
│                                                           │
│  Next.js API Routes                                       │
│    ├─ POST /api/star (submit)                            │
│    │   ├─ Zod validation                                  │
│    │   ├─ Fingerprint check                               │
│    │   ├─ OpenAI moderation                               │
│    │   └─ Rate limiting                                   │
│    │                                                      │
│    └─ GET /api/star (fetch)                              │
│        └─ Return approved stars                           │
│                                                           │
│  External Services                                        │
│    ├─ FingerprintJS (identity)                            │
│    ├─ OpenAI API (moderation)                             │
│    └─ Upstash Redis (rate limit)                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📈 Performance Metrics

| Metric | Phase 1-2 | Target (Phase 5) |
|--------|-----------|------------------|
| Draw Calls | 1 | 1 |
| FPS | 60 | 60 |
| Memory | 50MB | <100MB |
| Load Time | ~2s | <3s |
| Lighthouse | N/A | 95+ |
| Bundle Size | ~800KB | <1MB |

---

## 🔐 Security Architecture (Phase 4)

```
User Submits Star
      ↓
1. Client-side validation
      ↓
2. FingerprintJS (get ID)
      ↓
3. POST to /api/star
      ↓
4. Server-side validation (Zod)
      ↓
5. Check duplicates (Supabase)
      ↓
6. Content moderation (OpenAI)
      ↓
7. Rate limit check (Redis)
      ↓
8. Insert to database
      ↓
9. Return success
      ↓
10. Client updates UI
```

---

**This architecture is designed for:**
- ✅ Scalability (10,000+ stars)
- ✅ Performance (60 FPS)
- ✅ Security (moderation + fingerprinting)
- ✅ Maintainability (modular code)
- ✅ Extensibility (easy to add features)

---

*Last Updated: Phase 1 & 2 Complete*
