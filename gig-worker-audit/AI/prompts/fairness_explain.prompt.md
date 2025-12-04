name: Continuous Integration

on:
  # Trigger the workflow on pull request events targeting the main or dev branch
  pull_request:
    branches: [ main, dev ]

jobs:
  build_and_test:
    name: Build & Test
    runs-on: ubuntu-latest
    
    steps:
      # 1. Checkout the repository code
      - name: Checkout Repository
        uses: actions/checkout@v4

      # 2. Setup pnpm (assuming pnpm is used based on the task description)
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      # 3. Setup Node.js environment
      - name: Setup Node.js 18
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm' # Cache node modules using pnpm

      # 4. Install dependencies
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      # 5. Run the build process
      - name: Run Build
        # This step verifies the application can compile successfully
        run: pnpm build

      # 6. Run tests
      - name: Run Tests
        # Runs the Jest tests; '|| true' ensures the step doesn't fail the workflow
        # if the 'test' script is temporarily missing, though in a proper CI, you'd usually fail on test errors.
        run: pnpm test