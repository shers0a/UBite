One dish in today's menu, plus the sticky category heading above the group.

```jsx
<CategoryHeader title="Fel principal" icon="utensils" count={4} />
<DishRow name="Pui la cuptor cu cartofi" price={17} tags={['gluten']} slotId="dish-pui" onClick={openDetail} />
<DishRow name="Ciorbă de perișoare" price={9} loading />
<DishRow name="Sarmale" price={15} unavailable />
```

- Categories keep a fixed order and all live on one scrolling surface — never behind tabs.
- Photos are `image-slot` drop targets until real canteen photography exists; load `assets/image-slot.js` on the page for them to work.
- `loading` renders a skeleton with the row's exact footprint.
