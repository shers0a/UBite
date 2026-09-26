The dish detail screen's header — and the system's strictest rule about missing data.

```jsx
<DishDetailHeader
  name="Pui la cuptor cu cartofi" price={17} weight="320 g"
  tags={['gluten']} allergens={['Gluten', 'Lactoză']} allergenSource="Cantina Mihail Kogălniceanu"
  rating={4.2} ratingCount={38} favourite onFavourite={toggle} onRate={rate} slotId="dish-hero" />
```

- With no allergen data the block reads **"Informație indisponibilă"** plus a line naming the canteen as the authority. Never an empty list, never a silent absence.
- When allergens ARE listed, their source is named.
- The photo carries a scrim so the favourite control keeps 3:1 contrast over any image.
