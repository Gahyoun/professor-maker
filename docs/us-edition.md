# U.S. English edition

Open `en.html` for the English faculty workspace and `index.html` for the Korean edition. A run's locale determines its calendar. Language links open the other edition; they do not redate an active run. Import and checkpoint restoration reject a run from the other edition.

## Calendar and terminology

The U.S. edition starts in September and keeps the original 96 simulated months. Fall starts in September, spring in January, and June–August is summer research. Midterms occur in October/March and finals in December/May. Stipend commitments are reviewed in September. Overseas abstracts are prepared in June/July for July/August travel. The Korean calendar is unchanged.

These are simplified game policies, inspired by published [Harvard FAS calendars](https://registrar.fas.harvard.edu/calendars), rather than a universal calendar for U.S. or U.K. universities. Graduation remains tied to the game's normalized milestones.

The interface uses undergraduate researcher, master's student, Ph.D. student, candidacy/qualifying examination, thesis/dissertation defense, faculty service and sabbatical terminology. Admissions use fictional seeded English names and a 4.0 GPA scale. The faculty portal is an original design with navy navigation, serif headings and clear service menus; it does not copy an institution's marks.

## Budgets and content

One modeled budget unit displays as $250 in this edition. This is a game scale, not an exchange rate. Budgets represent illustrative direct expenses for one advisee; tuition and institutional overhead are not modeled. Automatic departmental advances, restricted stipend funds and the original debt/funding rules remain in effect.

All 73 existing fields have English labels and deterministic field-specific fictional research titles. The engine's topic IDs and random draws are preserved. English CV exports retain the student's own lab scene and print on U.S. Letter; Korean CVs print on A4. Historic imported CV labels and frozen images are preserved.

## Persistence

Korean localStorage keys and databases retain their original names. The U.S. edition uses `pm-us-*` keys in its own `pm-us-edition-v1` IndexedDB store, with scoped localStorage fallback. This avoids competing with a full Korean archive for localStorage capacity. Successful fallback recovery fills only missing database keys and removes only identical recovered duplicates. Per-key atomic writes prevent one tab's preference update from erasing another tab's run.

Checkpoints and optional analytics consent/data also use separate edition namespaces. Neither edition reuses the other's analytics consent.
