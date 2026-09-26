Chips filter, badges inform, dietary tags make a food-safety claim.

```jsx
<Chip selected icon="leaf" count={6}>Vegetarian</Chip>
<Badge tone="warning" icon="circle-alert">aproximativ</Badge>
<DietaryTag kind="gluten" lang="ro" />
<DietaryTag kind="unknown" />   {/* "Informație indisponibilă" */}
```

- A chip is tappable and 40px tall; a badge is not tappable and must never be styled to look like one.
- Dietary tags always show the word. Missing allergen data reads "Informație indisponibilă" — it never implies absence.
