The text field (48px tall, 16px text) and the skeleton loader.

```jsx
<Input label="Preț" value="9" suffix="lei" inputMode="decimal" />
<Input label="Cod" error="Codul nu mai este valabil" icon="qr-code" />
<Skeleton width="60%" height={20} />
```

- Font size is 16px and never smaller — anything less makes iOS zoom the page on focus.
- Focus is a 2px accent inset plus the global ring; do not override it.
- Loading states are built from `Skeleton` shaped like the final layout, never a spinner on an empty screen.
