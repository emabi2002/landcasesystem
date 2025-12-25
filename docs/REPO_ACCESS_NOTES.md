# Repository Access Notes

This workspace was initially set up with the `landcasesystem` repository. To move on to the new `landauditsystem` project, cleanly remove the old checkout and confirm your Git remotes point to the new repository.

## Disconnect from `landcasesystem`
Use one of the options below so the old remote (`https://github.com/emabi2002/landcasesystem.git`) is no longer present in your working copy:

```bash
# Option A: remove the directory entirely
cd /workspace
rm -rf landcasesystem

# Option B: keep a backup but disable the remote
cd /workspace/landcasesystem
git remote remove origin
cd /workspace
mv landcasesystem landcasesystem-old
```

Either approach ensures there is no active `origin` pointing at `landcasesystem` while you work on the new project.

## Connect to `landauditsystem`
1. Install Git (if it is not already available).
2. Clone the new repository from GitHub:
   ```bash
   git clone https://github.com/emabi2002/landauditsystem.git
   cd landauditsystem
   ```
3. Verify the configured remote to confirm the workspace is now connected to `landauditsystem`:
   ```bash
   git remote -v
   ```
   You should see `origin` pointing to `https://github.com/emabi2002/landauditsystem.git` for both fetch and push.

If you are working in a pre-provisioned environment, you might already have the new repo present; running `git status` or `git remote -v` will confirm the current workspace state.
