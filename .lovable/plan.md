# Plan: completar las herramientas pendientes + búsquedas recientes

## 1. Sustituir Favoritos por "Últimas búsquedas" en el Dashboard

- Eliminar la tabla `favorite_items` y el botón ⭐ del Comparador de Precios.
- Crear tabla `recent_searches` (user_id, base_id, tier, enchant, quality, tool, last_used_at) con índice por usuario y `UNIQUE (user_id, tool, base_id, tier, enchant, quality)` para hacer upsert.
- Hook `use-recent-searches.ts` con `record(...)` (upsert + actualizar `last_used_at`) y `list(limit)`. Trim automático: solo conservar las 20 más recientes por usuario.
- Llamar a `record()` desde cada herramienta cuando el usuario cambia la selección (debounced 1.5 s para no spamear escrituras).
- Componente `RecentSearchesPanel` en el Dashboard que muestra tarjetas horizontales con scroll. Cantidad **responsiva** sin desbordar:
  - mobile (<640 px): 4 tarjetas
  - sm (≥640): 6
  - lg (≥1024): 8
  - usando `hidden`/`block` por breakpoint sobre las tarjetas extra, no JS.
- Click → navega a la herramienta original (`tool`) con search params preseleccionados.

## 2. Asistente de Refino (lógica completa)

Reescribir `_authenticated.refining.tsx` con la fórmula real de Albion:

- Selector de **recurso** (Madera, Piedra, Mineral, Cuero, Tela), **Tier** (T4–T8) y **Encantamiento** (.0–.4).
- Inputs: cantidad de recurso refinado deseada, ciudad de refino (con bonus de ciudad correcto), toggles **Premium** y **Foco**.
- Cálculo:
  - Tasa base de retorno: 15 % (sin foco) / 35.7 % (con foco).
  - Bonus por ciudad: +20 % al recurso especializado, +14.7 % con Premium activo (factor real).
  - Coste de materia prima: precio mínimo en la ciudad seleccionada (API Albion para `Tx_resourcebase` + `Tx_resourcebase_LEVEL{N}@N`).
  - Tasa impositiva de la estación: 8 % por uso de estación pública.
  - **Plata por punto de Foco** cuando Foco activo.
- Output: tarjetas con coste total, valor de mercado del refinado, beneficio neto, % ROI, plata/foco. Tabla por ciudad mostrando dónde es más rentable.

## 3. Crafteo (recetas y profit)

Reescribir `_authenticated.crafting.tsx`:

- Catálogo de recetas curado en `src/lib/albion-recipes.ts` (subset realista: bolsas, capas, principales armaduras y armas T4-T8) con: ítem resultante, materiales (recurso refinado + cantidad), categoría de estación.
- Selector de ítem (reutiliza `ITEM_BASES`), Tier, Encantamiento, ciudad de crafteo.
- Toggles: Foco, Premium, "Devolver recursos al refinador" (sí/no para reflejar 36.7% return).
- Lee precios actuales de los materiales y del ítem terminado vía API.
- Calcula: coste total de materiales, fee de estación, valor de venta (compra mín vs venta máx), beneficio neto, % ROI, plata/foco.
- Aviso visual si el profit es negativo.

## 4. Oro & Cartera (persistencia)

Reescribir `_authenticated.gold.tsx`:

- Nueva tabla `gold_transactions` (user_id, type 'buy'|'sell', amount_gold, price_silver, note, created_at) con RLS por usuario.
- Formulario para registrar compra/venta de oro (cantidad, precio en plata por oro, nota opcional).
- Lista editable de transacciones con borrar.
- Cálculos: oro total en cartera, precio medio ponderado de compra, valor actual de mercado (último precio API `/gold`), P/L absoluto y %.
- Gráfica real (no demo) con el historial reciente del oro de la API + overlay de tus transacciones como puntos.
- Recomendación dinámica: "compra" si precio actual < tu precio medio, "vende" si > +5 %.

## 5. Detalles técnicos

- Las búsquedas recientes y transacciones de oro usan RLS estricta (`auth.uid() = user_id`).
- Cliente Supabase directo desde el navegador (mismo patrón que `favorite_items` actual).
- Cero cambios al Comparador de Precios excepto: quitar estrella y añadir llamada a `recordSearch('prices', ...)`.
- Cero cambios al Transporte salvo añadir `recordSearch('transport', ...)`.
- Migraciones: dropear `favorite_items`, crear `recent_searches`, crear `gold_transactions`.

## Resumen visual

```text
Dashboard
├─ Bienvenida
├─ [NUEVO] Últimas búsquedas (responsivo 4/6/8)
├─ Hero
└─ Secciones (Prices, Refining, Crafting, Transport, Gold)

Refining   → calculadora real con foco/premium/ciudad
Crafting   → recetas + profit neto
Gold       → transacciones persistidas + PnL + gráfica
```

Confirmar para implementar todo en este orden.
