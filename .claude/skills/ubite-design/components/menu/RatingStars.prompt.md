Star ratings and the five loyalty dots.

```jsx
<RatingStars value={4.2} count={38} />
<RatingStars value={0} interactive onRate={setRating} />
<LoyaltyDots filled={4} total={5} onAdd={openCamera} />
<LoyaltyDots signedIn={false} />
```

- Stars always sit beside the numeric average and its sample size — never alone.
- Interactive stars are 44px targets even though the glyph is 20px.
- Signed out, loyalty collapses to a single quiet line, never a sign-in wall.
