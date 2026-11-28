# Physio Hunch

Physio Hunch is paused for clinical and scoring review. The [public site](https://sophiang-builds.github.io/Physio-hunch/) displays a review notice. The iOS app opens to the same notice.

## Case review

The audit covered 105 distinct web cases. It classified 21 as do not release, 48 as requiring revision and 36 as candidates for expert review. There are zero playable cases. The [36 candidates](review/candidates.json) and their [case briefs](review/candidate-briefs.psv) are retained for review. Prior versions of the other cases are available in Git history.

The web and native release banks under `ios/PhysioHunch/Resources/Data` are empty. The artwork catalogue is separate from case selection. Legacy examples under `ios/EngineTests/Fixtures` exercise the scoring code in tests and are outside the app target.

## Development

Open `ios/PhysioHunch.xcodeproj` in Xcode 26 for the native project. CI runs the engine tests and builds the app for the iOS simulator. The native engine lives in `ios/PhysioHunch/Engine` and the web engine in `site/game.js`. The public notice loads no game script.

See the [character artwork](docs/characters.md), [expansion artwork](docs/expansion.md), [brand guide](docs/brand.md) and [background research](research/viva-research.md).
