# Deployment TODO Notes

This file tracks follow-up actions from the VPS startup issue:

## Incident recap
- Container failed to start with: "Cannot find module /usr/src/app/dist/main"
- Root cause: Nest build output is under `dist/src/main.js`, not `dist/main`

## Done
- [x] Update Docker startup command to `node dist/src/main.js`
- [x] Update production npm script (`start:prod`) to `node dist/src/main.js`
- [x] Add Docker `HEALTHCHECK` against `GET /`

## To do
- [ ] Rebuild and redeploy in VPS using latest image
- [ ] Confirm container reaches `healthy` status after deploy
- [ ] Review Node base image vulnerabilities and harden image if needed
- [ ] Consider adding a dedicated `/health` endpoint for deeper checks (DB, dependencies)
- [ ] Document final deployment flow in README

## VPS redeploy commands
```bash
docker compose build --no-cache api
docker compose up -d api
docker ps
```

## Verify after deploy
- App is reachable on expected port
- `docker ps` shows `healthy` for API container
- No restart loop in container logs
