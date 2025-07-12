# Git Branching Procedure

This guide outlines our simple Git branching strategy, based loosely on an informal [git-flow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) standard. The goal is to ensure efficient collaboration and code stability without unnecessary complexity.

## Branching Strategy

We maintain two key types of branches:

1. **`main` Branch**: This branch always contains the most stable version of the code. All completed and reviewed features are merged here.
2. **`feature/feature-name` Branches**: Feature branches are created off of the `main` branch for developing specific features, bug fixes, or other isolated pieces of work.

### Workflow Overview

1. **Start New Work**:
   To begin work on a new feature, create a new branch off of `main` using the following naming convention:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

   Example:

   ```bash
   git checkout -b feature/add-user-authentication
   ```

2. **Keep Your Branch Updated**:
   Regularly pull changes from `main` into your feature branch to ensure you're working with the most current version of the codebase. A good rule of thumb is to merge in `main` at least once a week, or more often if a related system is being modified.

   To pull changes from `main` into your branch:

   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-feature-name
   git merge main
   ```

   For more advanced users, you may prefer rebasing or using a fast-forward merge:

   ```bash
   git pull --rebase origin main
   ```

   **Note:** For this simple setup, merging is sufficient. In more complex projects, rebasing or fast-forward merges are often recommended to maintain a cleaner history.

3. **Create a Pull Request (PR) When Ready**:
   When your feature is complete, create a pull request (PR) to merge your branch into `main`. Use the provided PR template [(see below)](#pull-request-template).

   Make sure you have pulled the latest changes from `main` into your branch before creating the PR, to ensure any conflicts are resolved before the review process.

   If review is taking longer than expected, and `main` has been updated in the meantime resulting in potential merge conflicts, pull in the latest changes from `main` to keep your branch up-to-date during the review process (and communicate this to the reviewer).

   **Important:** Mention in Teams that the PR is ready and request a review, providing a link to said PR.

4. **Concurrent Work and Collaboration**:
   If two people need to work on related parts of the system:
   - Coordinate early on which branches to create.
   - Regularly pull in `main` to prevent conflicts from piling up.
   - Optionally, use rebase or fast-forward merges to keep the history clean and up-to-date. Again, *this is not necessary for this simple setup*.
   - Clear communication is key—coordinate with your teammates to avoid unnecessary complications.
   - You may cross-merge branches if needed, but if so, ensure to note in your PR which branches are the 'parent/dependency' branches that need to be reviewed first.

5. **Merging the PR**:
   Once the PR is reviewed and approved, it can be merged into `main`.

   **Note:** Some projects may recommend you to use the "Squash and Merge" option if available to keep a cleaner commit history. However, this is not needed for this simple setup and may overcomplicate the process.

## Pull Request Template

```md
# Summary
- List what changes you made.
- Mention any specific functionality or bug fixes introduced.

# Remarks (Optional)
- Add any additional notes here, such as issues faced, potential improvements, or testing notes.
```

### Example

```md
# Summary
- Added user authentication flow (login, signup, logout).
- Integrated JWT-based token validation.
- Updated frontend routes to handle authenticated/unauthenticated states.

# Remarks
- Note: Need to revisit token expiration handling in the next sprint.
- Backend tests were updated; frontend tests pending.

- To test changes, use the following credentials:
    - Username: testuser
    - Password: testpassword
- Go to the `/profile` route to see the authenticated state.
```

---

This process is designed to be straightforward while allowing for flexibility and efficient collaboration. Remember to communicate often, pull from `main` regularly, and be proactive in addressing merge conflicts.

Happy coding!
