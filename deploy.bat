@echo off
git commit -m "Optimize Vercel PDF generation and add real-time SOAP history"
git tag -a v1.0.0-cloud-render -m "Stable global PDF rendering pipeline"
git push origin mvp-launch
git push origin v1.0.0-cloud-render
echo.
echo ✅ Deployment complete! Check Vercel dashboard for build status.
