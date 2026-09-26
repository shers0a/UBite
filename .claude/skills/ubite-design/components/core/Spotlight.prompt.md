A feature card with a drawn character — the "special offers" slot of the reference apps, used only for things UBite really does.

```jsx
<Spotlight art={A.spot('run')} eyebrow="Sfat pentru marți"
  title="La 11:30 aștepți cam 2 minute. La 13:00, cam 12." action="Vezi orele" onAction={toHours} />
<Spotlight art={A.spot('queue')} eyebrow="Ajută-i pe colegi"
  title="Spune cât ai stat la coadă. Durează două secunde." action="Raportez" onAction={openReport} />
```

- Content must be true: a tip computed from the typical-crowding data, the wait report, the menu alert, the install prompt. **Never an offer, discount or event the canteen has not announced.**
- The text keeps the left 58%; the character bleeds off the bottom-right corner and scales with the card.
- In a horizontal rail, give each card `flex: none`, a width under the rail's, `scroll-snap-align: start`, and dots beneath (see the student-app kit).
