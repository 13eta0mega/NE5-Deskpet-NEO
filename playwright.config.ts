import { defineConfig } from '@playwright/test'
export default defineConfig({testDir:'./tests/visual',timeout:30000,workers:1,use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1280,height:900},deviceScaleFactor:1},webServer:{command:'npm run preview -- --port 4173',port:4173,reuseExistingServer:false},outputDir:'test-results'})
