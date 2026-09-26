The states every UBite screen must define, plus two small home-screen controls.

```jsx
<EmptyState art="assets/illustrations/empty-menu.svg" title="Meniul de azi nu e publicat încă"
  body="De obicei apare până la 10:30. Îți arătăm meniul de ieri până atunci."
  action="Vezi meniul de ieri" onAction={showYesterday} />
<OfflineBanner variant="offline" updatedLabel="Actualizat la 12:04" queued={1} />
<OfflineBanner variant="stale" updatedLabel="acum 40 de minute" />
<WaitReport options={[2,5,10,15]} onSubmit={report} state="idle" />
<CrowdingByHour data={hours} nowIndex={5} />
```

- An empty state explains **why** and **what happens next**; it is never just an icon and a sad sentence.
- Offline always shows the age of what you are looking at, and acknowledges queued actions.
- `WaitReport` is one interaction and then it is done — `state="done"` replaces it with a thank-you line.
