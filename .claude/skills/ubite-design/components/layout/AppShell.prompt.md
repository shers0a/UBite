The chrome around every UBite screen.

```jsx
<AppHeader right={<IconButton name="settings" label="Setări" />} />
<AppHeader title="Pui la cuptor" onBack={goBack} />
<Announcement title="Vineri închidem la 15:00" date="18 oct" tone="warning" />
<Sheet open title="Cât ai așteptat?" onClose={close}>…</Sheet>
<Toast message="Bon înregistrat. Mai ai o masă până la cea gratuită." tone="success" icon="circle-check" />
```

- The home screen has no back button: the wordmark sits where it would be.
- `Sheet` is absolutely positioned; put it inside the phone frame, not the document body.
- There are no content tabs anywhere in UBite — the menu is one scrolling surface.
